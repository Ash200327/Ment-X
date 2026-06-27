package com.mentx.service;

import com.mentx.dto.WeeklyUpdateRequest;
import com.mentx.model.AssignmentStatus;
import com.mentx.model.TaskAssignment;
import com.mentx.model.WeeklyUpdate;
import com.mentx.repository.TaskAssignmentRepository;
import com.mentx.repository.WeeklyUpdateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class WeeklyUpdateService {

    @Autowired
    private WeeklyUpdateRepository weeklyUpdateRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Value("${mentx.bypass-deadline-restriction:false}")
    private boolean bypassDeadlineRestriction;

    private void validateDeadline(LocalDateTime deadline) {
        if (!bypassDeadlineRestriction) {
            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(deadline)) {
                throw new RuntimeException("Error: Submission window is not open yet. Updates can only be submitted after the task deadline has passed.");
            }
            LocalDateTime maxAllowedTime = deadline.toLocalDate().plusDays(1).atTime(23, 59, 59);
            if (now.isAfter(maxAllowedTime)) {
                throw new RuntimeException("Error: Submission window closed. Updates can only be submitted during the day following the task deadline.");
            }
        }
    }

    @Transactional
    public WeeklyUpdate submitUpdate(Long assignmentId, WeeklyUpdateRequest request, String menteeEmail) {
        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Task assignment not found"));

        // Validate submission deadline
        validateDeadline(assignment.getTask().getDeadline());

        if (!assignment.getMentee().getEmail().equals(menteeEmail)) {
            throw new RuntimeException("Unauthorized: You are not assigned to this task.");
        }

        // Check if already completed
        if (assignment.getStatus() == AssignmentStatus.COMPLETED) {
            throw new RuntimeException("Error: Cannot submit updates for a completed task.");
        }

        Optional<WeeklyUpdate> existingUpdateOpt = weeklyUpdateRepository.findByAssignment(assignment);
        WeeklyUpdate update;

        if (existingUpdateOpt.isPresent()) {
            // Update existing submission (Mentees can edit before Sunday ends)
            update = existingUpdateOpt.get();
            update.setSummary(request.getSummary());
            update.setChallenges(request.getChallenges());
            update.setCompletionPercentage(request.getCompletionPercentage());
            update.setSubmittedAt(LocalDateTime.now());
        } else {
            // Create new submission
            update = WeeklyUpdate.builder()
                    .assignment(assignment)
                    .summary(request.getSummary())
                    .challenges(request.getChallenges())
                    .completionPercentage(request.getCompletionPercentage())
                    .build();
        }

        WeeklyUpdate savedUpdate = weeklyUpdateRepository.save(update);

        // Update assignment status
        assignment.setStatus(AssignmentStatus.SUBMITTED);
        taskAssignmentRepository.save(assignment);

        // Notify mentor
        notificationService.sendNotification(assignment.getTask().getMentor(), "Weekly Update Submitted", 
                String.format("Mentee %s submitted an update for task: '%s'.", 
                        assignment.getMentee().getName(), assignment.getTask().getTitle()));

        auditLogService.logAction(menteeEmail, "WEEKLY_UPDATE_SUBMITTED", 
                "Submitted weekly update for task: " + assignment.getTask().getTitle());

        return savedUpdate;
    }

    public WeeklyUpdate getUpdateForAssignment(Long assignmentId, String userEmail) {
        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Task assignment not found"));

        // Ensure user is authorized (either the assigned mentee or the task mentor)
        boolean isMentee = assignment.getMentee().getEmail().equals(userEmail);
        boolean isMentor = assignment.getTask().getMentor().getEmail().equals(userEmail);
        if (!isMentee && !isMentor) {
            throw new RuntimeException("Unauthorized access to weekly update.");
        }

        return weeklyUpdateRepository.findByAssignment(assignment)
                .orElseThrow(() -> new RuntimeException("No submission update found for this task."));
    }
}
