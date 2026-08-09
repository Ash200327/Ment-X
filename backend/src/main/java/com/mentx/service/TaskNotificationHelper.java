package com.mentx.service;

import com.mentx.model.TaskAssignment;
import com.mentx.repository.TaskAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskNotificationHelper {

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendReminderAndMark9am(TaskAssignment ta, String title, String message) {
        notificationService.sendNotification(ta.getMentee(), title, message);
        ta.setNotified9am(true);
        taskAssignmentRepository.save(ta);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendReminderAndMark5pm(TaskAssignment ta, String title, String message) {
        notificationService.sendNotification(ta.getMentee(), title, message);
        ta.setNotified5pm(true);
        taskAssignmentRepository.save(ta);
    }
}
