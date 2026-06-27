package com.mentx.service;

import com.mentx.dto.TaskRequest;
import com.mentx.model.*;
import com.mentx.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public Task createTask(TaskRequest request, String mentorEmail) {
        User mentor = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        Group group = null;
        if (request.getGroupId() != null) {
            group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found"));
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .deadline(request.getDeadline())
                .weekNumber(request.getWeekNumber())
                .priority(request.getPriority())
                .mentor(mentor)
                .group(group)
                .build();

        Task savedTask = taskRepository.save(task);
        List<User> targets = new ArrayList<>();

        if (group != null) {
            // Assign to entire group
            List<GroupMember> members = groupMemberRepository.findByGroup(group);
            for (GroupMember member : members) {
                targets.add(member.getMentee());
            }
        } else if (request.getMenteeId() != null) {
            // Assign to individual mentee
            User mentee = userRepository.findById(request.getMenteeId())
                    .orElseThrow(() -> new RuntimeException("Mentee not found"));
            targets.add(mentee);
        }

        if (targets.isEmpty()) {
            throw new RuntimeException("Error: No mentees found to assign this task to.");
        }

        for (User mentee : targets) {
            TaskAssignment assignment = TaskAssignment.builder()
                    .task(savedTask)
                    .mentee(mentee)
                    .status(AssignmentStatus.ASSIGNED)
                    .readStatus(false)
                    .build();
            taskAssignmentRepository.save(assignment);

            notificationService.sendNotification(mentee, "Task Assigned", 
                    String.format("New Task: '%s' has been assigned to you by %s for Week %d.", 
                            savedTask.getTitle(), mentor.getName(), savedTask.getWeekNumber()));
        }

        auditLogService.logAction(mentorEmail, "TASK_CREATED", 
                String.format("Created task '%s' assigned to %d mentees", savedTask.getTitle(), targets.size()));

        return savedTask;
    }

    // Helper getter for requests
    public static class TaskRequestWrapper extends TaskRequest {
        public Long getMenteetId() {
            return null; // For legacy matching
        }
    }

    public List<Task> getTasksCreatedByMentor(String mentorEmail) {
        User mentor = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));
        return taskRepository.findByMentor(mentor);
    }

    public List<TaskAssignment> getAssignmentsForMentee(String menteeEmail) {
        User mentee = userRepository.findByEmail(menteeEmail)
                .orElseThrow(() -> new RuntimeException("Mentee not found"));
        return taskAssignmentRepository.findByMentee(mentee);
    }

    public List<TaskAssignment> getAssignmentsForMentorTasks(String mentorEmail) {
        User mentor = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));
        return taskAssignmentRepository.findByMentor(mentor);
    }

    public List<TaskAssignment> getPendingReviewsForMentor(String mentorEmail) {
        User mentor = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));
        return taskAssignmentRepository.findByMentorAndStatus(mentor, AssignmentStatus.SUBMITTED);
    }

    @Transactional
    public TaskAssignment markTaskAsRead(Long assignmentId, String menteeEmail) {
        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Task assignment not found"));

        if (!assignment.getMentee().getEmail().equals(menteeEmail)) {
            throw new RuntimeException("Unauthorized to update this task assignment.");
        }

        assignment.setReadStatus(true);
        if (assignment.getStatus() == AssignmentStatus.ASSIGNED) {
            assignment.setStatus(AssignmentStatus.VIEWED);
        }

        return taskAssignmentRepository.save(assignment);
    }

    @Transactional
    public TaskAssignment startTask(Long assignmentId, String menteeEmail) {
        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Task assignment not found"));

        if (!assignment.getMentee().getEmail().equals(menteeEmail)) {
            throw new RuntimeException("Unauthorized to update this task assignment.");
        }

        if (assignment.getStatus() == AssignmentStatus.ASSIGNED || assignment.getStatus() == AssignmentStatus.VIEWED) {
            assignment.setStatus(AssignmentStatus.IN_PROGRESS);
        }

        return taskAssignmentRepository.save(assignment);
    }

    @Transactional
    public void deleteTask(Long taskId, String mentorEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getMentor().getEmail().equals(mentorEmail)) {
            throw new RuntimeException("Unauthorized: You did not create this task.");
        }

        taskRepository.delete(task);

        auditLogService.logAction(mentorEmail, "TASK_DELETED", "Deleted task: " + task.getTitle());
    }

    @Transactional
    public Task updateTask(Long taskId, TaskRequest request, String mentorEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getMentor().getEmail().equals(mentorEmail)) {
            throw new RuntimeException("Unauthorized: You did not create this task.");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDeadline(request.getDeadline());
        task.setWeekNumber(request.getWeekNumber());
        task.setPriority(request.getPriority());

        Task updatedTask = taskRepository.save(task);

        // Notify all assigned mentees about the task update
        List<TaskAssignment> assignments = taskAssignmentRepository.findByTask(updatedTask);
        for (TaskAssignment assignment : assignments) {
            notificationService.sendNotification(assignment.getMentee(), "Task Updated", 
                    String.format("Task details for '%s' have been updated by your mentor.", updatedTask.getTitle()));
        }

        auditLogService.logAction(mentorEmail, "TASK_UPDATED", "Updated task: " + updatedTask.getTitle());

        return updatedTask;
    }
}
