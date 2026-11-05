package com.xiaoying.imageedit.web.dto;

public record TemplateSummary(
        String id,
        String title,
        String category,
        String coverUrl,
        int requiredImageCount
) {
}
