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

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private CandidateService candidateService;
    @Autowired private AdminDAO adminDAO;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/candidate/login")
    public ResponseEntity<Map<String, Object>> candidateLogin(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        Optional<Candidate> opt = candidateService.login(username, password);
        if (opt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
        }
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

    @PostMapping("/admin/login")
    public ResponseEntity<Map<String, Object>> adminLogin(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        Optional<Admin> adminOpt = adminDAO.findByUsername(username);
        if (adminOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
        }
        String storedPass = adminDAO.findPasswordByUsername(username);
        if (storedPass == null || !passwordEncoder.matches(password, storedPass)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
        }
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

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("valid", false));
        }
        String token = authHeader.substring(7);
        if (jwtUtil.validateToken(token)) {
            return ResponseEntity.ok(Map.of("valid", true,
                "username", jwtUtil.extractUsername(token),
                "role", jwtUtil.extractRole(token)));
        }
        return ResponseEntity.status(401).body(Map.of("valid", false));
    }
}
