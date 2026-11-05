package com.xiaoying.imageedit.web.dto;

public record SimulationOverride(
        Integer checkDelayMs,
        Integer generateDelayMs,
        Integer finalizeDelayMs,
        String failStage
) {
}
