package com.xiaoying.imageedit.service;

public record SimulationSnapshot(
        int checkDelayMs,
        int generateDelayMs,
        int finalizeDelayMs,
        String failStage
) {
}
