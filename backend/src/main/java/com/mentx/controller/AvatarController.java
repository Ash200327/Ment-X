package com.mentx.controller;

import com.mentx.model.User;
import com.mentx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/users")
public class AvatarController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> getUserAvatar(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        
        if (userOpt.isEmpty() || userOpt.get().getProfilePicture() == null || userOpt.get().getProfilePicture().isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String base64Image = userOpt.get().getProfilePicture();
        
        // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
        String base64Data = base64Image;
        String mimeType = "image/jpeg"; // Default fallback
        
        if (base64Image.startsWith("data:")) {
            int commaIndex = base64Image.indexOf(',');
            if (commaIndex != -1) {
                String prefix = base64Image.substring(0, commaIndex);
                if (prefix.contains("image/png")) {
                    mimeType = "image/png";
                } else if (prefix.contains("image/gif")) {
                    mimeType = "image/gif";
                }
                base64Data = base64Image.substring(commaIndex + 1);
            }
        }

        try {
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(mimeType));
            // Cache the image for 7 days
            headers.setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).getHeaderValue());
            
            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
