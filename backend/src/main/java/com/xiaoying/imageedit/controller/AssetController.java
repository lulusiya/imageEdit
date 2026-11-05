package com.xiaoying.imageedit.controller;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.service.AssetService;
import com.xiaoying.imageedit.service.SessionService;
import com.xiaoying.imageedit.web.dto.AssetResponse;
import com.xiaoying.imageedit.web.dto.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class AssetController {

    private final AssetService assetService;
    private final SessionService sessionService;

    public AssetController(AssetService assetService, SessionService sessionService) {
        this.assetService = assetService;
        this.sessionService = sessionService;
    }

    @PostMapping("/assets")
    public AssetResponse upload(@RequestParam("file") MultipartFile file,
                                @RequestParam("templateId") String templateId,
                                HttpServletRequest request) {
        SessionUser user = sessionService.requireUser(request);
        return assetService.upload(user, templateId, file);
    }

    @GetMapping("/assets/{id}/file")
    public ResponseEntity<byte[]> file(@PathVariable String id, HttpServletRequest request) {
        SessionUser user = sessionService.requireUser(request);
        Asset asset = assetService.requireOwnedAsset(id, user.id());
        byte[] bytes = assetService.loadContent(asset);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(asset.getContentType()))
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePrivate())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(bytes);
    }
}
