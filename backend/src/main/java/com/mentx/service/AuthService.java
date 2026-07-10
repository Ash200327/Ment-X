package com.mentx.service;

import com.mentx.dto.JwtResponse;
import com.mentx.dto.LoginRequest;
import com.mentx.dto.RegisterRequest;
import com.mentx.dto.UserResponse;
import com.mentx.model.Role;
import com.mentx.model.User;
import com.mentx.model.UserStatus;
import com.mentx.repository.UserRepository;
import com.mentx.security.JwtUtils;
import com.mentx.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public UserResponse registerUser(RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Create new user's account
        User user = User.builder()
                .name(signUpRequest.getName())
                .email(signUpRequest.getEmail())
                .password(passwordEncoder.encode(signUpRequest.getPassword()))
                .role(signUpRequest.getRole())
                .status(UserStatus.PENDING_VERIFICATION) // Requires Admin Approval
                .verified(false)
                .build();

        User savedUser = userRepository.save(user);
        auditLogService.logAction(savedUser.getEmail(), "USER_REGISTERED", "Registered as " + savedUser.getRole());

        return convertToResponse(savedUser);
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        // Retrieve the user from db to check status before authentication
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new RuntimeException("Error: Your account is pending admin verification.");
        } else if (user.getStatus() == UserStatus.REJECTED) {
            throw new RuntimeException("Error: Your registration request was rejected by admin.");
        } else if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new RuntimeException("Error: Your account has been suspended.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        auditLogService.logAction(userDetails.getUsername(), "USER_LOGIN", "Successfully logged in");

        return new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getName(),
                userDetails.getUsername(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getProfilePicture() != null && !user.getProfilePicture().isEmpty());
    }

    @Transactional
    public UserResponse updateProfile(String email, String name, String newPassword, String profilePicture) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        user.setName(name);
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }
        if (profilePicture != null) {
            user.setProfilePicture(profilePicture);
        }

        User updatedUser = userRepository.save(user);
        auditLogService.logAction(updatedUser.getEmail(), "PROFILE_UPDATED", "Updated profile settings");

        return convertToResponse(updatedUser);
    }

    public UserResponse convertToResponse(User user) {
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
