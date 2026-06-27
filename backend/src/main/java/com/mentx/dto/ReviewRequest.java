package com.mentx.dto;

import com.mentx.model.ReviewStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotBlank
    private String remark;

    @NotNull
    private ReviewStatus reviewStatus;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer score;
}
