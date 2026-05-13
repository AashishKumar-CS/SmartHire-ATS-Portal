package com.smarthire.controller;

import com.smarthire.model.Candidate;
import com.smarthire.model.EducationDetail;
import com.smarthire.service.CandidateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/candidate")
public class CandidateController {

    @Autowired private CandidateService candidateService;

    // ── OTP Rate Limiting ─────────────────────────────────────────────────────
    // Allows max 3 OTP sends per IP per 10-minute window
    private final ConcurrentHashMap<String, Integer> otpAttempts   = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long>    otpWindowStart = new ConcurrentHashMap<>();

    private static final int  MAX_OTP_PER_WINDOW = 3;
    private static final long OTP_WINDOW_MS      = 10 * 60 * 1000L; // 10 minutes

    // ── Allowed image MIME types for profile photo upload ─────────────────────
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    /** Extracts real client IP, works behind Render/Nginx reverse proxy */
    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // ── OTP ───────────────────────────────────────────────────────────────────

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String mobile = body.get("mobile");

        // Mobile number basic validation
        if (mobile == null || !mobile.matches("^[6-9]\\d{9}$")) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid mobile number. Enter a valid 10-digit Indian mobile number."
            ));
        }

        // OTP rate limiting — max 3 sends per 10 minutes per IP
        String ip = getClientIp(request);
        long now = System.currentTimeMillis();

        Long windowStart = otpWindowStart.get(ip);
        if (windowStart == null || (now - windowStart) > OTP_WINDOW_MS) {
            // New window — reset counter
            otpWindowStart.put(ip, now);
            otpAttempts.put(ip, 1);
        } else {
            int count = otpAttempts.merge(ip, 1, Integer::sum);
            if (count > MAX_OTP_PER_WINDOW) {
                long waitSeconds = (OTP_WINDOW_MS - (now - windowStart)) / 1000;
                return ResponseEntity.status(429).body(Map.of(
                    "success", false,
                    "message", "Too many OTP requests. Please wait " + waitSeconds + " seconds."
                ));
            }
        }

        return ResponseEntity.ok(candidateService.sendOtp(mobile));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> body) {
        boolean verified = candidateService.verifyOtp(body.get("mobile"), body.get("otp"));
        if (verified) return ResponseEntity.ok(Map.of("success", true, "message", "OTP verified"));
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid or expired OTP"));
    }

    // ── Registration ──────────────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> payload) {
        try {
            Candidate candidate = new Candidate();
            candidate.setFullName((String) payload.get("fullName"));
            candidate.setEmail((String) payload.get("email"));
            candidate.setMobile((String) payload.get("mobile"));
            candidate.setGender((String) payload.get("gender"));
            candidate.setAddress((String) payload.get("address"));
            String dob = (String) payload.get("dateOfBirth");
            if (dob != null && !dob.isBlank()) candidate.setDateOfBirth(LocalDate.parse(dob));
            candidate.setDomain((String) payload.get("domain"));
            candidate.setCertifications((String) payload.get("certifications"));
            candidate.setInternshipStatus((String) payload.get("internshipStatus"));
            candidate.setGithubLink((String) payload.get("githubLink"));
            candidate.setMobileVerified(Boolean.TRUE.equals(payload.get("mobileVerified")));

            // Education details
            List<EducationDetail> educationList = new ArrayList<>();
            Object eduRaw = payload.get("educationDetails");
            if (eduRaw instanceof List<?> eduListRaw) {
                for (Object item : eduListRaw) {
                    if (item instanceof Map<?, ?> m) {
                        EducationDetail edu = new EducationDetail();
                        edu.setLevel((String) m.get("level"));
                        edu.setInstitutionName((String) m.get("institutionName"));
                        edu.setBoardUniversity((String) m.get("boardUniversity"));
                        Object yr = m.get("yearOfPassing");
                        if (yr != null) {
                            try { edu.setYearOfPassing(Integer.parseInt(yr.toString())); } catch (Exception ignored) {}
                        }
                        edu.setPercentageCgpa((String) m.get("percentageCgpa"));
                        educationList.add(edu);
                    }
                }
            }

            // Skills
            List<String> skills = new ArrayList<>();
            Object skillsRaw = payload.get("skills");
            if (skillsRaw instanceof List<?> sl) {
                sl.forEach(s -> skills.add(s.toString()));
            }

            Map<String, Object> result = candidateService.register(candidate, educationList, skills);
            if (Boolean.TRUE.equals(result.get("success"))) return ResponseEntity.ok(result);
            return ResponseEntity.badRequest().body(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Registration error: " + e.getMessage()));
        }
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/profile/{candidateId}")
    public ResponseEntity<Map<String, Object>> getProfile(
            @PathVariable int candidateId,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return ResponseEntity.ok(candidateService.getProfile(candidateId));
    }

    @PutMapping("/profile/{candidateId}")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable int candidateId,
            @RequestBody Map<String, Object> payload) {
        try {
            Candidate candidate = new Candidate();
            candidate.setId(candidateId);
            candidate.setFullName((String) payload.get("fullName"));
            candidate.setGender((String) payload.get("gender"));
            candidate.setAddress((String) payload.get("address"));
            String dob = (String) payload.get("dateOfBirth");
            if (dob != null && !dob.isBlank()) candidate.setDateOfBirth(LocalDate.parse(dob));
            candidate.setDomain((String) payload.get("domain"));
            candidate.setCertifications((String) payload.get("certifications"));
            candidate.setInternshipStatus((String) payload.get("internshipStatus"));
            candidate.setGithubLink((String) payload.get("githubLink"));

            List<String> skills = new ArrayList<>();
            Object skillsRaw = payload.get("skills");
            if (skillsRaw instanceof List<?> sl) sl.forEach(s -> skills.add(s.toString()));

            return ResponseEntity.ok(candidateService.updateProfile(candidate, skills));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── File Uploads ──────────────────────────────────────────────────────────

    @PostMapping("/upload-resume/{candidateId}")
    public ResponseEntity<Map<String, Object>> uploadResume(
            @PathVariable int candidateId,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No file provided"));
        }

        // Null-safe MIME check (getContentType() can return null)
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Only PDF files are allowed."
            ));
        }

        // Size check (2MB max)
        if (file.getSize() > 2 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "File size exceeds the 2MB limit."
            ));
        }

        return ResponseEntity.ok(candidateService.uploadResume(candidateId, file));
    }

    @PostMapping("/upload-profile-image/{candidateId}")
    public ResponseEntity<Map<String, Object>> uploadProfileImage(
            @PathVariable int candidateId,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No file provided"));
        }

        // MIME type validation for images (was missing in original)
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Only image files allowed (JPG, PNG, GIF, WEBP)."
            ));
        }

        // Size check (5MB max for images)
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Image size exceeds the 5MB limit."
            ));
        }

        return ResponseEntity.ok(candidateService.uploadProfileImage(candidateId, file));
    }
}
