package com.smarthire.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private void sendEmail(String to, String subject, String body) {
        System.out.println("\n📧 ===== EMAIL SIMULATION =====");
        System.out.println("To      : " + to);
        System.out.println("Subject : " + subject);
        System.out.println("Body    :\n" + body);
        System.out.println("==============================\n");

        if (mailSender != null) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setTo(to);
                msg.setSubject(subject);
                msg.setText(body);
                mailSender.send(msg);
            } catch (Exception e) {
                System.err.println("Real email send failed: " + e.getMessage());
            }
        }
    }

    public void sendCredentials(String to, String name, String username, String password) {
        String body = "Dear " + name + ",\n\n" +
                "Welcome to SmartHire! Your account has been created.\n\n" +
                "Your Login Credentials:\n" +
                "Username : " + username + "\n" +
                "Password : " + password + "\n\n" +
                "Please login at: http://localhost:3000/login\n\n" +
                "Regards,\nSmartHire Team";
        sendEmail(to, "SmartHire – Your Account Credentials", body);
    }

    public void sendSelectionEmail(String to, String name, String jobTitle) {
        String body = "Dear " + name + ",\n\n" +
                "🎉 Congratulations! You have been SELECTED for the position of:\n" +
                "Job Title : " + jobTitle + "\n\n" +
                "Our HR team will contact you shortly with next steps.\n\n" +
                "Best regards,\nSmartHire Recruitment Team";
        sendEmail(to, "SmartHire – Selection Confirmation: " + jobTitle, body);
    }

    public void sendRejectionEmail(String to, String name, String jobTitle, String skillGap) {
        String body = "Dear " + name + ",\n\n" +
                "Thank you for applying for: " + jobTitle + "\n\n" +
                "After careful consideration, we regret to inform you that your application was not selected " +
                "at this time.\n\n" +
                (skillGap != null && !skillGap.isEmpty()
                        ? "To improve your chances, we suggest working on: " + skillGap + "\n\n"
                        : "") +
                "We encourage you to apply for future openings.\n\n" +
                "Regards,\nSmartHire Recruitment Team";
        sendEmail(to, "SmartHire – Application Update: " + jobTitle, body);
    }

    public void sendOtpEmail(String to, String otp) {
        String body = "Your SmartHire OTP for mobile verification is: " + otp +
                "\n\nThis OTP is valid for 10 minutes.\n\nDo not share it with anyone.";
        sendEmail(to, "SmartHire – OTP Verification", body);
    }
}
