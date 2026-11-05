package com.xiaoying.imageedit.domain;

public enum TaskStatus {
    QUEUED,
    RUNNING,
    SUCCEEDED,
    FAILED;

    public static boolean isTerminal(String status) {
        return SUCCEEDED.name().equals(status) || FAILED.name().equals(status);
    }
}
