package com.smarthire.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.*;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/external-jobs")
@CrossOrigin(origins = "*")
public class ExternalJobController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

   

    // ── Admin: Create a new external job ─────────────────────────────────────
    @PostMapping("/admin/create")
    public ResponseEntity<Map<String, Object>> createExternalJob(
            @RequestBody Map<String, Object> body) {
        try {
            String sql = "INSERT INTO third_party_jobs " +
                    "(title, company, description, required_skills, external_url, salary, location, source, experience, status, admin_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?)";

            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(conn -> {
                PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, (String) body.get("title"));
                ps.setString(2, (String) body.get("company"));
                ps.setString(3, (String) body.get("description"));
                ps.setString(4, (String) body.get("requiredSkills"));
                ps.setString(5, (String) body.get("externalUrl"));
                ps.setString(6, (String) body.get("salary"));
                ps.setString(7, (String) body.get("location"));
                ps.setString(8, (String) body.getOrDefault("source", "Admin"));
                ps.setString(9, (String) body.get("experience"));
                ps.setInt(10, body.containsKey("adminId") ? Integer.parseInt(body.get("adminId").toString()) : 1);
                return ps;
            }, keyHolder);

            int newId = keyHolder.getKey().intValue();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "External job created successfully",
                    "jobId", newId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Failed to create job: " + e.getMessage()));
        }
    }

    // ── Admin: Get ALL external jobs (open + closed) ──────────────────────────
    @GetMapping("/admin/all")
    public ResponseEntity<Map<String, Object>> getAllExternalJobsAdmin() {
        try {
            List<Map<String, Object>> jobs = jdbcTemplate.queryForList(
                    "SELECT * FROM third_party_jobs ORDER BY created_at DESC");
            return ResponseEntity.ok(Map.of("success", true, "data", jobs));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Admin: Update external job ────────────────────────────────────────────
    @PutMapping("/admin/update/{jobId}")
    public ResponseEntity<Map<String, Object>> updateExternalJob(
            @PathVariable int jobId,
            @RequestBody Map<String, Object> body) {
        try {
            String sql = "UPDATE third_party_jobs SET title=?, company=?, description=?, " +
                    "required_skills=?, external_url=?, salary=?, location=?, source=?, experience=? " +
                    "WHERE id=?";
            jdbcTemplate.update(sql,
                    body.get("title"), body.get("company"), body.get("description"),
                    body.get("requiredSkills"), body.get("externalUrl"), body.get("salary"),
                    body.get("location"), body.getOrDefault("source", "Admin"),
                    body.get("experience"), jobId);
            return ResponseEntity.ok(Map.of("success", true, "message", "External job updated"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Admin: Close an external job ──────────────────────────────────────────
    @PutMapping("/admin/close/{jobId}")
    public ResponseEntity<Map<String, Object>> closeExternalJob(@PathVariable int jobId) {
        try {
            jdbcTemplate.update("UPDATE third_party_jobs SET status='Closed' WHERE id=?", jobId);
            return ResponseEntity.ok(Map.of("success", true, "message", "External job closed"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Admin: Reopen a closed external job ───────────────────────────────────
    @PutMapping("/admin/reopen/{jobId}")
    public ResponseEntity<Map<String, Object>> reopenExternalJob(@PathVariable int jobId) {
        try {
            jdbcTemplate.update("UPDATE third_party_jobs SET status='Open' WHERE id=?", jobId);
            return ResponseEntity.ok(Map.of("success", true, "message", "External job reopened"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Admin: Delete external job ────────────────────────────────────────────
    @DeleteMapping("/admin/delete/{jobId}")
    public ResponseEntity<Map<String, Object>> deleteExternalJob(@PathVariable int jobId) {
        try {
            jdbcTemplate.update("DELETE FROM third_party_jobs WHERE id=?", jobId);
            return ResponseEntity.ok(Map.of("success", true, "message", "External job deleted"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Public: Get OPEN external jobs only (for candidates) ─────────────────
    @GetMapping("/open")
    public ResponseEntity<Map<String, Object>> getOpenExternalJobs() {
        try {
            List<Map<String, Object>> jobs = jdbcTemplate.queryForList(
                    "SELECT * FROM third_party_jobs WHERE status='Open' ORDER BY created_at DESC");
            return ResponseEntity.ok(Map.of("success", true, "data", jobs));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
