package com.snapurl.backend.repository;

import com.snapurl.backend.model.ClickEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {

    long countByShortLinkId(Long shortLinkId);

    @Query("SELECT DATE(c.timestamp) as clickDate, COUNT(c) as clickCount " +
           "FROM ClickEvent c " +
           "WHERE c.shortLinkId = :shortLinkId AND c.timestamp >= :since " +
           "GROUP BY DATE(c.timestamp) " +
           "ORDER BY clickDate ASC")
    List<Object[]> findClicksByDay(@Param("shortLinkId") Long shortLinkId, @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(c.referrer, 'Direct') as referrerSource, COUNT(c) as clickCount " +
           "FROM ClickEvent c " +
           "WHERE c.shortLinkId = :shortLinkId " +
           "GROUP BY COALESCE(c.referrer, 'Direct') " +
           "ORDER BY clickCount DESC")
    List<Object[]> findReferrerStats(@Param("shortLinkId") Long shortLinkId);

    @Query("SELECT c.userAgent as userAgentDetails, COUNT(c) as clickCount " +
           "FROM ClickEvent c " +
           "WHERE c.shortLinkId = :shortLinkId " +
           "GROUP BY c.userAgent " +
           "ORDER BY clickCount DESC")
    List<Object[]> findUserAgentStats(@Param("shortLinkId") Long shortLinkId);
}
