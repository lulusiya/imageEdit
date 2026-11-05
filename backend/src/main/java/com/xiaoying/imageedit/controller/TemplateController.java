package com.xiaoying.imageedit.controller;

import com.xiaoying.imageedit.service.TemplateService;
import com.xiaoying.imageedit.web.dto.CategorySummary;
import com.xiaoying.imageedit.web.dto.TemplateDetail;
import com.xiaoying.imageedit.web.dto.TemplateSummary;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping("/templates")
    public List<TemplateSummary> list(@RequestParam(value = "category", required = false) String category) {
        return templateService.list(category);
    }

    @GetMapping("/templates/{id}")
    public TemplateDetail detail(@PathVariable String id) {
        return templateService.detail(id);
    }

    @GetMapping("/categories")
    public List<CategorySummary> categories() {
        return templateService.categories();
    }
}
