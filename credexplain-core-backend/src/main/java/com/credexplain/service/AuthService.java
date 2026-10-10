package com.credexplain.service;

import com.credexplain.model.User;
import com.credexplain.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        initDefaultUsers();
    }

    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(password.hashCode());
        }
    }

    public void initDefaultUsers() {
        // No pre-seeded demo users. Clean database for personal borrower records and authorized users.
    }

    public void clearAllUsers() {
        userRepository.deleteAll();
    }

    private Map<String, Object> toUserResponse(User user) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("email", user.getEmail());
        resp.put("fullName", user.getFullName());
        resp.put("role", user.getRole());
        resp.put("authProvider", user.getAuthProvider());
        resp.put("avatarUrl", user.getAvatarUrl());
        resp.put("accountStatus", user.getAccountStatus());
        resp.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        resp.put("lastLoginAt", user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);
        resp.put("token", "CREDEXPLAIN-JWT-" + UUID.randomUUID());
        return resp;
    }

    public Map<String, Object> authenticate(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPasswordHash().equals(hashPassword(password))) {
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                return toUserResponse(user);
            }
        }
        return null;
    }

    public Map<String, Object> register(String email, String password, String fullName, String role, String avatarUrl) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("User with email '" + email + "' is already registered in the database");
        }
        String chosenRole = (role != null && !role.trim().isEmpty()) ? role.toUpperCase() : "APPLICANT";
        User newUser = new User(email, hashPassword(password), fullName, chosenRole, "LOCAL", avatarUrl);
        userRepository.save(newUser);
        return toUserResponse(newUser);
    }

    public Map<String, Object> register(String email, String password, String fullName, String role) {
        return register(email, password, fullName, role, null);
    }

    public Map<String, Object> googleAuth(String email, String fullName, String avatarUrl, String googleId, String role) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required for Google authentication");
        }
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            user.setLastLoginAt(java.time.LocalDateTime.now());
            if (avatarUrl != null && !avatarUrl.isEmpty()) {
                user.setAvatarUrl(avatarUrl);
            }
            if (fullName != null && !fullName.isEmpty() && (user.getFullName() == null || user.getFullName().isEmpty())) {
                user.setFullName(fullName);
            }
            if (googleId != null && user.getGoogleId() == null) {
                user.setGoogleId(googleId);
            }
            userRepository.save(user);
        } else {
            String chosenRole = (role != null && !role.trim().isEmpty()) ? role.toUpperCase() : "APPLICANT";
            String randomPassword = UUID.randomUUID().toString();
            user = new User(email, hashPassword(randomPassword), fullName != null ? fullName : "Google User", chosenRole, "GOOGLE", avatarUrl);
            user.setGoogleId(googleId != null ? googleId : UUID.randomUUID().toString());
            userRepository.save(user);
        }
        return toUserResponse(user);
    }

    public Map<String, Object> getUserProfile(String email) {
        return userRepository.findByEmail(email)
                .map(this::toUserResponse)
                .orElse(null);
    }

    public List<Map<String, Object>> getAllUsers() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            list.add(toUserResponse(u));
        }
        return list;
    }

    public List<Map<String, String>> getDemoAccounts() {
        return Collections.emptyList();
    }
}
