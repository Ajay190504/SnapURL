package com.snapurl.backend.controller;

import com.snapurl.backend.dto.ContactRequest;
import com.snapurl.backend.model.ContactMessage;
import com.snapurl.backend.repository.ContactMessageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "*")
@Tag(name = "Contact Inquiries", description = "Endpoints for user inquiries and contact form submissions")
public class ContactController {

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @PostMapping
    @Operation(summary = "Submit inquiry message", description = "Saves contact inquiry details into the database")
    public ResponseEntity<Void> submitInquiry(@Valid @RequestBody ContactRequest request) {
        ContactMessage msg = ContactMessage.builder()
                .name(request.getName())
                .email(request.getEmail())
                .subject(request.getSubject())
                .message(request.getMessage())
                .createdAt(LocalDateTime.now())
                .build();
        
        contactMessageRepository.save(msg);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
