package com.helpinminutes.identity.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "helper_profiles", indexes = {
    @Index(name = "idx_helper_user_id", columnList = "user_id"),
    @Index(name = "idx_helper_kyc_status", columnList = "kyc_status"),
    @Index(name = "idx_helper_online_status", columnList = "is_online"),
    @Index(name = "idx_helper_current_h3", columnList = "current_h3"),
    @Index(name = "idx_helper_last_seen", columnList = "last_seen_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HelperProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ElementCollection
    @CollectionTable(name = "helper_skills", joinColumns = @JoinColumn(name = "helper_profile_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false, length = 20)
    @Builder.Default
    private User.KycStatus kycStatus = User.KycStatus.PENDING;

    @Column(name = "is_online", nullable = false)
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "current_h3", length = 15)
    private String currentH3;

    @Column(name = "current_lat")
    private Double currentLat;

    @Column(name = "current_lng")
    private Double currentLng;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bank_account", columnDefinition = "jsonb")
    private BankAccount bankAccount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "documents", columnDefinition = "jsonb")
    @Builder.Default
    private List<Document> documents = new ArrayList<>();

    @Column(name = "rating", precision = 2, scale = 1)
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "total_reviews", nullable = false)
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "total_tasks_completed", nullable = false)
    @Builder.Default
    private Integer totalTasksCompleted = 0;

    @Column(name = "bio", length = 1000)
    private String bio;

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BankAccount {
        private String accountNumber;
        private String ifscCode;
        private String accountHolderName;
        private String bankName;
        private String branchName;
        private Boolean isVerified;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Document {
        private String type;
        private String url;
        private String fileName;
        private LocalDateTime uploadedAt;
        private Boolean isVerified;
    }
}
