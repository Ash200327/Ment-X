package com.mentx.service;

import com.mentx.model.Notification;
import com.mentx.model.User;
import com.mentx.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

import com.mentx.dto.SendNotificationRequest;
import com.mentx.dto.UserResponse;
import com.mentx.model.Role;
import com.mentx.model.Group;
import com.mentx.model.GroupMember;
import com.mentx.repository.UserRepository;
import com.mentx.repository.GroupRepository;
import com.mentx.repository.GroupMemberRepository;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    private final java.net.http.HttpClient httpClient = java.net.http.HttpClient.newHttpClient();

    @Transactional
    public void registerPushToken(User user, String token) {
        user.setPushToken(token);
        userRepository.save(user);
    }

    public void sendPushNotificationAsync(String expoPushToken, String title, String body) {
        if (expoPushToken == null || expoPushToken.trim().isEmpty()) {
            return;
        }
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                java.net.URI uri = java.net.URI.create("https://exp.host/--/api/v2/push/send");
                String jsonPayload = String.format(
                    "{\"to\":\"%s\",\"title\":\"%s\",\"body\":\"%s\",\"sound\":\"default\"}",
                    escapeJson(expoPushToken),
                    escapeJson(title),
                    escapeJson(body)
                );
                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                        .uri(uri)
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();
                java.net.http.HttpResponse<String> response = httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() != 200) {
                    System.err.println("Failed to send Expo push notification: " + response.body());
                }
            } catch (Exception e) {
                System.err.println("Error sending Expo push notification: " + e.getMessage());
            }
        });
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\b", "\\b")
                  .replace("\f", "\\f")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    @Transactional
    public void sendNotification(User user, String title, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .readStatus(false)
                .build();
        notificationRepository.save(notification);
        if (user.getPushToken() != null) {
            sendPushNotificationAsync(user.getPushToken(), title, message);
        }
    }

    public List<Notification> getNotificationsForUser(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setReadStatus(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        for (Notification n : unread) {
            if (!n.isReadStatus()) {
                n.setReadStatus(true);
            }
        }
        notificationRepository.saveAll(unread);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadStatus(user, false);
    }

    public List<UserResponse> getRecipientsForUser(User sender) {
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
                .filter(u -> u.isVerified() && !u.getId().equals(sender.getId()))
                .filter(u -> {
                    if (sender.getRole() == Role.MENTOR) {
                        return u.getRole() == Role.MENTOR || u.getRole() == Role.ADMIN || u.getRole() == Role.MENTEE;
                    } else if (sender.getRole() == Role.ADMIN) {
                        return u.getRole() == Role.MENTOR || u.getRole() == Role.MENTEE;
                    } else if (sender.getRole() == Role.MENTEE) {
                        return u.getRole() == Role.MENTOR;
                    }
                    return false;
                })
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void sendCustomNotification(User sender, SendNotificationRequest request) {
        if (request.getTargetGroupId() != null) {
            Group group = groupRepository.findById(request.getTargetGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            if (sender.getRole() == Role.MENTOR) {
                if (!group.getMentor().getId().equals(sender.getId())) {
                    throw new RuntimeException("Unauthorized: You do not manage this group.");
                }
            } else if (sender.getRole() != Role.ADMIN) {
                throw new RuntimeException("Unauthorized: Only Mentors and Admins can send group notifications.");
            }

            List<GroupMember> members = groupMemberRepository.findByGroup(group);
            for (GroupMember member : members) {
                User target = member.getMentee();
                if (target.isVerified()) {
                    String fullMessage = request.getMessage() + " (Group Notice: " + group.getGroupName() + ", by " + sender.getName() + ")";
                    Notification notification = Notification.builder()
                            .user(target)
                            .title(request.getTitle())
                            .message(fullMessage)
                            .readStatus(false)
                            .build();
                    notificationRepository.save(notification);
                    if (target.getPushToken() != null) {
                        sendPushNotificationAsync(target.getPushToken(), request.getTitle(), fullMessage);
                    }
                }
            }
        } else if (request.getTargetUserId() != null) {
            User target = userRepository.findById(request.getTargetUserId())
                    .orElseThrow(() -> new RuntimeException("Target user not found"));

            if (!target.isVerified()) {
                throw new RuntimeException("Cannot send notification to an unverified user.");
            }

            // Validate sending permissions
            if (sender.getRole() == Role.MENTOR) {
                if (target.getRole() != Role.MENTOR && target.getRole() != Role.ADMIN && target.getRole() != Role.MENTEE) {
                    throw new RuntimeException("Unauthorized: Mentors can only send notifications to other Mentors, Admins, and Mentees.");
                }
            } else if (sender.getRole() == Role.ADMIN) {
                if (target.getRole() != Role.MENTOR && target.getRole() != Role.MENTEE) {
                    throw new RuntimeException("Unauthorized: Admins can only send notifications to Mentors and Mentees.");
                }
            } else if (sender.getRole() == Role.MENTEE) {
                if (target.getRole() != Role.MENTOR) {
                    throw new RuntimeException("Unauthorized: Mentees can only send notifications to Mentors.");
                }
            } else {
                throw new RuntimeException("Unauthorized: Unknown role.");
            }

            String fullMessage = request.getMessage() + " (From: " + sender.getName() + ")";
            Notification notification = Notification.builder()
                    .user(target)
                    .title(request.getTitle())
                    .message(fullMessage)
                    .readStatus(false)
                    .build();

            notificationRepository.save(notification);
            if (target.getPushToken() != null) {
                sendPushNotificationAsync(target.getPushToken(), request.getTitle(), fullMessage);
            }
        } else {
            throw new RuntimeException("Either targetUserId or targetGroupId must be specified.");
        }
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
