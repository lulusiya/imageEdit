package com.xiaoying.imageedit.controller;

import com.xiaoying.imageedit.domain.Task;
import com.xiaoying.imageedit.domain.TaskStatus;
import com.xiaoying.imageedit.service.SessionService;
import com.xiaoying.imageedit.service.TaskService;
import com.xiaoying.imageedit.web.ApiException;
import com.xiaoying.imageedit.web.dto.AcceptedTaskResponse;
import com.xiaoying.imageedit.web.dto.CreateTaskRequest;
import com.xiaoying.imageedit.web.dto.SessionUser;
import com.xiaoying.imageedit.web.dto.TaskResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;
    private final SessionService sessionService;

    public TaskController(TaskService taskService, SessionService sessionService) {
        this.taskService = taskService;
        this.sessionService = sessionService;
    }

    @PostMapping("/tasks")
    public ResponseEntity<AcceptedTaskResponse> create(@Valid @RequestBody CreateTaskRequest body,
                                                       HttpServletRequest request) {
        SessionUser user = sessionService.requireUser(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(taskService.accept(user, body));
    }

    @GetMapping("/tasks")
    public List<TaskResponse> list(HttpServletRequest request) {
        SessionUser user = sessionService.requireUser(request);
        return taskService.list(user);
    }

    @GetMapping("/tasks/{id}")
    public TaskResponse detail(@PathVariable long id, HttpServletRequest request) {
        SessionUser user = sessionService.requireUser(request);
        return taskService.get(user, id);
    }

    @GetMapping("/tasks/{id}/result-file")
    public ResponseEntity<byte[]> resultFile(@PathVariable long id, HttpServletRequest request) {
        SessionUser user = sessionService.requireUser(request);
        Task task = taskService.requireOwnedTask(id, user.id());
        if (!TaskStatus.SUCCEEDED.name().equals(task.getStatus())) {
            throw ApiException.notFound("RESULT_NOT_READY", "任务尚未生成可预览的结果");
        }
        byte[] bytes = taskService.loadResult(task);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePrivate())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"result-" + id + ".png\"")
                .body(bytes);
    }
}
