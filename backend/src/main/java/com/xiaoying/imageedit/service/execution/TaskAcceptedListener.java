package com.xiaoying.imageedit.service.execution;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TaskAcceptedListener {

    private static final Logger log = LoggerFactory.getLogger(TaskAcceptedListener.class);

    private final TaskExecutionService executionService;
    private final TaskProgressStore progressStore;
    private final Executor executor;

    public TaskAcceptedListener(TaskExecutionService executionService,
                                TaskProgressStore progressStore,
                                @Qualifier("taskWorkerExecutor") Executor executor) {
        this.executionService = executionService;
        this.progressStore = progressStore;
        this.executor = executor;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskAccepted(TaskAcceptedEvent event) {
        try {
            executor.execute(() -> executionService.execute(event.taskId()));
        } catch (RejectedExecutionException ex) {
            log.error("Task {} rejected by worker pool", event.taskId(), ex);
            progressStore.markFailed(event.taskId(), null,
                    "任务队列繁忙，未能开始处理，请稍后重新提交。");
        }
    }
}
