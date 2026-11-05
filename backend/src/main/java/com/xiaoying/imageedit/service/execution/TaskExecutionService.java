package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import com.xiaoying.imageedit.domain.TaskStage;
import com.xiaoying.imageedit.domain.TaskStatus;
import com.xiaoying.imageedit.service.TemplateService;
import com.xiaoying.imageedit.storage.MediaStore;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Executes the three simulated stages: CHECK -> GENERATE -> FINALIZE.
 * Each stage writes its own persistable stage marker before doing work.
 */
@Service
public class TaskExecutionService {

    private static final Logger log = LoggerFactory.getLogger(TaskExecutionService.class);

    private final TaskExecutionRepository repository;
    private final TaskProgressStore progressStore;
    private final MediaStore mediaStore;
    private final ResultComposer resultComposer;
    private final StageSleeper sleeper;

    public TaskExecutionService(TaskExecutionRepository repository,
                                TaskProgressStore progressStore,
                                MediaStore mediaStore,
                                ResultComposer resultComposer,
                                StageSleeper sleeper) {
        this.repository = repository;
        this.progressStore = progressStore;
        this.mediaStore = mediaStore;
        this.resultComposer = resultComposer;
        this.sleeper = sleeper;
    }

    public void execute(long taskId) {
        Task task = repository.findTask(taskId);
        if (task == null) {
            log.warn("Task {} not found, skip execution", taskId);
            return;
        }
        if (TaskStatus.isTerminal(task.getStatus())) {
            log.info("Task {} is already terminal ({}), skip execution", taskId, task.getStatus());
            return;
        }

        List<Asset> assets = repository.findAssets(taskId);
        TaskStage current = null;
        try {
            log.info("Task {} started", taskId);

            current = TaskStage.CHECK;
            runStage(task, current, task.getCheckDelayMs(), () -> verifyAssets(task, assets));

            current = TaskStage.GENERATE;
            runStage(task, current, task.getGenerateDelayMs(), () -> {
                // Simulated generation: the stage marker and delay are the observable work.
            });

            current = TaskStage.FINALIZE;
            runStage(task, current, task.getFinalizeDelayMs(), () -> {
                String resultKey = resultComposer.compose(task, assets);
                progressStore.markSucceeded(taskId, resultKey);
                log.info("Task {} succeeded, result={}", taskId, resultKey);
            });
        } catch (StageFailureException ex) {
            log.info("Task {} failed at stage {}: {}", taskId, ex.getStage(), ex.getMessage());
            progressStore.markFailed(taskId, ex.getStage().name(), ex.getMessage());
        } catch (Exception ex) {
            log.error("Task {} failed unexpectedly", taskId, ex);
            progressStore.markFailed(taskId,
                    current == null ? null : current.name(),
                    "任务处理异常，请稍后重新提交。");
        }
    }

    private void runStage(Task task, TaskStage stage, Integer delayMs, Runnable action) {
        progressStore.markRunning(task.getId(), stage.name());
        sleeper.sleep(delayMs == null ? 0 : Math.max(0, delayMs));
        if (stage == TaskStage.parseOrNull(task.getFailStage())) {
            throw new StageFailureException(stage, simulatedFailureReason(stage));
        }
        action.run();
    }

    private void verifyAssets(Task task, List<Asset> assets) {
        int required = task.getRequiredImageCount() == null ? 0 : task.getRequiredImageCount();
        if (assets.size() != required) {
            throw new StageFailureException(TaskStage.CHECK,
                    "素材检查失败：素材数量与模板要求不一致。");
        }

        List<String> acceptedTypes = TemplateService.splitMimeTypes(task.getAcceptedMimeTypes());
        for (int index = 0; index < assets.size(); index++) {
            int slot = index + 1;
            Asset asset = assets.get(index);
            if (asset == null || !Objects.equals(task.getOwnerId(), asset.getOwnerId())) {
                throw new StageFailureException(TaskStage.CHECK,
                        "素材检查失败：第 " + slot + " 张素材不属于当前用户。");
            }
            if (!acceptedTypes.contains(asset.getContentType())) {
                throw new StageFailureException(TaskStage.CHECK,
                        "素材检查失败：第 " + slot + " 张素材格式不受支持。");
            }
            if (task.getMaxFileSizeBytes() != null && asset.getSizeBytes() != null
                    && asset.getSizeBytes() > task.getMaxFileSizeBytes()) {
                throw new StageFailureException(TaskStage.CHECK,
                        "素材检查失败：第 " + slot + " 张素材超过大小限制。");
            }
            byte[] bytes;
            try {
                bytes = mediaStore.read(asset.getStorageKey());
            } catch (RuntimeException ex) {
                throw new StageFailureException(TaskStage.CHECK,
                        "素材检查失败：第 " + slot + " 张素材文件不可读。", ex);
            }
            if (bytes == null || bytes.length == 0 || !isReadableImage(bytes)) {
                throw new StageFailureException(TaskStage.CHECK,
                        "素材检查失败：第 " + slot + " 张素材文件不可读或格式不支持。");
            }
        }
    }

    private static boolean isReadableImage(byte[] bytes) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            return image != null;
        } catch (IOException | RuntimeException ex) {
            return false;
        }
    }

    private static String simulatedFailureReason(TaskStage stage) {
        return switch (stage) {
            case CHECK -> "素材检查失败：模拟校验发现上传素材不可用，请重新上传后再试。";
            case GENERATE -> "模拟生成失败：生成器返回错误（由失败注入触发）。";
            case FINALIZE -> "结果整理失败：成品文件写入失败（由失败注入触发）。";
        };
    }
}
