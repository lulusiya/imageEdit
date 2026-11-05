package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.config.AppProperties;
import com.xiaoying.imageedit.mapper.TaskMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * This demo runs tasks in memory, so a restart cannot resume the in-flight work.
 * Instead of leaving tasks polling forever, mark them failed with a readable reason.
 * The boundary is documented in the README.
 */
@Component
public class StartupTaskRecovery implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupTaskRecovery.class);

    private final AppProperties properties;
    private final TaskMapper taskMapper;

    public StartupTaskRecovery(AppProperties properties, TaskMapper taskMapper) {
        this.properties = properties;
        this.taskMapper = taskMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isRecoverInterruptedTasks()) {
            return;
        }
        int affected = taskMapper.failInterrupted("服务重启导致任务中断，请重新提交。");
        if (affected > 0) {
            log.warn("Marked {} interrupted task(s) as failed after startup", affected);
        }
    }
}
