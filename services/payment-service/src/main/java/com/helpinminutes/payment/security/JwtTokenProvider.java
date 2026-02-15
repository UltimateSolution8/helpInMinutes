package com.helpinminutes.payment.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:super-long-jwt-secret-key-for-testing-32bytes}")
    private String jwtSecret;

    @Value("${jwt.expiration:3600000}")
    private long jwtExpirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        // Generate a key from the secret string - use SHA-256 to create a 256-bit key
        log.info("Payment Service JWT Secret: {}", jwtSecret);
        log.info("Payment Service JWT Secret Length: {}", jwtSecret.length());
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        
        this.key = Keys.hmacShaKeyFor(keyBytes);
        log.info("Payment Service JWT Key: {}", this.key);
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return UUID.fromString(claims.getSubject());
    }

    public String getEmailFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("email", String.class);
    }

    public String getRoleFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("role", String.class);
    }

    public String getTokenType(String token) {
        Claims claims = parseToken(token);
        return claims.get("type", String.class);
    }

    public Date getExpirationDateFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getExpiration();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            log.debug("Token validation successful");
            return true;
        } catch (Exception e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            log.warn("JWT Secret used: {}", jwtSecret);
            log.warn("JWT Secret Length: {}", jwtSecret.length());
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        try {
            return "ACCESS".equals(getTokenType(token));
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}