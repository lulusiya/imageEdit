package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import java.util.List;

public interface ResultComposer {

    String compose(Task task, List<Asset> assets);
}
