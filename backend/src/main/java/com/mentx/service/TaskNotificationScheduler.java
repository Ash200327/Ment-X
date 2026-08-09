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

    // Run every day at 10:30 AM and 5:00 PM (Asia/Kolkata timezone aligned)
    @Scheduled(cron = "0 30 10 * * *", zone = "Asia/Kolkata")
    @Scheduled(cron = "0 0 17 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void checkSubmissionWindows() {
        LocalDateTime now = LocalDateTime.now();
        int hour = now.getHour();

        if (hour == 10) {
            List<TaskAssignment> pending = taskAssignmentRepository.findPending9amNotifications(now);
            for (TaskAssignment ta : pending) {
                try {
                    sendReminderEmail(ta);
                    ta.setNotified9am(true);
                    taskAssignmentRepository.save(ta);
                } catch (Exception e) {
                    System.err.println("Error sending 10:30 AM notification for assignment ID " + ta.getId() + ": " + e.getMessage());
                }
            }
        } else if (hour == 17) {
            List<TaskAssignment> pending = taskAssignmentRepository.findPending5pmNotifications(now);
            for (TaskAssignment ta : pending) {
                try {
                    sendReminderEmail(ta);
                    ta.setNotified5pm(true);
                    taskAssignmentRepository.save(ta);
                } catch (Exception e) {
                    System.err.println("Error sending 5 PM notification for assignment ID " + ta.getId() + ": " + e.getMessage());
                }
            }
        }
    }

    private void sendReminderEmail(TaskAssignment ta) {
        User mentee = ta.getMentee();
        String title = "Reminder: Submit Update for " + ta.getTask().getTitle();

        // Calculate deadline display format (closes at 23:59:59 the following day)
        LocalDateTime maxAllowedTime = ta.getTask().getDeadline().toLocalDate().plusDays(1).atTime(23, 59, 59);
        String message = String.format(
            "Hi %s,\n\nThis is a reminder that the submission window for your task '%s' is open. " +
            "Please submit your weekly progress update before the window closes on %s.\n\n" +
            "(Ignore if you have already submitted the update.)",
            mentee.getName(),
            ta.getTask().getTitle(),
            maxAllowedTime.toString().replace("T", " ")
        );

        // sendNotification automatically logs the in-app notice, triggers push notification, and sends the email
        notificationService.sendNotification(mentee, title, message);
    }
}
