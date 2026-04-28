package com.smarthire.controller;

import com.smarthire.model.Candidate;
import com.smarthire.model.EducationDetail;
import com.smarthire.service.CandidateService;
import com.smarthire.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidate")
@CrossOrigin(origins = "*")
public class CandidateController {

    @Autowired private CandidateService candidateService;
    @Autowired private JwtUtil jwtUtil;

    // ── OTP ────────────────────────────────────────────────────────────────────
    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(candidateService.sendOtp(body.get("mobile")));
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
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable int candidateId,
                                                           @RequestHeader(value = "Authorization", required = false) String auth) {
        return ResponseEntity.ok(candidateService.getProfile(candidateId));
    }

    @PutMapping("/profile/{candidateId}")
    public ResponseEntity<Map<String, Object>> updateProfile(@PathVariable int candidateId,
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
    public ResponseEntity<Map<String, Object>> uploadResume(@PathVariable int candidateId,
                                                             @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No file provided"));
        if (!file.getContentType().equals("application/pdf"))
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only PDF files allowed"));
        return ResponseEntity.ok(candidateService.uploadResume(candidateId, file));
    }

    @PostMapping("/upload-profile-image/{candidateId}")
    public ResponseEntity<Map<String, Object>> uploadProfileImage(@PathVariable int candidateId,
                                                                   @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(candidateService.uploadProfileImage(candidateId, file));
    }
}
