package com.mentx.controller;

import com.mentx.dto.JwtResponse;
import com.mentx.dto.LoginRequest;
import com.mentx.dto.ProfileUpdateRequest;
import com.mentx.dto.RegisterRequest;
import com.mentx.dto.UserResponse;
import com.mentx.model.User;
import com.mentx.repository.UserRepository;
import com.mentx.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            UserResponse response = authService.registerUser(registerRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
            return ResponseEntity.ok(jwtResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody ProfileUpdateRequest request, Principal principal) {
        try {
            UserResponse response = authService.updateProfile(
                    principal.getName(), 
                    request.getName(), 
                    request.getNewPassword(), 
                    request.getProfilePicture()
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return ResponseEntity.ok(authService.convertToResponse(user));
    }

    @GetMapping("/mentees")
    public ResponseEntity<?> getApprovedMentees() {
        return ResponseEntity.ok(userRepository.findByRoleAndStatus(com.mentx.model.Role.MENTEE, com.mentx.model.UserStatus.APPROVED)
                .stream().map(authService::convertToResponse).collect(java.util.stream.Collectors.toList()));
    }

    // Helper Response DTO for sending simple text messages
    public static class MessageResponse {
        private String message;
        public MessageResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
