package com.helpinminutes.identity.service;

import com.helpinminutes.identity.entity.RefreshToken;
import com.helpinminutes.identity.entity.User;
import com.helpinminutes.identity.repository.RefreshTokenRepository;
import com.helpinminutes.identity.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public RefreshToken createRefreshToken(User user, String ipAddress, String userAgent, String deviceId) {
        // Revoke existing tokens for this device
        if (deviceId != null) {
            revokeAllTokensByDevice(deviceId);
        }

        String token = tokenProvider.generateRefreshToken(user.getId());
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(tokenProvider.getRefreshExpirationTime() / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .deviceId(deviceId)
                .isRevoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional(readOnly = true)
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional(readOnly = true)
    public Optional<RefreshToken> findValidToken(String token) {
        return refreshTokenRepository.findValidToken(token, LocalDateTime.now());
    }

    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isExpired()) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token has expired. Please login again.");
        }
        return token;
    }

    @Transactional
    public void revokeToken(String token) {
        refreshTokenRepository.revokeToken(token, LocalDateTime.now());
        log.info("Revoked refresh token: {}", token.substring(0, Math.min(20, token.length())) + "...");
    }

    @Transactional
    public void revokeAllUserTokens(UUID userId) {
        refreshTokenRepository.revokeAllUserTokens(userId, LocalDateTime.now());
        log.info("Revoked all refresh tokens for user: {}", userId);
    }

    @Transactional
    public void revokeAllTokensByDevice(String deviceId) {
        refreshTokenRepository.revokeAllTokensByDevice(deviceId, LocalDateTime.now());
        log.info("Revoked all refresh tokens for device: {}", deviceId);
    }

    @Transactional
    public int deleteExpiredTokens() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(7);
        int deleted = refreshTokenRepository.deleteExpiredTokens(cutoffTime);
        log.info("Deleted {} expired refresh tokens", deleted);
        return deleted;
    }

    @Transactional(readOnly = true)
    public long countValidTokensByUserId(UUID userId) {
        Long count = refreshTokenRepository.countValidTokensByUserId(userId, LocalDateTime.now());
        return count != null ? count : 0;
    }
}
