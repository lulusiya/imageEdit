package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.domain.TaskStage;

public class StageFailureException extends RuntimeException {

    private final TaskStage stage;

    public StageFailureException(TaskStage stage, String message) {
        super(message);
        this.stage = stage;
    }

    public StageFailureException(TaskStage stage, String message, Throwable cause) {
        super(message, cause);
        this.stage = stage;
    }

    public TaskStage getStage() {
        return stage;
    }
}
