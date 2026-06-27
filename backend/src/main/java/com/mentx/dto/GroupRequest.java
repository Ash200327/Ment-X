package com.mentx.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GroupRequest {
    @NotBlank
    private String groupName;

    private String description;
}
