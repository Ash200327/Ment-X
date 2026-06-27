package com.mentx.controller;

import com.mentx.dto.TaskRequest;
import com.mentx.model.Task;
import com.mentx.model.TaskAssignment;
import com.mentx.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<?> createTask(@Valid @RequestBody TaskRequest request, Principal principal) {
        try {
            Task task = taskService.createTask(request, principal.getName());
            return ResponseEntity.ok(task);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/mentor")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<List<Task>> getMentorTasks(Principal principal) {
        return ResponseEntity.ok(taskService.getTasksCreatedByMentor(principal.getName()));
    }

    @GetMapping("/mentee")
    @PreAuthorize("hasRole('MENTEE')")
    public ResponseEntity<List<TaskAssignment>> getMenteeTasks(Principal principal) {
        return ResponseEntity.ok(taskService.getAssignmentsForMentee(principal.getName()));
    }

    @GetMapping("/mentor/assignments")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<List<TaskAssignment>> getMentorAssignments(Principal principal) {
        return ResponseEntity.ok(taskService.getAssignmentsForMentorTasks(principal.getName()));
    }

    @GetMapping("/mentor/pending-reviews")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<List<TaskAssignment>> getPendingReviews(Principal principal) {
        return ResponseEntity.ok(taskService.getPendingReviewsForMentor(principal.getName()));
    }

    @PatchMapping("/assignments/{assignmentId}/read")
    @PreAuthorize("hasRole('MENTEE')")
    public ResponseEntity<?> markAsRead(@PathVariable Long assignmentId, Principal principal) {
        try {
            TaskAssignment ta = taskService.markTaskAsRead(assignmentId, principal.getName());
            return ResponseEntity.ok(ta);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @PatchMapping("/assignments/{assignmentId}/start")
    @PreAuthorize("hasRole('MENTEE')")
    public ResponseEntity<?> startTask(@PathVariable Long assignmentId, Principal principal) {
        try {
            TaskAssignment ta = taskService.startTask(assignmentId, principal.getName());
            return ResponseEntity.ok(ta);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<?> deleteTask(@PathVariable Long taskId, Principal principal) {
        try {
            taskService.deleteTask(taskId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("Task deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{taskId}")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<?> updateTask(@PathVariable Long taskId, @Valid @RequestBody TaskRequest request, Principal principal) {
        try {
            Task task = taskService.updateTask(taskId, request, principal.getName());
            return ResponseEntity.ok(task);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }
}
