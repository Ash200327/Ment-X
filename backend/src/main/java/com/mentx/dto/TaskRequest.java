package com.mentx.dto;

import com.mentx.model.Priority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TaskRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private LocalDateTime deadline;

    @NotNull
    @Min(1)
    private Integer weekNumber;

    @NotNull
    private Priority priority;

    private Long groupId;     // To assign to group
    private Long menteeId;    // To assign to individual
}
