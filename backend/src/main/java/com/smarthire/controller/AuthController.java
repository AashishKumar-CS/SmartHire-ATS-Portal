package com.smarthire.controller;

import com.smarthire.dao.AdminDAO;
import com.smarthire.model.Admin;
import com.smarthire.model.Candidate;
import com.smarthire.service.CandidateService;
import com.smarthire.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
// NOTE: @CrossOrigin removed — CORS handled globally in SecurityConfig.java
public class AuthController {

    @Autowired private CandidateService candidateService;
    @Autowired private AdminDAO adminDAO;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    // Tracks failed login attempts per IP address
    private final ConcurrentHashMap<String, Integer> failedAttempts   = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long>    lockoutUntil     = new ConcurrentHashMap<>();

    private static final int  MAX_ATTEMPTS        = 5;
    private static final long LOCKOUT_DURATION_MS = 15 * 60 * 1000L; // 15 minutes

    /** Extracts real client IP, works behind Render/Nginx reverse proxy */
    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim(); // first IP in chain = real client
        }
        return request.getRemoteAddr();
    }

    /** Returns true when this IP must be blocked */
    private boolean isRateLimited(String ip) {
        Long until = lockoutUntil.get(ip);
        if (until != null) {
            if (System.currentTimeMillis() < until) return true; // still locked
            // lockout expired — clear it
            lockoutUntil.remove(ip);
            failedAttempts.remove(ip);
        }
        return false;
    }

    /** Call on every failed login attempt */
    private void recordFailedAttempt(String ip) {
        int count = failedAttempts.merge(ip, 1, Integer::sum);
        if (count >= MAX_ATTEMPTS) {
            lockoutUntil.put(ip, System.currentTimeMillis() + LOCKOUT_DURATION_MS);
            failedAttempts.remove(ip);
            System.out.println("[SECURITY] IP " + ip + " locked for 15 min after " + MAX_ATTEMPTS + " failed attempts.");
        }
    }

    /** Call on successful login — resets the counter */
    private void clearAttempts(String ip) {
        failedAttempts.remove(ip);
        lockoutUntil.remove(ip);
    }

    /** Remaining lockout minutes for user-friendly error message */
    private long remainingMinutes(String ip) {
        Long until = lockoutUntil.get(ip);
        if (until == null) return 0;
        return Math.max(1, (until - System.currentTimeMillis()) / 60000);
    }

    // ── Candidate Login ───────────────────────────────────────────────────────

    @PostMapping("/candidate/login")
    public ResponseEntity<Map<String, Object>> candidateLogin(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String ip = getClientIp(request);

        if (isRateLimited(ip)) {
            return ResponseEntity.status(429).body(Map.of(
                "success", false,
                "message", "Too many failed attempts. Try again in " + remainingMinutes(ip) + " minute(s)."
            ));
        }

        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username and password are required"));
        }

        Optional<Candidate> opt = candidateService.login(username, password);

        if (opt.isEmpty()) {
            recordFailedAttempt(ip);
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
        }

        clearAttempts(ip);
        Candidate c = opt.get();
        String token = jwtUtil.generateToken(c.getUsername(), "CANDIDATE");

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("token", token);
        resp.put("role", "CANDIDATE");
        resp.put("candidateId", c.getId());
        resp.put("username", c.getUsername());
        resp.put("fullName", c.getFullName());
        return ResponseEntity.ok(resp);
    }

    // ── Admin Login ───────────────────────────────────────────────────────────

    @PostMapping("/admin/login")
    public ResponseEntity<Map<String, Object>> adminLogin(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String ip = getClientIp(request);

        if (isRateLimited(ip)) {
            return ResponseEntity.status(429).body(Map.of(
                "success", false,
                "message", "Too many failed attempts. Try again in " + remainingMinutes(ip) + " minute(s)."
            ));
        }

        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username and password are required"));
        }

        Optional<Admin> adminOpt = adminDAO.findByUsername(username);

        if (adminOpt.isEmpty()) {
            recordFailedAttempt(ip);
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
        }

        String storedPass = adminDAO.findPasswordByUsername(username);
        if (storedPass == null || !passwordEncoder.matches(password, storedPass)) {
            recordFailedAttempt(ip);
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
        }

        clearAttempts(ip);
        Admin admin = adminOpt.get();
        String token = jwtUtil.generateToken(admin.getUsername(), "ADMIN");

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("token", token);
        resp.put("role", "ADMIN");
        resp.put("adminId", admin.getId());
        resp.put("username", admin.getUsername());
        resp.put("fullName", admin.getFullName());
        return ResponseEntity.ok(resp);
    }

    // ── Token Validation ──────────────────────────────────────────────────────

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("valid", false));
        }
        String token = authHeader.substring(7);
        if (jwtUtil.validateToken(token)) {
            return ResponseEntity.ok(Map.of(
                "valid",    true,
                "username", jwtUtil.extractUsername(token),
                "role",     jwtUtil.extractRole(token)
            ));
        }
        return ResponseEntity.status(401).body(Map.of("valid", false));
    }
}
