package com.xiaoying.imageedit.web.dto;

public record AssetResponse(
        String assetId,
        String previewUrl,
        String originalName,
        String contentType,
        long sizeBytes
) {
}
