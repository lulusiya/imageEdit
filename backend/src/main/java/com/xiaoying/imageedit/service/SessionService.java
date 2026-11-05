package com.xiaoying.imageedit.service;

import com.xiaoying.imageedit.config.AppProperties;
import com.xiaoying.imageedit.domain.User;
import com.xiaoying.imageedit.mapper.SessionMapper;
import com.xiaoying.imageedit.mapper.UserMapper;
import com.xiaoying.imageedit.web.ApiException;
import com.xiaoying.imageedit.web.dto.SessionUser;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    private final SessionMapper sessionMapper;
    private final UserMapper userMapper;
    private final AppProperties properties;

    public SessionService(SessionMapper sessionMapper, UserMapper userMapper, AppProperties properties) {
        this.sessionMapper = sessionMapper;
        this.userMapper = userMapper;
        this.properties = properties;
    }

    public SessionUser requireUser(HttpServletRequest request) {
        return currentUser(request)
                .orElseThrow(() -> ApiException.unauthorized("演示会话不存在或已失效，请选择演示身份"));
    }

    public Optional<SessionUser> currentUser(HttpServletRequest request) {
        String sessionId = readSessionCookie(request);
        if (sessionId == null) {
            return Optional.empty();
        }
        User user = sessionMapper.findUserBySessionId(sessionId);
        return Optional.ofNullable(user).map(this::toSessionUser);
    }

    public SessionUser createSession(String identity, HttpServletResponse response) {
        String key = identity == null ? "" : identity.trim().toUpperCase();
        Map<String, String> demoUsers = properties.getDemoUsers();
        String userId = demoUsers.get(key);
        if (userId == null) {
            throw ApiException.badRequest("INVALID_IDENTITY", "演示身份仅支持 A 或 B");
        }
        User user = userMapper.findById(userId);
        if (user == null) {
            throw ApiException.badRequest("INVALID_IDENTITY", "演示用户不存在，请检查数据库初始化数据");
        }

        String sessionId = UUID.randomUUID().toString();
        sessionMapper.insert(sessionId, userId);

        ResponseCookie cookie = ResponseCookie.from(properties.getSessionCookieName(), sessionId)
                .httpOnly(true)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofDays(30))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return toSessionUser(user);
    }

    private String readSessionCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        String name = properties.getSessionCookieName();
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private SessionUser toSessionUser(User user) {
        return new SessionUser(user.getId(), user.getDisplayName(), user.getEmail(), user.getAvatarColor());
    }
}
