package com.xiaoying.imageedit.service;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import com.xiaoying.imageedit.domain.TaskStatus;
import com.xiaoying.imageedit.domain.Template;
import com.xiaoying.imageedit.mapper.AssetMapper;
import com.xiaoying.imageedit.mapper.TaskMapper;
import com.xiaoying.imageedit.mapper.TemplateMapper;
import com.xiaoying.imageedit.service.execution.TaskAcceptedEvent;
import com.xiaoying.imageedit.storage.MediaStore;
import com.xiaoying.imageedit.web.ApiException;
import com.xiaoying.imageedit.web.dto.AcceptedTaskResponse;
import com.xiaoying.imageedit.web.dto.CreateTaskRequest;
import com.xiaoying.imageedit.web.dto.SessionUser;
import com.xiaoying.imageedit.web.dto.TaskResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final TemplateMapper templateMapper;
    private final AssetMapper assetMapper;
    private final TaskMapper taskMapper;
    private final SimulationSettingsService simulationSettings;
    private final ApplicationEventPublisher eventPublisher;
    private final MediaStore mediaStore;

    public TaskService(TemplateMapper templateMapper,
                       AssetMapper assetMapper,
                       TaskMapper taskMapper,
                       SimulationSettingsService simulationSettings,
                       ApplicationEventPublisher eventPublisher,
                       MediaStore mediaStore) {
        this.templateMapper = templateMapper;
        this.assetMapper = assetMapper;
        this.taskMapper = taskMapper;
        this.simulationSettings = simulationSettings;
        this.eventPublisher = eventPublisher;
        this.mediaStore = mediaStore;
    }

    @Transactional
    public AcceptedTaskResponse accept(SessionUser user, CreateTaskRequest request) {
        Template template = templateMapper.findById(request.templateId());
        if (template == null) {
            throw ApiException.notFound("TEMPLATE_NOT_FOUND", "模板不存在或已下架");
        }

        List<String> assetIds = request.assetIds();
        if (assetIds.size() != template.getRequiredImageCount()) {
            throw ApiException.badRequest("INVALID_ASSET_COUNT",
                    "素材数量与模板要求不一致（需要 " + template.getRequiredImageCount() + " 张）");
        }
        Set<String> uniqueIds = new HashSet<>(assetIds);
        if (uniqueIds.size() != assetIds.size()) {
            throw ApiException.badRequest("DUPLICATE_ASSET", "同一张素材不能重复提交");
        }

        List<String> acceptedTypes = TemplateService.splitMimeTypes(template.getAcceptedMimeTypes());
        for (int index = 0; index < assetIds.size(); index++) {
            String assetId = assetIds.get(index);
            int slot = index + 1;
            if (assetId == null || assetId.isBlank()) {
                throw ApiException.badRequest("INVALID_ASSET", "第 " + slot + " 张素材为空");
            }
            Asset asset = assetMapper.findByIdAndOwner(assetId, user.id());
            if (asset == null) {
                throw ApiException.badRequest("ASSET_NOT_AVAILABLE",
                        "第 " + slot + " 张素材不存在或无权访问，请重新上传");
            }
            if (!template.getId().equals(asset.getTemplateId())) {
                throw ApiException.badRequest("ASSET_TEMPLATE_MISMATCH",
                        "第 " + slot + " 张素材不属于当前模板");
            }
            if (!acceptedTypes.contains(asset.getContentType())) {
                throw ApiException.badRequest("ASSET_TYPE_MISMATCH",
                        "第 " + slot + " 张素材格式不符合模板要求");
            }
            if (asset.getSizeBytes() != null && asset.getSizeBytes() > template.getMaxFileSizeBytes()) {
                throw ApiException.badRequest("ASSET_SIZE_MISMATCH",
                        "第 " + slot + " 张素材超过模板大小限制");
            }
        }

        SimulationSnapshot simulation = simulationSettings.applyOverride(
                simulationSettings.current(), request.simulation());

        LocalDateTime now = LocalDateTime.now();
        Task task = new Task();
        task.setOwnerId(user.id());
        task.setTemplateId(template.getId());
        task.setStatus(TaskStatus.QUEUED.name());
        task.setStage(null);
        task.setCheckDelayMs(simulation.checkDelayMs());
        task.setGenerateDelayMs(simulation.generateDelayMs());
        task.setFinalizeDelayMs(simulation.finalizeDelayMs());
        task.setFailStage(simulation.failStage());
        task.setCreatedAt(now);
        task.setUpdatedAt(now);
        taskMapper.insert(task);

        for (int index = 0; index < assetIds.size(); index++) {
            taskMapper.insertTaskAsset(task.getId(), index, assetIds.get(index));
        }

        // Delivered after commit so the worker never observes uncommitted rows.
        eventPublisher.publishEvent(new TaskAcceptedEvent(task.getId()));

        return new AcceptedTaskResponse(task.getId(), task.getStatus(), format(now));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(SessionUser user) {
        return taskMapper.findByOwner(user.id()).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse get(SessionUser user, long taskId) {
        return toResponse(requireOwnedTask(taskId, user.id()));
    }

    @Transactional(readOnly = true)
    public Task requireOwnedTask(long taskId, String ownerId) {
        Task task = taskMapper.findByIdAndOwner(taskId, ownerId);
        if (task == null) {
            throw ApiException.notFound("TASK_NOT_FOUND", "任务不存在或无权访问");
        }
        return task;
    }

    public byte[] loadResult(Task task) {
        if (!TaskStatus.SUCCEEDED.name().equals(task.getStatus()) || task.getResultKey() == null) {
            throw ApiException.notFound("RESULT_NOT_READY", "任务尚未生成可预览的结果");
        }
        try {
            return mediaStore.read(task.getResultKey());
        } catch (RuntimeException ex) {
            throw ApiException.notFound("RESULT_FILE_MISSING", "成品文件不存在");
        }
    }

    private TaskResponse toResponse(Task task) {
        String resultUrl = task.getResultKey() == null ? null : "/api/tasks/" + task.getId() + "/result-file";
        return new TaskResponse(
                task.getId(),
                task.getTemplateId(),
                task.getTemplateTitle(),
                format(task.getCreatedAt()),
                format(task.getUpdatedAt()),
                task.getStatus(),
                task.getStage(),
                resultUrl,
                task.getFailureReason());
    }

    private static String format(LocalDateTime time) {
        return time == null ? null : TIME_FORMAT.format(time);
    }
}
