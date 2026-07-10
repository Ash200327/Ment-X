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

        // Fetch all scores in a single query and group by mentee ID
        List<Score> allScores = scoreRepository.findAll();
        java.util.Map<Long, List<Score>> scoresByMenteeId = allScores.stream()
                .filter(s -> s.getMentee() != null)
                .collect(Collectors.groupingBy(s -> s.getMentee().getId()));

        // Fetch all completed task counts in a single query and group by mentee ID
        List<Object[]> completedTaskCountsList = taskAssignmentRepository.countCompletedTasksGroupByMentee();
        java.util.Map<Long, Long> completedTaskCountsByMenteeId = completedTaskCountsList.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        for (User mentee : mentees) {
            List<Score> scores = scoresByMenteeId.getOrDefault(mentee.getId(), new ArrayList<>());
            int totalScore = scores.stream().mapToInt(Score::getScore).sum();
            
            // Get latest week score
            int latestWeekScore = scores.stream()
                    .max(Comparator.comparing(Score::getWeekNumber))
                    .map(Score::getScore)
                    .orElse(0);

            long completedTasks = completedTaskCountsByMenteeId.getOrDefault(mentee.getId(), 0L);

            // Calculate active weeks (unique week numbers in their scores)
            int activeWeeks = (int) scores.stream()
                    .map(Score::getWeekNumber)
                    .distinct()
                    .count();

            double averageScore = activeWeeks > 0 ? (double) totalScore / activeWeeks : 0.0;
            boolean eligible = activeWeeks >= 2;

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
                    .hasProfilePicture(mentee.getProfilePicture() != null && !mentee.getProfilePicture().isEmpty())
                    .averageScore(averageScore)
                    .activeWeeks(activeWeeks)
                    .eligible(eligible)
                    .build());
        }

        // Sort by eligibility descending, average score descending, total score descending, completed tasks descending, name alphabetically
        board.sort((a, b) -> {
            int eligibilityCompare = Boolean.compare(b.isEligible(), a.isEligible());
            if (eligibilityCompare != 0) return eligibilityCompare;

            int averageCompare = Double.compare(b.getAverageScore(), a.getAverageScore());
            if (averageCompare != 0) return averageCompare;

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
