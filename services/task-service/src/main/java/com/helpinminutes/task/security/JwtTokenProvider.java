package com.helpinminutes.task.security;

import io.jsonwebtoken.*;
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

    @Value("${jwt.secret:helpinminutes-jwt-secret-key-for-development-only-32bytes}")
    private String jwtSecret;

    @Value("${jwt.expiration:3600000}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        // Generate a key from the secret string - use SHA-256 to create a 256-bit key
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        
        // If the secret is too short, pad it; if too long, hash it
        if (keyBytes.length < 32) {
            // Pad to 32 bytes
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        } else if (keyBytes.length > 32) {
            // Hash to 32 bytes using SHA-256
            try {
                java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                keyBytes = digest.digest(keyBytes);
            } catch (Exception e) {
                throw new RuntimeException("Failed to hash JWT secret", e);
            }
        }
        
        this.key = Keys.hmacShaKeyFor(keyBytes);
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
            return true;
        } catch (ExpiredJwtException ex) {
            log.error("JWT token is expired: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("JWT token is unsupported: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("JWT token is malformed: {}", ex.getMessage());
        } catch (SignatureException ex) {
            log.error("JWT signature validation failed: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT token is empty or null: {}", ex.getMessage());
        }
        return false;
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
