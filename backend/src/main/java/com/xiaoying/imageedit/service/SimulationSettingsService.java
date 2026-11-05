package com.xiaoying.imageedit.service;

import com.xiaoying.imageedit.config.SimulationProperties;
import com.xiaoying.imageedit.domain.TaskStage;
import com.xiaoying.imageedit.web.ApiException;
import com.xiaoying.imageedit.web.dto.SimulationOverride;
import com.xiaoying.imageedit.web.dto.UpdateSimulationRequest;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SimulationSettingsService {

    public static final int MAX_DELAY_MS = 600_000;

    private static final Logger log = LoggerFactory.getLogger(SimulationSettingsService.class);

    private final AtomicReference<SimulationSnapshot> current;

    public SimulationSettingsService(SimulationProperties properties) {
        this.current = new AtomicReference<>(new SimulationSnapshot(
                validateInitialDelay(properties.getCheckDelayMs(), "simulation.check-delay-ms"),
                validateInitialDelay(properties.getGenerateDelayMs(), "simulation.generate-delay-ms"),
                validateInitialDelay(properties.getFinalizeDelayMs(), "simulation.finalize-delay-ms"),
                parseInitialFailStage(properties.getFailStage())));
    }

    public SimulationSnapshot current() {
        return current.get();
    }

    public SimulationSnapshot update(UpdateSimulationRequest request) {
        SimulationSnapshot base = current.get();
        SimulationSnapshot updated = new SimulationSnapshot(
                request.checkDelayMs() == null ? base.checkDelayMs() : validateDelay(request.checkDelayMs(), "checkDelayMs"),
                request.generateDelayMs() == null ? base.generateDelayMs() : validateDelay(request.generateDelayMs(), "generateDelayMs"),
                request.finalizeDelayMs() == null ? base.finalizeDelayMs() : validateDelay(request.finalizeDelayMs(), "finalizeDelayMs"),
                request.failStage() == null ? base.failStage() : normalizeFailStage(request.failStage()));
        current.set(updated);
        return updated;
    }

    public SimulationSnapshot applyOverride(SimulationSnapshot base, SimulationOverride override) {
        if (override == null) {
            return base;
        }
        return new SimulationSnapshot(
                override.checkDelayMs() == null ? base.checkDelayMs() : validateDelay(override.checkDelayMs(), "checkDelayMs"),
                override.generateDelayMs() == null ? base.generateDelayMs() : validateDelay(override.generateDelayMs(), "generateDelayMs"),
                override.finalizeDelayMs() == null ? base.finalizeDelayMs() : validateDelay(override.finalizeDelayMs(), "finalizeDelayMs"),
                override.failStage() == null ? base.failStage() : normalizeFailStage(override.failStage()));
    }

    public static String normalizeFailStage(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        TaskStage stage = TaskStage.parseOrNull(value);
        if (stage == null) {
            throw ApiException.badRequest("INVALID_SIMULATION",
                    "failStage 仅支持 CHECK、GENERATE、FINALIZE 或留空");
        }
        return stage.name();
    }

    private static int validateDelay(int value, String field) {
        if (value < 0 || value > MAX_DELAY_MS) {
            throw ApiException.badRequest("INVALID_SIMULATION",
                    field + " 必须在 0 到 " + MAX_DELAY_MS + " 毫秒之间");
        }
        return value;
    }

    private static int validateInitialDelay(int value, String field) {
        if (value < 0 || value > MAX_DELAY_MS) {
            throw new IllegalStateException(field + " 必须在 0 到 " + MAX_DELAY_MS + " 毫秒之间");
        }
        return value;
    }

    private static String parseInitialFailStage(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        TaskStage stage = TaskStage.parseOrNull(value);
        if (stage == null) {
            log.warn("Ignoring invalid simulation.fail-stage value: {}", value);
            return null;
        }
        return stage.name();
    }
}
