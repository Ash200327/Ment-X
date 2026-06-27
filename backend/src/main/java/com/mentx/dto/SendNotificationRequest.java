package com.mentx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendNotificationRequest {
    private Long targetUserId;
    private Long targetGroupId;

    @NotBlank
    private String title;

    @NotBlank
    private String message;
}
