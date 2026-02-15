package com.helpinminutes.identity.repository;

import com.helpinminutes.identity.entity.HelperProfile;
import com.helpinminutes.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public interface HelperProfileRepository extends JpaRepository<HelperProfile, UUID> {

    Optional<HelperProfile> findByUserId(UUID userId);

    @Query("SELECT hp FROM HelperProfile hp JOIN FETCH hp.user WHERE hp.user.id = :userId")
    Optional<HelperProfile> findByUserIdWithUser(@Param("userId") UUID userId);

    List<HelperProfile> findByIsOnlineTrue();

    Page<HelperProfile> findByIsOnlineTrue(Pageable pageable);

    List<HelperProfile> findByKycStatus(User.KycStatus kycStatus);

    @Query("SELECT hp FROM HelperProfile hp WHERE hp.currentH3 = :h3Index AND hp.isOnline = true")
    List<HelperProfile> findOnlineByH3Index(@Param("h3Index") String h3Index);

    @Query(value = "SELECT hp.* FROM helper_profiles hp " +
           "WHERE hp.current_h3 IN (:h3Indexes) AND hp.is_online = true", nativeQuery = true)
    List<HelperProfile> findOnlineByH3Indexes(@Param("h3Indexes") List<String> h3Indexes);

    @Query("SELECT hp FROM HelperProfile hp WHERE hp.isOnline = true " +
           "AND hp.currentLat BETWEEN :minLat AND :maxLat " +
           "AND hp.currentLng BETWEEN :minLng AND :maxLng")
    List<HelperProfile> findOnlineWithinBounds(@Param("minLat") Double minLat,
                                               @Param("maxLat") Double maxLat,
                                               @Param("minLng") Double minLng,
                                               @Param("maxLng") Double maxLng);

    @Modifying
    @Query("UPDATE HelperProfile hp SET hp.isOnline = false, hp.lastSeenAt = :lastSeenAt " +
           "WHERE hp.lastSeenAt < :cutoffTime AND hp.isOnline = true")
    int markOfflineInactiveHelpers(@Param("cutoffTime") LocalDateTime cutoffTime,
                                   @Param("lastSeenAt") LocalDateTime lastSeenAt);

    @Modifying
    @Query("UPDATE HelperProfile hp SET hp.currentH3 = :h3Index, hp.currentLat = :lat, " +
           "hp.currentLng = :lng, hp.lastSeenAt = :lastSeenAt WHERE hp.id = :id")
    int updateLocation(@Param("id") UUID id,
                       @Param("h3Index") String h3Index,
                       @Param("lat") Double lat,
                       @Param("lng") Double lng,
                       @Param("lastSeenAt") LocalDateTime lastSeenAt);

    @Query("SELECT hp FROM HelperProfile hp JOIN hp.skills s WHERE s IN (:skills) AND hp.isOnline = true")
    List<HelperProfile> findOnlineBySkills(@Param("skills") List<String> skills);

    @Query("SELECT COUNT(hp) FROM HelperProfile hp WHERE hp.isOnline = true")
    Long countOnlineHelpers();

    @Query("SELECT COUNT(hp) FROM HelperProfile hp WHERE hp.kycStatus = :kycStatus")
    Long countByKycStatus(@Param("kycStatus") User.KycStatus kycStatus);
}
