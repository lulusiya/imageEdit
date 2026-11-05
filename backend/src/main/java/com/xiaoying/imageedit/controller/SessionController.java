package com.xiaoying.imageedit.controller;

import com.xiaoying.imageedit.service.SessionService;
import com.xiaoying.imageedit.web.dto.DemoSessionRequest;
import com.xiaoying.imageedit.web.dto.SessionResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/session")
    public SessionResponse session(HttpServletRequest request) {
        return new SessionResponse(sessionService.requireUser(request));
    }

    @PostMapping("/demo-session")
    public SessionResponse createSession(@Valid @RequestBody DemoSessionRequest body,
                                         HttpServletResponse response) {
        return new SessionResponse(sessionService.createSession(body.identity(), response));
    }
}
