package com.snapurl.backend.controller;

import com.snapurl.backend.config.JwtUtil;
import com.snapurl.backend.dto.AuthRequest;
import com.snapurl.backend.dto.AuthResponse;
import com.snapurl.backend.model.User;
import com.snapurl.backend.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@Tag(name = "Authentication Operations", description = "Endpoints for user registration and JWT login")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @org.springframework.beans.factory.annotation.Value("${app.admin-emails}")
    private String adminEmails;

    private boolean checkIsAdmin(String email) {
        if (adminEmails == null || email == null) return false;
        String[] admins = adminEmails.split(",");
        for (String admin : admins) {
            if (admin.trim().equalsIgnoreCase(email.trim())) {
                return true;
            }
        }
        return false;
    }

    @PostMapping("/register")
    @Operation(summary = "Register user", description = "Registers a new user and returns a JWT token")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email address already registered");
        }

        String hashedPw = BCrypt.hashpw(request.getPassword(), BCrypt.gensalt());
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(hashedPw)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        boolean isAdmin = checkIsAdmin(user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token, user.getEmail(), isAdmin));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user", description = "Verifies password and issues JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!BCrypt.checkpw(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        boolean isAdmin = checkIsAdmin(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), isAdmin));
    }
}
