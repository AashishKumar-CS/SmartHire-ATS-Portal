package com.smarthire.controller;

import com.smarthire.model.Job;
import com.smarthire.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobController {

    @Autowired private JobService jobService;

    // ── Public: List open jobs (internal) ─────────────────────────────────────
    @GetMapping("/internal")
    public ResponseEntity<?> getOpenJobs() {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getOpenJobs()));
    }

    @GetMapping("/internal/all")
    public ResponseEntity<?> getAllJobs() {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getAllJobs()));
    }

    @GetMapping("/internal/{id}")
    public ResponseEntity<?> getJobById(@PathVariable int id) {
        return jobService.getJobById(id)
                .map(j -> ResponseEntity.ok(Map.of("success", true, "data", j)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Admin: Create / Update / Close ────────────────────────────────────────
    @PostMapping("/admin/create")
    public ResponseEntity<Map<String, Object>> createJob(@RequestBody Job job,
                                                          @RequestHeader(value = "Authorization", required = false) String auth) {
        Map<String, Object> result = jobService.createJob(job);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/admin/update/{jobId}")
    public ResponseEntity<Map<String, Object>> updateJob(@PathVariable int jobId, @RequestBody Job job) {
        job.setId(jobId);
        return ResponseEntity.ok(jobService.updateJob(job));
    }

    @PutMapping("/admin/close/{jobId}")
    public ResponseEntity<Map<String, Object>> closeJob(@PathVariable int jobId) {
        return ResponseEntity.ok(jobService.closeJob(jobId));
    }

    // ── External / third-party jobs ───────────────────────────────────────────
    @GetMapping("/external")
    public ResponseEntity<?> getThirdPartyJobs() {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getThirdPartyJobs()));
    }

    // ── Applications ─────────────────────────────────────────────────────────
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyJob(@RequestBody Map<String, Object> body) {
        int candidateId = Integer.parseInt(body.get("candidateId").toString());
        Object jobIdObj = body.get("jobId");
        Object extJobIdObj = body.get("thirdPartyJobId");
        String jobType = (String) body.getOrDefault("jobType", "internal");

        Integer jobId = jobIdObj != null ? Integer.parseInt(jobIdObj.toString()) : null;
        Integer extJobId = extJobIdObj != null ? Integer.parseInt(extJobIdObj.toString()) : null;

        return ResponseEntity.ok(jobService.applyJob(candidateId, jobId, extJobId, jobType));
    }

    @GetMapping("/applications/candidate/{candidateId}")
    public ResponseEntity<?> getCandidateApplications(@PathVariable int candidateId) {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getCandidateApplications(candidateId)));
    }

    @GetMapping("/applications/job/{jobId}")
    public ResponseEntity<?> getJobApplications(@PathVariable int jobId) {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getJobApplications(jobId)));
    }

    @GetMapping("/applications/all")
    public ResponseEntity<?> getAllApplications() {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getAllApplications()));
    }

    @PutMapping("/applications/{appId}/status")
    public ResponseEntity<Map<String, Object>> updateApplicationStatus(@PathVariable int appId,
                                                                         @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(jobService.updateApplicationStatus(appId, body.get("status"), body.get("feedback")));
    }

    // ── Admin: Ranking for a job ───────────────────────────────────────────────
    @GetMapping("/admin/ranking/{jobId}")
    public ResponseEntity<?> getRankedCandidates(@PathVariable int jobId) {
        return ResponseEntity.ok(Map.of("success", true, "data", jobService.getJobApplications(jobId)));
    }
}
