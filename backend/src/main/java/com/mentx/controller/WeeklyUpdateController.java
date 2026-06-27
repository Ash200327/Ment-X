package com.mentx.controller;

import com.mentx.dto.WeeklyUpdateRequest;
import com.mentx.model.WeeklyUpdate;
import com.mentx.service.WeeklyUpdateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/updates")
public class WeeklyUpdateController {

    @Autowired
    private WeeklyUpdateService weeklyUpdateService;

    @PostMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasRole('MENTEE')")
    public ResponseEntity<?> submitUpdate(@PathVariable Long assignmentId, 
                                           @Valid @RequestBody WeeklyUpdateRequest request, 
                                           Principal principal) {
        try {
            WeeklyUpdate wu = weeklyUpdateService.submitUpdate(assignmentId, request, principal.getName());
            return ResponseEntity.ok(wu);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/assignments/{assignmentId}")
    public ResponseEntity<?> getUpdateForAssignment(@PathVariable Long assignmentId, Principal principal) {
        try {
            WeeklyUpdate wu = weeklyUpdateService.getUpdateForAssignment(assignmentId, principal.getName());
            return ResponseEntity.ok(wu);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }
}
