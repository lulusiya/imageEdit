package com.xiaoying.imageedit.service;

import com.xiaoying.imageedit.domain.Template;
import com.xiaoying.imageedit.mapper.TemplateMapper;
import com.xiaoying.imageedit.web.ApiException;
import com.xiaoying.imageedit.web.dto.CategorySummary;
import com.xiaoying.imageedit.web.dto.TemplateDetail;
import com.xiaoying.imageedit.web.dto.TemplateSummary;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class TemplateService {

    private final TemplateMapper templateMapper;

    public TemplateService(TemplateMapper templateMapper) {
        this.templateMapper = templateMapper;
    }

    public List<TemplateSummary> list(String category) {
        String normalized = category == null || category.isBlank() ? null : category.trim();
        return templateMapper.findAll(normalized).stream()
                .map(template -> new TemplateSummary(
                        template.getId(),
                        template.getTitle(),
                        template.getCategory(),
                        template.getCoverUrl(),
                        template.getRequiredImageCount()))
                .toList();
    }

    public List<CategorySummary> categories() {
        return templateMapper.findCategories().stream()
                .map(row -> new CategorySummary(row.getName(), row.getCount() == null ? 0 : row.getCount()))
                .toList();
    }

    public TemplateDetail detail(String id) {
        Template template = requireTemplate(id);
        return new TemplateDetail(
                template.getId(),
                template.getTitle(),
                template.getCategory(),
                template.getCoverUrl(),
                template.getDescription(),
                template.getRequiredImageCount(),
                splitMimeTypes(template.getAcceptedMimeTypes()),
                template.getMaxFileSizeBytes(),
                template.getSampleResultUrl());
    }

    public Template requireTemplate(String id) {
        Template template = templateMapper.findById(id);
        if (template == null) {
            throw ApiException.notFound("TEMPLATE_NOT_FOUND", "模板不存在或已下架");
        }
        return template;
    }

    public static List<String> splitMimeTypes(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toList());
    }
}
