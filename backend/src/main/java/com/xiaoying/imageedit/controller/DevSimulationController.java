package com.xiaoying.imageedit.controller;

import com.xiaoying.imageedit.service.SessionService;
import com.xiaoying.imageedit.service.SimulationSettingsService;
import com.xiaoying.imageedit.service.SimulationSnapshot;
import com.xiaoying.imageedit.web.dto.SimulationSettingsResponse;
import com.xiaoying.imageedit.web.dto.UpdateSimulationRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev")
public class DevSimulationController {

    private final SimulationSettingsService settingsService;
    private final SessionService sessionService;

    public DevSimulationController(SimulationSettingsService settingsService, SessionService sessionService) {
        this.settingsService = settingsService;
        this.sessionService = sessionService;
    }

    @GetMapping("/simulation")
    public SimulationSettingsResponse get(HttpServletRequest request) {
        sessionService.requireUser(request);
        return toResponse(settingsService.current());
    }

    @PutMapping("/simulation")
    public SimulationSettingsResponse update(@RequestBody UpdateSimulationRequest body,
                                             HttpServletRequest request) {
        sessionService.requireUser(request);
        return toResponse(settingsService.update(body));
    }

    private SimulationSettingsResponse toResponse(SimulationSnapshot snapshot) {
        return new SimulationSettingsResponse(
                snapshot.checkDelayMs(),
                snapshot.generateDelayMs(),
                snapshot.finalizeDelayMs(),
                snapshot.failStage());
    }
}
