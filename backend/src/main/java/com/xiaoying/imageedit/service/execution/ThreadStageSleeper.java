package com.xiaoying.imageedit.service.execution;

import org.springframework.stereotype.Component;

@Component
public class ThreadStageSleeper implements StageSleeper {

    @Override
    public void sleep(long millis) {
        if (millis <= 0) {
            return;
        }
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("任务线程被中断");
        }
    }
}
