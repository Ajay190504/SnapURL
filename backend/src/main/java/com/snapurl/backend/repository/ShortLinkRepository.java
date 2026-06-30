package com.snapurl.backend.repository;

import com.snapurl.backend.model.ShortLink;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShortLinkRepository extends JpaRepository<ShortLink, Long> {
    Optional<ShortLink> findByShortCode(String shortCode);
    Optional<ShortLink> findByShortCodeAndIsActiveTrue(String shortCode);
    Page<ShortLink> findByCreatedByAndIsActiveTrue(String createdBy, Pageable pageable);
    boolean existsByShortCode(String shortCode);
}
