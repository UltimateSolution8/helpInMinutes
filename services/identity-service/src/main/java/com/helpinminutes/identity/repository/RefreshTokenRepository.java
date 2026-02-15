package com.helpinminutes.identity.repository;

import com.helpinminutes.identity.entity.RefreshToken;
import com.helpinminutes.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUser(User user);

    List<RefreshToken> findByUserId(UUID userId);

    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user.id = :userId AND rt.isRevoked = false " +
           "AND rt.expiresAt > :now")
    List<RefreshToken> findValidByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token AND rt.isRevoked = false " +
           "AND rt.expiresAt > :now")
    Optional<RefreshToken> findValidToken(@Param("token") String token, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true, rt.revokedAt = :revokedAt " +
           "WHERE rt.user.id = :userId AND rt.isRevoked = false")
    int revokeAllUserTokens(@Param("userId") UUID userId, @Param("revokedAt") LocalDateTime revokedAt);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true, rt.revokedAt = :revokedAt " +
           "WHERE rt.token = :token")
    int revokeToken(@Param("token") String token, @Param("revokedAt") LocalDateTime revokedAt);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :cutoffTime OR " +
           "(rt.isRevoked = true AND rt.revokedAt < :cutoffTime)")
    int deleteExpiredTokens(@Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user.id = :userId AND rt.isRevoked = false " +
           "AND rt.expiresAt > :now")
    Long countValidTokensByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    List<RefreshToken> findByDeviceId(String deviceId);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true, rt.revokedAt = :revokedAt " +
           "WHERE rt.deviceId = :deviceId AND rt.isRevoked = false")
    int revokeAllTokensByDevice(@Param("deviceId") String deviceId, @Param("revokedAt") LocalDateTime revokedAt);
}
