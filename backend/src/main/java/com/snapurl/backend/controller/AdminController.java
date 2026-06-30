package com.snapurl.backend.controller;

import com.snapurl.backend.config.UserContext;
import com.snapurl.backend.model.ContactMessage;
import com.snapurl.backend.model.ShortLink;
import com.snapurl.backend.model.User;
import com.snapurl.backend.repository.ContactMessageRepository;
import com.snapurl.backend.repository.ShortLinkRepository;
import com.snapurl.backend.repository.UserRepository;
import com.snapurl.backend.service.ShortLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@Tag(name = "Global Administration Portal", description = "Endpoints for moderating links, viewing registered users, and reading messages")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShortLinkRepository shortLinkRepository;

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Autowired
    private ShortLinkService shortLinkService;

    @Value("${app.admin-emails}")
    private String adminEmails;

    private void verifyAdminAccess() {
        String currentUser = UserContext.getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to access admin console");
        }

        boolean isAdmin = false;
        String[] admins = adminEmails.split(",");
        for (String admin : admins) {
            if (admin.trim().equalsIgnoreCase(currentUser.trim())) {
                isAdmin = true;
                break;
            }
        }

        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Admin role required.");
        }
    }

    @GetMapping("/users")
    @Operation(summary = "Get all registered users", description = "Admin only. Returns all registered user profiles sorted by creation date.")
    public ResponseEntity<List<User>> getAllUsers() {
        verifyAdminAccess();
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/contacts")
    @Operation(summary = "Get all contact messages", description = "Admin only. Returns all submitted inquiries sorted by creation date.")
    public ResponseEntity<List<ContactMessage>> getAllContacts() {
        verifyAdminAccess();
        List<ContactMessage> messages = contactMessageRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/links")
    @Operation(summary = "Get all links globally", description = "Admin only. Returns all links created in the database across all users.")
    public ResponseEntity<Page<ShortLink>> getAllLinks(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        verifyAdminAccess();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ShortLink> links = shortLinkRepository.findAll(pageable);
        return ResponseEntity.ok(links);
    }

    @DeleteMapping("/links/{code}")
    @Operation(summary = "Globally deactivate a link", description = "Admin only. Sets is_active = false and evicts the corresponding Redis key.")
    public ResponseEntity<Void> globallyDeactivateLink(@PathVariable(name = "code") String code) {
        verifyAdminAccess();
        ShortLink link = shortLinkRepository.findByShortCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Short link code not found"));

        link.setActive(false);
        shortLinkRepository.save(link);
        
        // Evict from cache
        shortLinkService.evictCacheSafely("link:" + code);
        return ResponseEntity.ok().build();
    }
}
