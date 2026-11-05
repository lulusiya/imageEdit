package com.xiaoying.imageedit.service.execution;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import com.xiaoying.imageedit.domain.TaskStage;
import com.xiaoying.imageedit.domain.TaskStatus;
import com.xiaoying.imageedit.storage.MediaStore;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class TaskExecutionServiceTest {

    private static final byte[] VALID_PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    private FakeRepository repository;
    private RecordingProgressStore progressStore;
    private RecordingSleeper sleeper;
    private FakeComposer composer;
    private FakeMediaStore mediaStore;
    private TaskExecutionService service;

    @BeforeEach
    void setUp() {
        repository = new FakeRepository();
        progressStore = new RecordingProgressStore();
        sleeper = new RecordingSleeper();
        composer = new FakeComposer();
        mediaStore = new FakeMediaStore();
        service = new TaskExecutionService(repository, progressStore, mediaStore, composer, sleeper);
    }

    @Test
    void runsStagesInOrderAndMarksSuccessOnlyAfterFinalize() {
        repository.task = task(null);
        repository.assets = assets();

        service.execute(42L);

        assertEquals(List.of(
                "RUNNING:CHECK",
                "RUNNING:GENERATE",
                "RUNNING:FINALIZE",
                "SUCCEEDED:results/task-42.png"), progressStore.events);
        assertEquals(1, composer.calls);
        assertEquals(List.of(10L, 20L, 30L), sleeper.delays);
    }

    @ParameterizedTest
    @EnumSource(TaskStage.class)
    void injectedFailureStopsExecutionAndPersistsStage(TaskStage failureStage) {
        repository.task = task(failureStage.name());
        repository.assets = assets();

        service.execute(42L);

        List<String> expectedRuns = new ArrayList<>();
        expectedRuns.add("RUNNING:CHECK");
        if (failureStage != TaskStage.CHECK) {
            expectedRuns.add("RUNNING:GENERATE");
        }
        if (failureStage == TaskStage.FINALIZE) {
            expectedRuns.add("RUNNING:FINALIZE");
        }
        assertEquals(expectedRuns, progressStore.events.subList(0, expectedRuns.size()));

        String failureEvent = progressStore.events.get(progressStore.events.size() - 1);
        assertTrue(failureEvent.startsWith("FAILED:" + failureStage.name() + ":"), failureEvent);
        assertEquals(expectedRuns.size(), sleeper.delays.size());
        assertEquals(0, composer.calls, "result composition must never run after an injected failure");
        assertFalse(progressStore.events.stream().anyMatch(event -> event.startsWith("SUCCEEDED")));
    }

    @Test
    void composerFailureIsReportedAsFinalizeFailure() {
        repository.task = task(null);
        repository.assets = assets();
        composer.failure = new StageFailureException(TaskStage.FINALIZE, "结果整理失败：素材图片无法解码。");

        service.execute(42L);

        assertEquals("FAILED:FINALIZE:结果整理失败：素材图片无法解码。",
                progressStore.events.get(progressStore.events.size() - 1));
        assertFalse(progressStore.events.stream().anyMatch(event -> event.startsWith("SUCCEEDED")));
    }

    @Test
    void unreadableAssetFailsDuringCheckAndSkipsLaterStages() {
        repository.task = task(null);
        repository.assets = assets();
        mediaStore.readable = false;

        service.execute(42L);

        assertEquals(List.of("RUNNING:CHECK",
                        "FAILED:CHECK:素材检查失败：第 1 张素材文件不可读。"),
                progressStore.events);
        assertEquals(0, composer.calls);
        assertEquals(List.of(10L), sleeper.delays);
    }

    @Test
    void terminalTaskIsNotExecutedAgain() {
        repository.task = task(null);
        repository.task.setStatus(TaskStatus.FAILED.name());
        repository.assets = assets();

        service.execute(42L);

        assertTrue(progressStore.events.isEmpty());
        assertEquals(0, composer.calls);
        assertTrue(sleeper.delays.isEmpty());
    }

    private Task task(String failStage) {
        Task task = new Task();
        task.setId(42L);
        task.setOwnerId("user-a");
        task.setTemplateId("travel-postcard");
        task.setStatus(TaskStatus.QUEUED.name());
        task.setCheckDelayMs(10);
        task.setGenerateDelayMs(20);
        task.setFinalizeDelayMs(30);
        task.setFailStage(failStage);
        task.setRequiredImageCount(2);
        task.setAcceptedMimeTypes("image/jpeg,image/png");
        task.setMaxFileSizeBytes(5_242_880L);
        task.setResultCaption("TRAVEL POSTCARD");
        task.setAccentColor("#C8B273");
        return task;
    }

    private List<Asset> assets() {
        return List.of(asset("asset-1", "assets/user-a/one.png"), asset("asset-2", "assets/user-a/two.png"));
    }

    private Asset asset(String id, String key) {
        Asset asset = new Asset();
        asset.setId(id);
        asset.setOwnerId("user-a");
        asset.setTemplateId("travel-postcard");
        asset.setStorageKey(key);
        asset.setContentType("image/png");
        asset.setSizeBytes((long) VALID_PNG.length);
        return asset;
    }

    private static final class FakeRepository implements TaskExecutionRepository {

        private Task task;
        private List<Asset> assets = List.of();

        @Override
        public Task findTask(long taskId) {
            return task;
        }

        @Override
        public List<Asset> findAssets(long taskId) {
            return assets;
        }
    }

    private static final class RecordingProgressStore implements TaskProgressStore {

        private final List<String> events = new ArrayList<>();

        @Override
        public void markRunning(long taskId, String stage) {
            events.add("RUNNING:" + stage);
        }

        @Override
        public void markSucceeded(long taskId, String resultKey) {
            events.add("SUCCEEDED:" + resultKey);
        }

        @Override
        public void markFailed(long taskId, String stage, String reason) {
            events.add("FAILED:" + stage + ":" + reason);
        }
    }

    private static final class RecordingSleeper implements StageSleeper {

        private final List<Long> delays = new ArrayList<>();

        @Override
        public void sleep(long millis) {
            delays.add(millis);
        }
    }

    private static final class FakeComposer implements ResultComposer {

        private int calls;
        private RuntimeException failure;

        @Override
        public String compose(Task task, List<Asset> assets) {
            calls++;
            if (failure != null) {
                throw failure;
            }
            return "results/task-42.png";
        }
    }

    private static final class FakeMediaStore implements MediaStore {

        private boolean readable = true;

        @Override
        public String saveAsset(byte[] bytes, String contentType, String ownerId) {
            throw new UnsupportedOperationException("not used");
        }

        @Override
        public byte[] read(String storageKey) {
            if (!readable) {
                throw new com.xiaoying.imageedit.storage.StorageException("missing");
            }
            return VALID_PNG;
        }

        @Override
        public void delete(String storageKey) {
            throw new UnsupportedOperationException("not used");
        }
    }
}
