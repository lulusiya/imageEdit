package com.xiaoying.imageedit.web.dto;

public record TaskResponse(
        long id,
        String templateId,
        String templateTitle,
        String createdAt,
        String updatedAt,
        String status,
        String stage,
        String resultUrl,
        String failureReason
) {
}
