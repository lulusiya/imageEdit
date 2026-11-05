package com.xiaoying.imageedit.web.dto;

import java.util.List;

public record TemplateDetail(
        String id,
        String title,
        String category,
        String coverUrl,
        String description,
        int requiredImageCount,
        List<String> acceptedMimeTypes,
        long maxFileSizeBytes,
        String sampleResultUrl
) {
}
