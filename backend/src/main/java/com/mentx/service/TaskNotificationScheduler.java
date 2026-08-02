package com.mentx.service;

import com.mentx.model.TaskAssignment;
import com.mentx.model.User;
import com.mentx.repository.TaskAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class TaskNotificationScheduler {

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private NotificationService notificationService;

    // Execute every hour
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void checkSubmissionWindows() {
        LocalDateTime now = LocalDateTime.now();
        List<TaskAssignment> pending = taskAssignmentRepository.findPendingWindowNotifications(now);

        for (TaskAssignment ta : pending) {
            User mentee = ta.getMentee();
            String title = "Submission Window Open: " + ta.getTask().getTitle();
            
            // Format the deadline nicely
            LocalDateTime maxAllowedTime = ta.getTask().getDeadline().toLocalDate().plusDays(1).atTime(23, 59, 59);
            String message = String.format(
                "Hi %s,\n\nThe submission window for your task '%s' is now open. " +
                "Please submit your weekly progress update before the window closes on %s.",
                mentee.getName(), 
                ta.getTask().getTitle(), 
                maxAllowedTime.toString().replace("T", " ")
            );

            try {
                // sendNotification automatically saves in-app notification, triggers push notice, and sends mail!
                notificationService.sendNotification(mentee, title, message);
                
                // Mark as notified so we don't send duplicates
                ta.setWindowNotified(true);
                taskAssignmentRepository.save(ta);
            } catch (Exception e) {
                System.err.println("Error triggering submission window notification for assignment ID " + ta.getId() + ": " + e.getMessage());
            }
        }
    }
}
