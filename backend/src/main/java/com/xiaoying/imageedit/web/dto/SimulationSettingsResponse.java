package com.xiaoying.imageedit.web.dto;

public record SimulationSettingsResponse(
        int checkDelayMs,
        int generateDelayMs,
        int finalizeDelayMs,
        String failStage
) {
}
