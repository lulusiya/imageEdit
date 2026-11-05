package com.xiaoying.imageedit.web.dto;

public record UpdateSimulationRequest(
        Integer checkDelayMs,
        Integer generateDelayMs,
        Integer finalizeDelayMs,
        String failStage
) {
}
