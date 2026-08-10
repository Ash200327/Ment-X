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

    private static final String HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="color-scheme" content="dark">
              <meta name="supported-color-schemes" content="dark">
              <title>Ment-X Notification</title>
              <style type="text/css">
                /* Client-specific Resets */
                body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                
                /* General Styles */
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  background-color: #090D16;
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  -webkit-font-smoothing: antialiased;
                }
                
                .link-hover:hover {
                  text-decoration: underline !important;
                  color: #818CF8 !important;
                }
            
                /* Responsive Styles */
                @media screen and (max-width: 600px) {
                  .email-container {
                    width: 100% !important;
                    padding: 10px !important;
                  }
                  .content-padding {
                    padding: 28px 20px !important;
                  }
                  .header-padding {
                    padding: 28px 20px !important;
                  }
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #090D16;">
            
              <!-- Outer Canvas -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #090D16; table-layout: fixed;">
                <tr>
                  <td align="center" style="padding: 40px 10px;">
                    
                    <!-- Main Email Container (600px Max) -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #0F172A; border-radius: 16px; overflow: hidden; border: 1px solid #1E293B; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);">
                      
                      <!-- Top Gradient Accent Line -->
                      <tr>
                        <td height="4" style="background: linear-gradient(90deg, #6366F1 0%, #F43F5E 50%, #818CF8 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                      </tr>
            
                      <!-- Header Layer -->
                      <tr>
                        <td align="center" class="header-padding" style="background-color: #0B0F19; padding: 36px 32px; border-bottom: 1px solid #1E293B;">
                          <a href="https://ment-x.vercel.app/" style="text-decoration: none;" target="_blank">
                            <span style="font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; font-family: 'Inter', sans-serif;">Ment-X<span style="color: #F43F5E;">.</span></span>
                          </a>
                        </td>
                      </tr>
            
                      <!-- Main Content Layer -->
                      <tr>
                        <td class="content-padding" style="padding: 40px 36px; background-color: #0F172A;">
                          
                          <!-- Title -->
                          <h1 style="margin: 0 0 18px 0; font-size: 22px; font-weight: 700; color: #F8FAFC; line-height: 1.3; letter-spacing: -0.3px;">
                            {{TITLE}}
                          </h1>
            
                          <!-- Message Body -->
                          <div style="font-size: 15px; line-height: 1.7; color: #94A3B8; white-space: pre-line;">
                            {{MESSAGE}}
                          </div>
            
                        </td>
                      </tr>
            
                      <!-- Divider -->
                      <tr>
                        <td style="padding: 0 36px;">
                          <div style="border-top: 1px solid #1E293B; height: 1px; width: 100%;"></div>
                        </td>
                      </tr>
            
                      <!-- Footer Layer -->
                      <tr>
                        <td style="padding: 32px; background-color: #0B0F19; text-align: center; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
                          
                          <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                            This is an automated notification from the <strong style="color: #94A3B8;">Ment-X Platform</strong>.
                          </p>
            
                          <!-- Footer Navigation -->
                          <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: 500;">
                            <a href="https://ment-x.vercel.app/" class="link-hover" style="color: #818CF8; text-decoration: none;">Dashboard</a>
                            <span style="color: #334155; margin: 0 8px;">&bull;</span>
                            <a href="mailto:ash200327@gmail.com" class="link-hover" style="color: #818CF8; text-decoration: none;">Get Support</a>
                          </p>
            
                          <!-- Copyright -->
                          <p style="margin: 0; font-size: 12px; color: #475569;">
                            &copy; 2026 Ment-X. All rights reserved.
                          </p>
            
                        </td>
                      </tr>
            
                    </table>
                    <!-- End Email Container -->
            
                  </td>
                </tr>
              </table>
            
            </body>
            </html>
            """;

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
                // Build the HTML formatted email body
                String escapedTitle = escapeHtml(subject);
                String formattedMessage = formatMessageToHtml(body);
                String htmlBody = HTML_TEMPLATE
                        .replace("{{TITLE}}", escapedTitle)
                        .replace("{{MESSAGE}}", formattedMessage);

                // Build the Brevo API request payload
                Map<String, Object> payload = new HashMap<>();
                payload.put("sender", Map.of("name", "Ment-X Platform", "email", fromEmail));
                payload.put("to", List.of(Map.of("email", to)));
                payload.put("subject", subject);
                payload.put("textContent", body);
                payload.put("htmlContent", htmlBody);

                String jsonPayload = objectMapper.writeValueAsString(payload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
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

    private String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String formatMessageToHtml(String text) {
        if (text == null) {
            return "";
        }
        String escaped = escapeHtml(text);
        return escaped.replace("\n", "<br />");
    }
}
