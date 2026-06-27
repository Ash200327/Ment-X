package com.mentx.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String newPassword;
    private String profilePicture;
}
