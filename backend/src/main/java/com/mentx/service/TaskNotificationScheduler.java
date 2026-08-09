package com.mentx.service;

import com.mentx.model.TaskAssignment;
import com.mentx.model.User;
import com.mentx.repository.TaskAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class TaskNotificationScheduler {

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private TaskNotificationHelper taskNotificationHelper;

    // Run every day at 11:15 AM and 5:00 PM (Asia/Kolkata timezone aligned)
    @Scheduled(cron = "0 15 11 * * *", zone = "Asia/Kolkata")
    @Scheduled(cron = "0 0 17 * * *", zone = "Asia/Kolkata")
    public void checkSubmissionWindows() {
        LocalDateTime now = LocalDateTime.now();
        int hour = now.getHour();

        if (hour == 11) {
            LocalDateTime windowStart = now.minusDays(2);
            List<TaskAssignment> pending = taskAssignmentRepository.findPending9amNotifications(now, windowStart);
            for (TaskAssignment ta : pending) {
                try {
                    String title = "Reminder: Submit Update for " + ta.getTask().getTitle();
                    String message = buildMessage(ta);
                    taskNotificationHelper.sendReminderAndMark9am(ta, title, message);
                } catch (Exception e) {
                    System.err.println("Error sending 11:15 AM notification for assignment ID " + ta.getId() + ": " + e.getMessage());
                }
            }
        } else if (hour == 17) {
            LocalDateTime windowStart = now.minusDays(2);
            List<TaskAssignment> pending = taskAssignmentRepository.findPending5pmNotifications(now, windowStart);
            for (TaskAssignment ta : pending) {
                try {
                    String title = "Reminder: Submit Update for " + ta.getTask().getTitle();
                    String message = buildMessage(ta);
                    taskNotificationHelper.sendReminderAndMark5pm(ta, title, message);
                } catch (Exception e) {
                    System.err.println("Error sending 5 PM notification for assignment ID " + ta.getId() + ": " + e.getMessage());
                }
            }
        }
    }

    private String buildMessage(TaskAssignment ta) {
        User mentee = ta.getMentee();
        LocalDateTime maxAllowedTime = ta.getTask().getDeadline().toLocalDate().plusDays(1).atTime(23, 59, 59);
        return String.format(
            "Hi %s,\n\nThis is a reminder that the submission window for your task '%s' is open. " +
            "Please submit your weekly progress update before the window closes on %s.\n\n" +
            "(Ignore if you have already submitted the update.)",
            mentee.getName(),
            ta.getTask().getTitle(),
            maxAllowedTime.toString().replace("T", " ")
        );
    }
}
