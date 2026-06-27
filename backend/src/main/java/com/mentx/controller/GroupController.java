package com.mentx.controller;

import com.mentx.dto.GroupRequest;
import com.mentx.dto.UserResponse;
import com.mentx.model.Group;
import com.mentx.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MENTOR', 'ADMIN')")
    public ResponseEntity<Group> createGroup(@Valid @RequestBody GroupRequest request, Principal principal) {
        Group group = groupService.createGroup(request, principal.getName());
        return ResponseEntity.ok(group);
    }

    @GetMapping
    public ResponseEntity<List<Group>> getGroups(Principal principal) {
        // Return groups managed by current mentor
        return ResponseEntity.ok(groupService.getGroupsByMentor(principal.getName()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Group>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @PostMapping("/{groupId}/members/{menteeId}")
    @PreAuthorize("hasAnyRole('MENTOR', 'ADMIN')")
    public ResponseEntity<?> addMember(@PathVariable Long groupId, @PathVariable Long menteeId, Principal principal) {
        try {
            groupService.addMember(groupId, menteeId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("Member added successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}/members/{menteeId}")
    @PreAuthorize("hasAnyRole('MENTOR', 'ADMIN')")
    public ResponseEntity<?> removeMember(@PathVariable Long groupId, @PathVariable Long menteeId, Principal principal) {
        try {
            groupService.removeMember(groupId, menteeId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("Member removed successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<UserResponse>> getGroupMembers(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroupMembers(groupId));
    }

    @DeleteMapping("/{groupId}")
    @PreAuthorize("hasAnyRole('MENTOR', 'ADMIN')")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId, Principal principal) {
        try {
            groupService.deleteGroup(groupId, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("Group deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }
}
