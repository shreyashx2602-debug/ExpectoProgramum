package com.credexplain.controller;

import com.credexplain.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }
        Map<String, Object> auth = authService.authenticate(email, password);
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String password = payload.get("password");
            String fullName = payload.get("fullName");
            String role = payload.getOrDefault("role", "APPLICANT");
            String avatarUrl = payload.get("avatarUrl");
            Map<String, Object> res = authService.register(email, password, fullName, role, avatarUrl);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String fullName = payload.get("fullName");
            String avatarUrl = payload.get("avatarUrl");
            String googleId = payload.get("googleId");
            String role = payload.getOrDefault("role", "APPLICANT");
            Map<String, Object> res = authService.googleAuth(email, fullName, avatarUrl, googleId, role);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestParam(required = false) String email) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email parameter required"));
        }
        Map<String, Object> profile = authService.getUserProfile(email);
        if (profile == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found in database"));
        }
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/demo-accounts")
    public ResponseEntity<List<Map<String, String>>> getDemoAccounts() {
        return ResponseEntity.ok(authService.getDemoAccounts());
    }

    @PostMapping("/clear-users")
    public ResponseEntity<?> clearUsers() {
        authService.clearAllUsers();
        return ResponseEntity.ok(Map.of("message", "All users deleted from database"));
    }
}
