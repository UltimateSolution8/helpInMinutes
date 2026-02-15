package com.helpinminutes.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a helper candidate with all ranking factors.
 * Used during the matching algorithm to score and rank helpers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateHelper {

    private String helperId;
    private String name;
    
    // Location data
    private double latitude;
    private double longitude;
    private long h3Cell;
    private double distanceKm;
    private double estimatedArrivalMinutes;
    
    // Ranking factors
    private double rating;           // 0.0 - 5.0
    private int totalReviews;
    private double responseTimeSeconds;  // Average response time
    private double skillMatchScore;      // 0.0 - 1.0
    private double completionRate;       // 0.0 - 1.0
    private int completedTasks;
    
    // Current status
    private boolean isOnline;
    private String currentStatus;    // AVAILABLE, BUSY, etc.
    private long lastSeenSecondsAgo;
    
    // Calculated score
    private double totalScore;
    private double proximityScore;
    private double ratingScore;
    private double responseTimeScore;
    private double skillScore;
    
    // Task-specific
    private java.util.List<String> matchingSkills;
    private java.util.List<String> missingSkills;
}
