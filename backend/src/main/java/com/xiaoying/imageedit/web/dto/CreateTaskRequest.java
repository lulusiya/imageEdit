package com.xiaoying.imageedit.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateTaskRequest(
        @NotBlank(message = "templateId 不能为空") String templateId,
        @NotEmpty(message = "assetIds 不能为空") List<String> assetIds,
        SimulationOverride simulation
) {
}
