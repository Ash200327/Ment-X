package com.mentx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardResponse {
    private Integer rank;
    private Long userId;
    private String name;
    private Integer weeklyScore;
    private Integer totalScore;
    private Long completedTasks;
    private boolean consistencyBadge;
    private boolean topPerformer;
    private boolean hasProfilePicture;
    private Double averageScore;
    private Integer activeWeeks;
    private boolean eligible;
}
