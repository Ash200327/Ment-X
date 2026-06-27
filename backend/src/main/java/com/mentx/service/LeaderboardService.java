package com.mentx.service;

import com.mentx.dto.LeaderboardResponse;
import com.mentx.model.AssignmentStatus;
import com.mentx.model.Role;
import com.mentx.model.Score;
import com.mentx.model.User;
import com.mentx.repository.ScoreRepository;
import com.mentx.repository.TaskAssignmentRepository;
import com.mentx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    public List<LeaderboardResponse> getLeaderboard() {
        List<User> mentees = userRepository.findByRole(Role.MENTEE);
        List<LeaderboardResponse> board = new ArrayList<>();

        for (User mentee : mentees) {
            List<Score> scores = scoreRepository.findByMentee(mentee);
            int totalScore = scores.stream().mapToInt(Score::getScore).sum();
            
            // Get latest week score
            int latestWeekScore = scores.stream()
                    .max(Comparator.comparing(Score::getWeekNumber))
                    .map(Score::getScore)
                    .orElse(0);

            long completedTasks = taskAssignmentRepository.countByMenteeAndStatus(mentee, AssignmentStatus.COMPLETED);

            // Consistency Badge logic: Completed at least 3 tasks and average score >= 8
            boolean consistencyBadge = false;
            if (completedTasks >= 3) {
                double avg = (double) totalScore / completedTasks;
                if (avg >= 8.0) {
                    consistencyBadge = true;
                }
            }

            board.add(LeaderboardResponse.builder()
                    .userId(mentee.getId())
                    .name(mentee.getName())
                    .weeklyScore(latestWeekScore)
                    .totalScore(totalScore)
                    .completedTasks(completedTasks)
                    .consistencyBadge(consistencyBadge)
                    .topPerformer(false) // Will be calculated after sorting
                    .build());
        }

        // Sort by total score descending, then by completed tasks descending, then by name alphabetically
        board.sort((a, b) -> {
            int scoreCompare = Integer.compare(b.getTotalScore(), a.getTotalScore());
            if (scoreCompare != 0) return scoreCompare;
            int tasksCompare = Long.compare(b.getCompletedTasks(), a.getCompletedTasks());
            if (tasksCompare != 0) return tasksCompare;
            return a.getName().compareTo(b.getName());
        });

        // Set Ranks and Top Performer Badge (Top 10% of mentees or top 3)
        int totalMentees = board.size();
        int topThreshold = Math.max(3, (int) Math.ceil(totalMentees * 0.10));

        for (int i = 0; i < totalMentees; i++) {
            LeaderboardResponse row = board.get(i);
            row.setRank(i + 1);
            if (i < topThreshold && row.getTotalScore() > 0) {
                row.setTopPerformer(true);
            }
        }

        return board;
    }
}
