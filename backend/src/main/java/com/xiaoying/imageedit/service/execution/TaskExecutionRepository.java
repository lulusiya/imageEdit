package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import java.util.List;

public interface TaskExecutionRepository {

    Task findTask(long taskId);

    List<Asset> findAssets(long taskId);
}
