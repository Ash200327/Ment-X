package com.mentx.service;

import com.mentx.dto.UserResponse;
import com.mentx.model.*;
import com.mentx.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskAssignmentRepository taskAssignmentRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersPendingVerification() {
        return userRepository.findByStatus(UserStatus.PENDING_VERIFICATION).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void verifyUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        user.setStatus(UserStatus.APPROVED);
        user.setVerified(true);
        userRepository.save(user);

        auditLogService.logAction(adminEmail, "USER_VERIFIED", "Approved user: " + user.getEmail());
        notificationService.sendNotification(user, "Admin Approved", "Congratulations! Your account has been verified by the administrator. You can now login and explore the platform.");
    }

    @Transactional
    public void rejectUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        user.setStatus(UserStatus.REJECTED);
        user.setVerified(false);
        userRepository.save(user);

        auditLogService.logAction(adminEmail, "USER_REJECTED", "Rejected user: " + user.getEmail());
        notificationService.sendNotification(user, "Registration Rejected", "We regret to inform you that your registration request was rejected by the admin.");
    }

    @Transactional
    public void suspendUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        auditLogService.logAction(adminEmail, "USER_SUSPENDED", "Suspended user: " + user.getEmail());
    }

    @Transactional
    public void activateUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        user.setStatus(UserStatus.APPROVED);
        userRepository.save(user);

        auditLogService.logAction(adminEmail, "USER_ACTIVATED", "Activated/Approved user: " + user.getEmail());
    }

    @Transactional
    public void deleteUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        userRepository.delete(user);
        auditLogService.logAction(adminEmail, "USER_DELETED", "Deleted user account: " + user.getEmail());
    }

    @Transactional
    public void resetAllScores(String adminEmail) {
        scoreRepository.deleteAll();
        // Update task assignments back to not complete if appropriate, or just delete scores
        auditLogService.logAction(adminEmail, "SCORES_RESET", "Reset all weekly scores on the platform.");
    }

    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMentors", userRepository.countByRole(Role.MENTOR));
        stats.put("totalMentees", userRepository.countByRole(Role.MENTEE));
        stats.put("pendingVerifications", userRepository.countByStatus(UserStatus.PENDING_VERIFICATION));
        stats.put("totalGroups", groupRepository.count());
        stats.put("totalTasks", taskRepository.count());
        stats.put("totalSubmissions", taskAssignmentRepository.countByMenteeAndStatus(null, AssignmentStatus.SUBMITTED) + taskAssignmentRepository.countByMenteeAndStatus(null, AssignmentStatus.COMPLETED));
        return stats;
    }

    private UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .verified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
