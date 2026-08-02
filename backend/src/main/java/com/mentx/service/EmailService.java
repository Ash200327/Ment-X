package com.mentx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendEmailAsync(String to, String subject, String body) {
        if (mailSender == null) {
            System.err.println("JavaMailSender not configured. Skipping email to: " + to);
            return;
        }
        if (to == null || to.trim().isEmpty()) {
            return;
        }
        
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                System.out.println("Email sent successfully to: " + to);
            } catch (Exception e) {
                System.err.println("Failed to send email to " + to + ": " + e.getMessage());
            }
        });
    }
}
