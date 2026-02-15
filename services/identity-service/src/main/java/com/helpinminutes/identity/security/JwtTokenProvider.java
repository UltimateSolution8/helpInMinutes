package com.helpinminutes.identity.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:super-long-jwt-secret-key-for-testing-32bytes}")
    private String jwtSecret;

    @Value("${jwt.expiration:3600000}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        // Generate a key from the secret string - use SHA-256 to create a 256-bit key
        log.info("Identity Service JWT Secret: {}", jwtSecret);
        log.info("Identity Service JWT Secret Length: {}", jwtSecret.length());
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        
        this.key = Keys.hmacShaKeyFor(keyBytes);
        log.info("Identity Service JWT Key: {}", this.key);
    }

    public String generateAccessToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return generateAccessToken(userPrincipal);
    }

    public String generateAccessToken(UserPrincipal userPrincipal) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userPrincipal.getId().toString());
        claims.put("email", userPrincipal.getEmail());
        claims.put("role", userPrincipal.getRole());
        claims.put("type", "ACCESS");

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(userPrincipal.getId().toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateAccessToken(UUID userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId.toString());
        claims.put("email", email);
        claims.put("role", role);
        claims.put("type", "ACCESS");

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId.toString());
        claims.put("type", "REFRESH");
        claims.put("tokenId", UUID.randomUUID().toString());

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
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
        } catch (ExpiredJwtException ex) {
            log.error("JWT token is expired: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("JWT token is unsupported: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("JWT token is malformed: {}", ex.getMessage());
        } catch (SignatureException ex) {
            log.warn("JWT signature validation failed: {}", ex.getMessage());
            log.warn("JWT Secret used: {}", jwtSecret);
            log.warn("JWT Secret Length: {}", jwtSecret.length());
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

    public boolean isRefreshToken(String token) {
        try {
            return "REFRESH".equals(getTokenType(token));
        } catch (Exception e) {
            return false;
        }
    }

    public long getExpirationTime() {
        return jwtExpirationMs;
    }

    public long getRefreshExpirationTime() {
        return refreshExpirationMs;
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
