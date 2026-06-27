package com.mentx.service;

import com.mentx.dto.ReviewRequest;
import com.mentx.model.*;
import com.mentx.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    @Autowired
    private WeeklyUpdateRepository weeklyUpdateRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private RemarkRepository remarkRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public void reviewSubmission(Long updateId, ReviewRequest request, String mentorEmail) {
        WeeklyUpdate update = weeklyUpdateRepository.findById(updateId)
                .orElseThrow(() -> new RuntimeException("Weekly update not found"));

        TaskAssignment assignment = update.getAssignment();
        User mentor = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        if (!assignment.getTask().getMentor().getEmail().equals(mentorEmail)) {
            throw new RuntimeException("Unauthorized: You did not assign this task.");
        }

        // Save Remark
        Optional<Remark> existingRemarkOpt = remarkRepository.findByUpdate(update);
        Remark remark;
        if (existingRemarkOpt.isPresent()) {
            remark = existingRemarkOpt.get();
            remark.setRemark(request.getRemark());
            remark.setReviewStatus(request.getReviewStatus());
        } else {
            remark = Remark.builder()
                    .update(update)
                    .mentor(mentor)
                    .remark(request.getRemark())
                    .reviewStatus(request.getReviewStatus())
                    .build();
        }
        remarkRepository.save(remark);

        // Update TaskAssignment status
        if (request.getReviewStatus() == ReviewStatus.APPROVED) {
            assignment.setStatus(AssignmentStatus.COMPLETED);

            // Save Score
            Optional<Score> existingScoreOpt = scoreRepository.findByAssignment(assignment);
            Score score;
            if (existingScoreOpt.isPresent()) {
                score = existingScoreOpt.get();
                score.setScore(request.getScore());
            } else {
                score = Score.builder()
                        .assignment(assignment)
                        .mentor(mentor)
                        .weekNumber(assignment.getTask().getWeekNumber())
                        .score(request.getScore())
                        .build();
            }
            scoreRepository.save(score);

            notificationService.sendNotification(assignment.getMentee(), "Marks Published", 
                    String.format("Your submission for '%s' has been approved with a score of %d/10.", 
                            assignment.getTask().getTitle(), request.getScore()));
        } else {
            assignment.setStatus(AssignmentStatus.NEEDS_IMPROVEMENT);

            // If it needs improvement, remove score if previously saved
            scoreRepository.findByAssignment(assignment).ifPresent(scoreRepository::delete);

            notificationService.sendNotification(assignment.getMentee(), "Remark Added", 
                    String.format("Your mentor reviewed '%s' and requested changes: '%s'.", 
                            assignment.getTask().getTitle(), request.getRemark()));
        }

        taskAssignmentRepository.save(assignment);

        auditLogService.logAction(mentorEmail, "SUBMISSION_REVIEWED", 
                String.format("Reviewed %s's update for task '%s' as %s", 
                        assignment.getMentee().getEmail(), assignment.getTask().getTitle(), request.getReviewStatus()));
    }

    public Remark getRemarkForUpdate(Long updateId, String userEmail) {
        WeeklyUpdate update = weeklyUpdateRepository.findById(updateId)
                .orElseThrow(() -> new RuntimeException("Weekly update not found"));

        TaskAssignment assignment = update.getAssignment();
        boolean isMentee = assignment.getMentee().getEmail().equals(userEmail);
        boolean isMentor = assignment.getTask().getMentor().getEmail().equals(userEmail);
        if (!isMentee && !isMentor) {
            throw new RuntimeException("Unauthorized access to remarks.");
        }

        return remarkRepository.findByUpdate(update)
                .orElseThrow(() -> new RuntimeException("No remarks found for this update."));
    }

    public Score getScoreForAssignment(Long assignmentId, String userEmail) {
        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Task assignment not found"));

        boolean isMentee = assignment.getMentee().getEmail().equals(userEmail);
        boolean isMentor = assignment.getTask().getMentor().getEmail().equals(userEmail);
        if (!isMentee && !isMentor) {
            throw new RuntimeException("Unauthorized access to score.");
        }

        return scoreRepository.findByAssignment(assignment)
                .orElseThrow(() -> new RuntimeException("No score found for this assignment."));
    }

    public List<com.mentx.model.Score> getScoresForMentee(String menteeEmail) {
        User mentee = userRepository.findByEmail(menteeEmail)
                .orElseThrow(() -> new RuntimeException("Mentee not found"));
        return scoreRepository.findByMentee(mentee);
    }
}
