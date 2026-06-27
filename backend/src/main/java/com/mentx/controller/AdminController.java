package com.mentx.controller;

import com.mentx.dto.UserResponse;
import com.mentx.service.AdminService;
import com.mentx.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/pending-verifications")
    public ResponseEntity<List<UserResponse>> getPendingVerifications() {
        return ResponseEntity.ok(adminService.getUsersPendingVerification());
    }

    @PostMapping("/verify/{userId}")
    public ResponseEntity<?> verifyUser(@PathVariable Long userId, Principal principal) {
        try {
            adminService.verifyUser(userId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("User verified successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/reject/{userId}")
    public ResponseEntity<?> rejectUser(@PathVariable Long userId, Principal principal) {
        try {
            adminService.rejectUser(userId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("User registration rejected."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/suspend/{userId}")
    public ResponseEntity<?> suspendUser(@PathVariable Long userId, Principal principal) {
        try {
            adminService.suspendUser(userId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("User account suspended."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/activate/{userId}")
    public ResponseEntity<?> activateUser(@PathVariable Long userId, Principal principal) {
        try {
            adminService.activateUser(userId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("User account activated."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, Principal principal) {
        try {
            adminService.deleteUser(userId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("User deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-scores")
    public ResponseEntity<?> resetAllScores(Principal principal) {
        adminService.resetAllScores(principal.getName());
        return ResponseEntity.ok(new AuthController.MessageResponse("All leaderboard scores reset successfully."));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }
}
