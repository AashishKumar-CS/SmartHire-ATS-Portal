package com.smarthire.controller;

import com.smarthire.service.AdminService;
import com.smarthire.service.CandidateService;
import com.smarthire.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private CandidateService candidateService;
    @Autowired private JobService jobService;
    @Autowired private AdminService adminService;


    @GetMapping("/candidates")
    public ResponseEntity<?> getAllCandidates() {
        return ResponseEntity.ok(Map.of("success", true, "data", candidateService.getAllCandidates()));
    }

    @GetMapping("/candidates/{candidateId}")
    public ResponseEntity<?> getCandidate(@PathVariable int candidateId) {
        return ResponseEntity.ok(candidateService.getProfile(candidateId));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats() {
        return ResponseEntity.ok(jobService.getDashboardStats());
    }

    @GetMapping("/jobs")
    public ResponseEntity<?> getAllJobs() {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getAllJobs()));
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getAllApplications() {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getAllApplications()));
    }

    @PutMapping("/applications/{appId}/select")
    public ResponseEntity<?> selectCandidate(@PathVariable int appId,
                                              @RequestBody(required = false) Map<String, String> body) {
        String feedback = body != null ? body.getOrDefault("feedback", "") : "";
        return ResponseEntity.ok(jobService.updateApplicationStatus(appId, "Selected", feedback));
    }

    @PutMapping("/applications/{appId}/reject")
    public ResponseEntity<?> rejectCandidate(@PathVariable int appId,
                                              @RequestBody(required = false) Map<String, String> body) {
        String feedback = body != null ? body.getOrDefault("feedback", "Thank you for applying. We have decided to move forward with other candidates.") : "";
        return ResponseEntity.ok(jobService.updateApplicationStatus(appId, "Rejected", feedback));
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        boolean isValid = adminService.login(username, password);

        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Login successful"
            ));
        } else {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Invalid credentials"
            ));
        }
    }
}
