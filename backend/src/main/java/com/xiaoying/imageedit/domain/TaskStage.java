package com.xiaoying.imageedit.domain;

public enum TaskStage {
    CHECK,
    GENERATE,
    FINALIZE;

    public static TaskStage parseOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return TaskStage.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
