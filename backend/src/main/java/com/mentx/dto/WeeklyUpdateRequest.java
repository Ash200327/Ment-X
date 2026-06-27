package com.mentx.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WeeklyUpdateRequest {
    @NotBlank
    private String summary;

    private String challenges;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer completionPercentage;
}
