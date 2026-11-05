package com.xiaoying.imageedit.web.dto;

import jakarta.validation.constraints.NotBlank;

public record DemoSessionRequest(@NotBlank(message = "identity 不能为空") String identity) {
}
