package com.smarthire.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
public class EmailService {

    private final WebClient webClient;

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    public EmailService(WebClient.Builder builder) {
        this.webClient = builder
                .baseUrl("https://api.brevo.com/v3")
                .build();
    }

    // =========================
    // CORE EMAIL METHOD (BREVO API)
    // =========================
    private void sendEmail(String to, String subject, String body) {

        try {
            Map<String, Object> payload = new HashMap<>();

            Map<String, String> sender = new HashMap<>();
            sender.put("name", senderName);
            sender.put("email", senderEmail);

            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", to);

            payload.put("sender", sender);
            payload.put("to", List.of(recipient));
            payload.put("subject", subject);
            payload.put("htmlContent", body.replace("\n", "<br>"));

            webClient.post()
                    .uri("/smtp/email")
                    .header(HttpHeaders.AUTHORIZATION, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            System.out.println("✅ Email sent successfully to: " + to);

        } catch (Exception e) {
            System.err.println("❌ Email sending failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // =========================
    // BUSINESS METHODS
    // =========================

    public void sendCredentials(String to, String name, String username, String password) {
        String body =
                "Dear " + name + ",\n\n" +
                "Welcome to SmartHire!\n\n" +
                "Username: " + username + "\n" +
                "Password: " + password + "\n\n" +
                "Login: https://smart-hire-ats-portal.vercel.app\n\n" +
                "Regards,\nSmartHire Team";

        sendEmail(to, "SmartHire – Your Account Credentials", body);
    }

    public void sendSelectionEmail(String to, String name, String jobTitle) {
        String body =
                "Dear " + name + ",\n\n" +
                "🎉 Congratulations! You are SELECTED for: " + jobTitle + "\n\n" +
                "HR will contact you soon.\n\n" +
                "Regards,\nSmartHire Team";

        sendEmail(to, "Selection Confirmation: " + jobTitle, body);
    }

    public void sendRejectionEmail(String to, String name, String jobTitle, String skillGap) {

        String body =
                "Dear " + name + ",\n\n" +
                "Thank you for applying for " + jobTitle + ".\n\n" +
                "Unfortunately, you were not selected.\n\n" +
                (skillGap != null && !skillGap.isEmpty()
                        ? "Improve skills in: " + skillGap + "\n\n"
                        : "") +
                "Regards,\nSmartHire Team";

        sendEmail(to, "Application Update: " + jobTitle, body);
    }

    public void sendOtpEmail(String to, String otp) {
        String body =
                "Your OTP is: " + otp + "\n\n" +
                "Valid for 10 minutes.\nDo not share it.";

        sendEmail(to, "SmartHire OTP Verification", body);
    }
}
