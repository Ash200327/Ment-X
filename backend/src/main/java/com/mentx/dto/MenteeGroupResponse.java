package com.mentx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenteeGroupResponse {
    private Long id;
    private String groupName;
    private String description;
    private UserResponse mentor;
    private List<UserResponse> members;
}
