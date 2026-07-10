package com.mentx.service;

import com.mentx.dto.GroupRequest;
import com.mentx.dto.UserResponse;
import com.mentx.dto.MenteeGroupResponse;
import com.mentx.model.*;
import com.mentx.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Group createGroup(GroupRequest request, String mentorEmail) {
        User mentor = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        Group group = Group.builder()
                .groupName(request.getGroupName())
                .description(request.getDescription())
                .mentor(mentor)
                .build();

        Group savedGroup = groupRepository.save(group);
        auditLogService.logAction(mentorEmail, "GROUP_CREATED", "Created group: " + savedGroup.getGroupName());
        return savedGroup;
    }

    public List<Group> getGroupsByMentor(String mentorEmail) {
        User mentor = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));
        return groupRepository.findByMentor(mentor);
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    @Transactional
    public void addMember(Long groupId, Long menteeId, String mentorEmail) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        User caller = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (caller.getRole() != Role.ADMIN && !group.getMentor().getEmail().equals(mentorEmail)) {
            throw new RuntimeException("Unauthorized: You do not manage this group.");
        }

        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new RuntimeException("Mentee not found"));

        if (mentee.getRole() != Role.MENTEE) {
            throw new RuntimeException("Only users with role MENTEE can be added to a group.");
        }

        if (groupMemberRepository.existsByGroupAndMentee(group, mentee)) {
            throw new RuntimeException("Mentee is already a member of this group.");
        }

        GroupMember member = GroupMember.builder()
                .group(group)
                .mentee(mentee)
                .build();

        groupMemberRepository.save(member);

        auditLogService.logAction(mentorEmail, "GROUP_MEMBER_ADDED", "Added " + mentee.getEmail() + " to group " + group.getGroupName());
        notificationService.sendNotification(mentee, "Added to Group", "You have been added to the group: " + group.getGroupName());
    }

    @Transactional
    public void removeMember(Long groupId, Long menteeId, String mentorEmail) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        User caller = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (caller.getRole() != Role.ADMIN && !group.getMentor().getEmail().equals(mentorEmail)) {
            throw new RuntimeException("Unauthorized: You do not manage this group.");
        }

        User mentee = userRepository.findById(menteeId)
                .orElseThrow(() -> new RuntimeException("Mentee not found"));

        GroupMember member = groupMemberRepository.findByGroupAndMentee(group, mentee)
                .orElseThrow(() -> new RuntimeException("Mentee is not a member of this group."));

        groupMemberRepository.delete(member);

        auditLogService.logAction(mentorEmail, "GROUP_MEMBER_REMOVED", "Removed " + mentee.getEmail() + " from group " + group.getGroupName());
        notificationService.sendNotification(mentee, "Removed from Group", "You have been removed from the group: " + group.getGroupName());
    }

    public List<UserResponse> getGroupMembers(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        return groupMemberRepository.findByGroup(group).stream()
                .map(GroupMember::getMentee)
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteGroup(Long groupId, String mentorEmail) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        User caller = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (caller.getRole() != Role.ADMIN && !group.getMentor().getEmail().equals(mentorEmail)) {
            throw new RuntimeException("Unauthorized: You do not manage this group.");
        }

        groupRepository.delete(group);
        auditLogService.logAction(mentorEmail, "GROUP_DELETED", "Deleted group: " + group.getGroupName());
    }

    public List<MenteeGroupResponse> getGroupsByMentee(String menteeEmail) {
        User mentee = userRepository.findByEmail(menteeEmail)
                .orElseThrow(() -> new RuntimeException("Mentee not found"));

        List<GroupMember> memberships = groupMemberRepository.findByMentee(mentee);

        return memberships.stream()
                .map(GroupMember::getGroup)
                .map(group -> {
                    List<UserResponse> membersList = groupMemberRepository.findByGroup(group).stream()
                            .map(GroupMember::getMentee)
                            .map(this::convertToResponse)
                            .collect(Collectors.toList());

                    return MenteeGroupResponse.builder()
                            .id(group.getId())
                            .groupName(group.getGroupName())
                            .description(group.getDescription())
                            .mentor(convertToResponse(group.getMentor()))
                            .members(membersList)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private UserResponse convertToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .verified(user.isVerified())
                .hasProfilePicture(user.getProfilePicture() != null && !user.getProfilePicture().isEmpty())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
