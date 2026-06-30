package com.snapurl.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

  private static final String SECRET_KEY_STRING = "snapurl_super_secret_jwt_key_1234567890_abcdef_secret";
  private final Key key = Keys.hmacShaKeyFor(SECRET_KEY_STRING.getBytes(StandardCharsets.UTF_8));
  private final long EXPIRATION_TIME = 86400000; // 24 hours in milliseconds

  public String generateToken(String email) {
    return Jwts.builder()
        .setSubject(email)
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public String extractEmail(String token) {
    return getClaims(token).getSubject();
  }

  public boolean validateToken(String token) {
    try {
      return !getClaims(token).getExpiration().before(new Date());
    } catch (Exception e) {
      return false;
    }
  }

  private Claims getClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}
