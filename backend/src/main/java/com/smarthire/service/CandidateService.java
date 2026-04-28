package com.smarthire.service;

import com.smarthire.dao.*;
import com.smarthire.model.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.Loader;

import java.io.File;
import java.nio.file.*;
import java.util.*;

@Service
public class CandidateService {

    @Autowired private CandidateDAO candidateDAO;
    @Autowired private OtpDAO otpDAO;
    @Autowired private AIService aiService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;

    @Value("${file.upload.dir}")
    private String uploadDir;

    // ================= OTP =================

    public Map<String, Object> sendOtp(String mobile) {
        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        otpDAO.saveOtp(mobile, otp);

        System.out.println("📱 OTP: " + otp);

        //for otp in response
        //return Map.of("success", true, "message", "OTP sent");
        
        //for no otp in response
        return Map.of("success", true, "message", "OTP sent. Check server console.");
    }

    public boolean verifyOtp(String mobile, String otp) {
        return otpDAO.verifyOtp(mobile, otp);
    }

    // ================= REGISTER =================

    public Map<String, Object> register(Candidate candidate, List<EducationDetail> educationList, List<String> skills) {

        if (candidateDAO.existsByEmail(candidate.getEmail()))
            return Map.of("success", false, "message", "Email already exists");

        if (candidateDAO.existsByMobile(candidate.getMobile()))
            return Map.of("success", false, "message", "Mobile already exists");

        String username = candidate.getFullName().toLowerCase().replaceAll("\\s+", "") + new Random().nextInt(9999);
        String rawPassword = "SH@" + new Random().nextInt(99999);

        candidate.setUsername(username);
        candidate.setPassword(passwordEncoder.encode(rawPassword));

        int id = candidateDAO.save(candidate);

        if (educationList != null) {
            for (EducationDetail e : educationList) {
                e.setCandidateId(id);
                candidateDAO.saveEducation(e);
            }
        }

        if (skills != null && !skills.isEmpty()) {
            candidateDAO.saveSkills(id, skills);
        }

        try {
            emailService.sendCredentials(candidate.getEmail(), candidate.getFullName(), username, rawPassword);
        } catch (Exception ignored) {}

        return Map.of(
                "success", true,
                "candidateId", id,
                "username", username,
                "password", rawPassword
        );
    }

    // ================= PROFILE =================

    public Map<String, Object> getProfile(int id) {
        Optional<Candidate> opt = candidateDAO.findById(id);
        if (opt.isEmpty()) return Map.of("success", false);

        Candidate c = opt.get();
        c.setSkills(candidateDAO.findSkillsByCandidateId(id));
        c.setEducationDetails(candidateDAO.findEducationByCandidateId(id));
        c.setPassword(null);

        return Map.of("success", true, "data", c);
    }

    // ================= RESUME + AI =================

    public Map<String, Object> uploadResume(int candidateId, MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir, "resumes");
            Files.createDirectories(dir);

            String filename = "resume_" + candidateId + "_" + System.currentTimeMillis() + ".pdf";
            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            candidateDAO.updateResumePath(candidateId, dest.toString());

            // 🔥 Extract text
            String text = extractPdfText(dest.toFile());

            // 🔥 Get candidate skills
            List<String> skillsList = candidateDAO.findSkillsByCandidateId(candidateId);
            String skillsStr = String.join(", ", skillsList);

            // 🔥 NEW AI CALL (Gemini)
            AIService.CombinedResult result = aiService.analyzeCandidate(
                    text,
                    skillsStr,
                    "",   // no job context here
                    ""
            );

            // Save ATS score
            candidateDAO.updateAtsScore(candidateId, result.getAtsScore());

            // Save extracted skills if empty
            if (skillsList.isEmpty() && result.getSkills() != null) {
                candidateDAO.saveSkills(candidateId, result.getSkills());
            }

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Resume uploaded and analysed");
            resp.put("atsScore", result.getAtsScore());
            resp.put("skills", result.getSkills());
            resp.put("strengths", result.getStrengths());
            resp.put("weaknesses", result.getWeaknesses());
            resp.put("recommendation", result.getRecommendation());

            return resp;

        } catch (Exception e) {
            return Map.of("success", false, "message", "Upload failed: " + e.getMessage());
        }
    }

    // ================= LOGIN =================

    public Optional<Candidate> login(String username, String password) {
        Optional<Candidate> opt = candidateDAO.findByUsername(username);
        if (opt.isEmpty()) return Optional.empty();

        String stored = candidateDAO.findPasswordByUsername(username);

        if (stored != null && passwordEncoder.matches(password, stored))
            return opt;

        return Optional.empty();
    }

    public List<Candidate> getAllCandidates() {
        return candidateDAO.findAll();
    }
    
    private String extractPdfText(File pdfFile) {
        try (PDDocument doc = Loader.loadPDF(pdfFile)) {
            return new PDFTextStripper().getText(doc);
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }
    
    public Map<String, Object> updateProfile(Candidate candidate, List<String> skills) {
        candidateDAO.updateProfile(candidate);

        if (skills != null && !skills.isEmpty()) {
            candidateDAO.saveSkills(candidate.getId(), skills);
        }

        return Map.of(
            "success", true,
            "message", "Profile updated successfully"
        );
    }
    
    public Map<String, Object> uploadProfileImage(int candidateId, MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir, "profiles");
            Files.createDirectories(dir);

            String original = file.getOriginalFilename();
            String ext = (original != null && original.contains("."))
                    ? original.substring(original.lastIndexOf("."))
                    : ".jpg";

            String filename = "profile_" + candidateId + "_" + System.currentTimeMillis() + ext;

            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            candidateDAO.updateProfileImage(candidateId, dest.toString());

            return Map.of(
                "success", true,
                "message", "Profile image uploaded",
                "path", filename
            );

        } catch (Exception e) {
            return Map.of(
                "success", false,
                "message", "Upload failed: " + e.getMessage()
            );
        }
    }
    
}
