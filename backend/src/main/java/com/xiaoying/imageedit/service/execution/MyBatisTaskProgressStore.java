package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.mapper.TaskMapper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Each transition runs in its own short transaction so the frontend can observe
 * intermediate stages while the simulated work is still running.
 */
@Component
public class MyBatisTaskProgressStore implements TaskProgressStore {

    private final TaskMapper taskMapper;

    public MyBatisTaskProgressStore(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markRunning(long taskId, String stage) {
        taskMapper.updateStage(taskId, stage);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markSucceeded(long taskId, String resultKey) {
        taskMapper.markSucceeded(taskId, resultKey);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(long taskId, String stage, String reason) {
        taskMapper.markFailed(taskId, stage, reason);
    }
}
