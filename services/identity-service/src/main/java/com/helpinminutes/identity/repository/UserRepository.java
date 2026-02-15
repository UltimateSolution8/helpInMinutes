package com.helpinminutes.identity.repository;

import com.helpinminutes.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    List<User> findByRole(User.UserRole role);

    Page<User> findByRole(User.UserRole role, Pageable pageable);

    List<User> findByKycStatus(User.KycStatus kycStatus);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.kycStatus = :kycStatus")
    List<User> findByRoleAndKycStatus(@Param("role") User.UserRole role, @Param("kycStatus") User.KycStatus kycStatus);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.helperProfile WHERE u.id = :id")
    Optional<User> findByIdWithHelperProfile(@Param("id") UUID id);

    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.role = :role")
    List<User> findActiveByRole(@Param("role") User.UserRole role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.kycStatus = :kycStatus")
    Long countByRoleAndKycStatus(@Param("role") User.UserRole role, @Param("kycStatus") User.KycStatus kycStatus);
}
