package com.xiaoying.imageedit.domain;

import java.time.LocalDateTime;

public class Task {

    private Long id;
    private String ownerId;
    private String templateId;
    private String status;
    private String stage;
    private String resultKey;
    private String failureReason;
    private Integer checkDelayMs;
    private Integer generateDelayMs;
    private Integer finalizeDelayMs;
    private String failStage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Values joined from template, used by execution and API responses.
    private String templateTitle;
    private String resultCaption;
    private String accentColor;
    private Integer requiredImageCount;
    private String acceptedMimeTypes;
    private Long maxFileSizeBytes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public String getResultKey() {
        return resultKey;
    }

    public void setResultKey(String resultKey) {
        this.resultKey = resultKey;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public Integer getCheckDelayMs() {
        return checkDelayMs;
    }

    public void setCheckDelayMs(Integer checkDelayMs) {
        this.checkDelayMs = checkDelayMs;
    }

    public Integer getGenerateDelayMs() {
        return generateDelayMs;
    }

    public void setGenerateDelayMs(Integer generateDelayMs) {
        this.generateDelayMs = generateDelayMs;
    }

    public Integer getFinalizeDelayMs() {
        return finalizeDelayMs;
    }

    public void setFinalizeDelayMs(Integer finalizeDelayMs) {
        this.finalizeDelayMs = finalizeDelayMs;
    }

    public String getFailStage() {
        return failStage;
    }

    public void setFailStage(String failStage) {
        this.failStage = failStage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getTemplateTitle() {
        return templateTitle;
    }

    public void setTemplateTitle(String templateTitle) {
        this.templateTitle = templateTitle;
    }

    public String getResultCaption() {
        return resultCaption;
    }

    public void setResultCaption(String resultCaption) {
        this.resultCaption = resultCaption;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public void setAccentColor(String accentColor) {
        this.accentColor = accentColor;
    }

    public Integer getRequiredImageCount() {
        return requiredImageCount;
    }

    public void setRequiredImageCount(Integer requiredImageCount) {
        this.requiredImageCount = requiredImageCount;
    }

    public String getAcceptedMimeTypes() {
        return acceptedMimeTypes;
    }

    public void setAcceptedMimeTypes(String acceptedMimeTypes) {
        this.acceptedMimeTypes = acceptedMimeTypes;
    }

    public Long getMaxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    public void setMaxFileSizeBytes(Long maxFileSizeBytes) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }
}
