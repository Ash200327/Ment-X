package com.mentx.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ManualScoreRequest {
    @NotNull
    private Long menteeId;

    @NotNull
    private Integer weekNumber;

    @NotNull
    @Min(0)
    private Integer score;

    private boolean override = true;
}
