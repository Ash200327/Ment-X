package com.mentx.controller;

import com.mentx.model.Notification;
import com.mentx.model.User;
import com.mentx.repository.UserRepository;
import com.mentx.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(user));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(new AuthController.MessageResponse("Notification marked as read."));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Principal principal) {
        User user = getAuthenticatedUser(principal);
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(new AuthController.MessageResponse("All notifications marked as read."));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Principal principal) {
        User user = getAuthenticatedUser(principal);
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/recipients")
    public ResponseEntity<?> getRecipients(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(notificationService.getRecipientsForUser(user));
    }

    @PostMapping
    public ResponseEntity<?> sendCustomNotification(@jakarta.validation.Valid @RequestBody com.mentx.dto.SendNotificationRequest request, Principal principal) {
        try {
            User user = getAuthenticatedUser(principal);
            notificationService.sendCustomNotification(user, request);
            return ResponseEntity.ok(new AuthController.MessageResponse("Notification sent successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }
}
