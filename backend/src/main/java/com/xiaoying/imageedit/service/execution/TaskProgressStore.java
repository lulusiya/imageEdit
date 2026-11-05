package com.xiaoying.imageedit.service.execution;

public interface TaskProgressStore {

    void markRunning(long taskId, String stage);

    void markSucceeded(long taskId, String resultKey);

    void markFailed(long taskId, String stage, String reason);
}
