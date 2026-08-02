package com.mentx.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    @Value("${BREVO_API_KEY:}")
    private String apiKey;

    @Value("${SPRING_MAIL_USERNAME:ash200327@gmail.com}")
    private String fromEmail;

    @Autowired
    private ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .build();

    public void sendEmailAsync(String to, String subject, String body) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.err.println("BREVO_API_KEY not configured. Skipping email to: " + to);
            return;
        }
        if (to == null || to.trim().isEmpty()) {
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                // Build the Brevo API request payload
                Map<String, Object> payload = new HashMap<>();
                payload.put("sender", Map.of("name", "Ment-X Platform", "email", fromEmail));
                payload.put("to", List.of(Map.of("email", to)));
                payload.put("subject", subject);
                payload.put("textContent", body);

                String jsonPayload = objectMapper.writeValueAsString(payload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.brevo.com/v3/smtp/emails"))
                        .header("api-key", apiKey)
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 201 || response.statusCode() == 200) {
                    System.out.println("Email sent successfully via Brevo to: " + to);
                } else {
                    System.err.println("Failed to send email via Brevo to " + to + ". Status code: " + response.statusCode() + ", Response: " + response.body());
                }
            } catch (Exception e) {
                System.err.println("Failed to send email via Brevo to " + to + ": " + e.getMessage());
            }
        });
    }
}
