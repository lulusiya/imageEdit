package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import com.xiaoying.imageedit.mapper.TaskMapper;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MyBatisTaskExecutionRepository implements TaskExecutionRepository {

    private final TaskMapper taskMapper;

    public MyBatisTaskExecutionRepository(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    public Task findTask(long taskId) {
        return taskMapper.findById(taskId);
    }

    @Override
    public List<Asset> findAssets(long taskId) {
        return taskMapper.findAssetsForTask(taskId);
    }
}
