package com.mentx.controller;

import com.mentx.dto.ReviewRequest;
import com.mentx.model.Remark;
import com.mentx.model.Score;
import com.mentx.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping("/updates/{updateId}")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<?> reviewSubmission(@PathVariable Long updateId, 
                                               @Valid @RequestBody ReviewRequest request, 
                                               Principal principal) {
        try {
            reviewService.reviewSubmission(updateId, request, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("Review submitted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/updates/{updateId}/remark")
    public ResponseEntity<?> getRemarkForUpdate(@PathVariable Long updateId, Principal principal) {
        try {
            Remark remark = reviewService.getRemarkForUpdate(updateId, principal.getName());
            return ResponseEntity.ok(remark);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/assignments/{assignmentId}/score")
    public ResponseEntity<?> getScoreForAssignment(@PathVariable Long assignmentId, Principal principal) {
        try {
            Score score = reviewService.getScoreForAssignment(assignmentId, principal.getName());
            return ResponseEntity.ok(score);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/my-scores")
    @PreAuthorize("hasRole('MENTEE')")
    public ResponseEntity<?> getMyScores(Principal principal) {
        try {
            return ResponseEntity.ok(reviewService.getScoresForMentee(principal.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/manual")
    @PreAuthorize("hasAnyRole('MENTOR', 'ADMIN')")
    public ResponseEntity<?> assignManualScore(@Valid @RequestBody com.mentx.dto.ManualScoreRequest request, Principal principal) {
        try {
            reviewService.assignManualScore(request, principal.getName());
            return ResponseEntity.ok(new AuthController.MessageResponse("Manual score assigned successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthController.MessageResponse(e.getMessage()));
        }
    }
}
