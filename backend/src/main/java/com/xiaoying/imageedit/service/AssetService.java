package com.xiaoying.imageedit.service;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Template;
import com.xiaoying.imageedit.mapper.AssetMapper;
import com.xiaoying.imageedit.storage.MediaStore;
import com.xiaoying.imageedit.web.ApiException;
import com.xiaoying.imageedit.web.dto.AssetResponse;
import com.xiaoying.imageedit.web.dto.SessionUser;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AssetService {

    private final AssetMapper assetMapper;
    private final TemplateService templateService;
    private final MediaStore mediaStore;

    public AssetService(AssetMapper assetMapper, TemplateService templateService, MediaStore mediaStore) {
        this.assetMapper = assetMapper;
        this.templateService = templateService;
        this.mediaStore = mediaStore;
    }

    @Transactional
    public AssetResponse upload(SessionUser user, String templateId, MultipartFile file) {
        Template template = templateService.requireTemplate(templateId);
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("EMPTY_FILE", "请选择一个非空的图片文件");
        }

        long maxBytes = template.getMaxFileSizeBytes();
        if (file.getSize() > maxBytes) {
            throw ApiException.badRequest("FILE_TOO_LARGE",
                    "文件超过模板限制（最大 " + toMegabytes(maxBytes) + " MB）");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw ApiException.badRequest("FILE_UNREADABLE", "无法读取上传的文件");
        }

        if (bytes.length > maxBytes) {
            throw ApiException.badRequest("FILE_TOO_LARGE",
                    "文件超过模板限制（最大 " + toMegabytes(maxBytes) + " MB）");
        }

        String contentType = sniffImageType(bytes);
        if (contentType == null) {
            throw ApiException.badRequest("INVALID_FILE_TYPE", "仅支持 JPEG 或 PNG 图片文件");
        }

        List<String> accepted = TemplateService.splitMimeTypes(template.getAcceptedMimeTypes());
        if (!accepted.contains(contentType)) {
            throw ApiException.badRequest("UNSUPPORTED_FILE_TYPE", "该模板不接受这种图片格式");
        }

        if (!isDecodableImage(bytes)) {
            throw ApiException.badRequest("INVALID_IMAGE", "文件内容不是可读取的图片");
        }

        String storageKey = mediaStore.saveAsset(bytes, contentType, user.id());

        Asset asset = new Asset();
        asset.setId(UUID.randomUUID().toString());
        asset.setOwnerId(user.id());
        asset.setTemplateId(templateId);
        asset.setOriginalName(truncate(file.getOriginalFilename(), 255));
        asset.setStorageKey(storageKey);
        asset.setContentType(contentType);
        asset.setSizeBytes((long) bytes.length);
        asset.setCreatedAt(LocalDateTime.now());

        try {
            assetMapper.insert(asset);
        } catch (RuntimeException ex) {
            mediaStore.delete(storageKey);
            throw ex;
        }

        return new AssetResponse(
                asset.getId(),
                "/api/assets/" + asset.getId() + "/file",
                asset.getOriginalName(),
                asset.getContentType(),
                asset.getSizeBytes());
    }

    public Asset requireOwnedAsset(String assetId, String ownerId) {
        Asset asset = assetMapper.findByIdAndOwner(assetId, ownerId);
        if (asset == null) {
            throw ApiException.notFound("ASSET_NOT_FOUND", "素材不存在或无权访问");
        }
        return asset;
    }

    public byte[] loadContent(Asset asset) {
        try {
            return mediaStore.read(asset.getStorageKey());
        } catch (RuntimeException ex) {
            throw ApiException.notFound("ASSET_FILE_MISSING", "素材文件不存在");
        }
    }

    public static String sniffImageType(byte[] bytes) {
        if (bytes == null || bytes.length < 8) {
            return null;
        }
        boolean png = (bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
        if (png) {
            return "image/png";
        }
        boolean jpeg = (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
        if (jpeg) {
            return "image/jpeg";
        }
        return null;
    }

    private static boolean isDecodableImage(byte[] bytes) {
        try {
            return ImageIO.read(new ByteArrayInputStream(bytes)) != null;
        } catch (IOException | RuntimeException ex) {
            return false;
        }
    }

    private static String truncate(String value, int max) {
        if (value == null || value.isBlank()) {
            return "upload";
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }

    private static String toMegabytes(long bytes) {
        return String.format(java.util.Locale.ROOT, "%.1f", bytes / (1024.0 * 1024.0));
    }
}
