package com.helpinminutes.matching.algorithm;

import com.helpinminutes.matching.dto.CandidateHelper;
import com.helpinminutes.matching.dto.MatchRequest;
import com.helpinminutes.matching.service.HelperLocationIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * Multi-factor ranking algorithm for helper candidates.
 * Ranks helpers based on: proximity, rating, response time, and skill match.
 * 
 * Weights are configurable via application properties.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HelperRanker {

    private final HelperLocationIndexService locationIndexService;
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);

    // Weight configuration (should sum to 1.0)
    @Value("${matching.weights.proximity:0.35}")
    private double proximityWeight;
    
    @Value("${matching.weights.rating:0.25}")
    private double ratingWeight;
    
    @Value("${matching.weights.responseTime:0.20}")
    private double responseTimeWeight;
    
    @Value("${matching.weights.skillMatch:0.20}")
    private double skillMatchWeight;
    
    // Scoring parameters
    @Value("${matching.scoring.maxDistanceKm:10.0}")
    private double maxDistanceKm;
    
    @Value("${matching.scoring.maxResponseTimeSeconds:300.0}")
    private double maxResponseTimeSeconds;
    
    @Value("${matching.scoring.minRatingThreshold:3.0}")
    private double minRatingThreshold;

    /**
     * Rank candidates using multi-factor scoring.
     * Uses concurrent scoring for performance.
     * 
     * @param candidates List of candidate helpers
     * @param request Match request with task details
     * @return Sorted list of candidates by total score (highest first)
     */
    public List<CandidateHelper> rankCandidates(List<CandidateHelper> candidates, MatchRequest request) {
        long startTime = System.currentTimeMillis();
        
        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Score candidates concurrently
        List<Future<CandidateHelper>> futures = candidates.stream()
                .map(candidate -> executorService.submit(() -> scoreCandidate(candidate, request)))
                .toList();
        
        // Collect scored candidates
        List<CandidateHelper> scoredCandidates = new ArrayList<>();
        for (Future<CandidateHelper> future : futures) {
            try {
                CandidateHelper scored = future.get(100, TimeUnit.MILLISECONDS);
                if (scored.getTotalScore() > 0) {
                    scoredCandidates.add(scored);
                }
            } catch (Exception e) {
                log.warn("Failed to score candidate: {}", e.getMessage());
            }
        }
        
        // Sort by total score (descending)
        scoredCandidates.sort((a, b) -> Double.compare(b.getTotalScore(), a.getTotalScore()));
        
        long duration = System.currentTimeMillis() - startTime;
        log.debug("Ranked {} candidates in {}ms", scoredCandidates.size(), duration);
        
        return scoredCandidates;
    }
    
    /**
     * Rank candidates synchronously (for small batches).
     * 
     * @param candidates List of candidates
     * @param request Match request
     * @return Sorted list of candidates
     */
    public List<CandidateHelper> rankCandidatesSync(List<CandidateHelper> candidates, MatchRequest request) {
        long startTime = System.currentTimeMillis();
        
        List<CandidateHelper> scoredCandidates = candidates.stream()
                .map(candidate -> scoreCandidate(candidate, request))
                .filter(c -> c.getTotalScore() > 0)
                .sorted((a, b) -> Double.compare(b.getTotalScore(), a.getTotalScore()))
                .collect(Collectors.toList());
        
        long duration = System.currentTimeMillis() - startTime;
        log.debug("Ranked {} candidates synchronously in {}ms", scoredCandidates.size(), duration);
        
        return scoredCandidates;
    }
    
    /**
     * Calculate multi-factor score for a single candidate.
     * 
     * @param candidate Helper candidate
     * @param request Match request
     * @return Scored candidate
     */
    private CandidateHelper scoreCandidate(CandidateHelper candidate, MatchRequest request) {
        // Fetch additional data from cache
        enrichCandidateData(candidate);
        
        // Calculate individual scores (0.0 - 1.0)
        double proximityScore = calculateProximityScore(candidate);
        double ratingScore = calculateRatingScore(candidate);
        double responseTimeScore = calculateResponseTimeScore(candidate);
        double skillScore = calculateSkillMatchScore(candidate, request);
        
        // Calculate weighted total score
        double totalScore = 
                (proximityScore * proximityWeight) +
                (ratingScore * ratingWeight) +
                (responseTimeScore * responseTimeWeight) +
                (skillScore * skillMatchWeight);
        
        // Apply penalty for low ratings
        if (candidate.getRating() < minRatingThreshold && candidate.getTotalReviews() > 5) {
            totalScore *= 0.5;
        }
        
        candidate.setProximityScore(proximityScore);
        candidate.setRatingScore(ratingScore);
        candidate.setResponseTimeScore(responseTimeScore);
        candidate.setSkillScore(skillScore);
        candidate.setTotalScore(totalScore);
        
        return candidate;
    }
    
    /**
     * Enrich candidate with cached profile data.
     */
    private void enrichCandidateData(CandidateHelper candidate) {
        Map<String, String> profile = locationIndexService.getCachedProfile(candidate.getHelperId());
        
        if (profile != null) {
            // Parse rating
            String ratingStr = profile.get("rating");
            if (ratingStr != null) {
                candidate.setRating(Double.parseDouble(ratingStr));
            }
            
            // Parse total reviews
            String reviewsStr = profile.get("total_reviews");
            if (reviewsStr != null) {
                candidate.setTotalReviews(Integer.parseInt(reviewsStr));
            }
            
            // Parse response time
            String responseTimeStr = profile.get("avg_response_time_seconds");
            if (responseTimeStr != null) {
                candidate.setResponseTimeSeconds(Double.parseDouble(responseTimeStr));
            }
            
            // Parse completion rate
            String completionRateStr = profile.get("completion_rate");
            if (completionRateStr != null) {
                candidate.setCompletionRate(Double.parseDouble(completionRateStr));
            }
            
            // Parse completed tasks
            String completedTasksStr = profile.get("completed_tasks");
            if (completedTasksStr != null) {
                candidate.setCompletedTasks(Integer.parseInt(completedTasksStr));
            }
            
            candidate.setName(profile.get("name"));
        } else {
            // Set defaults if no cached profile
            candidate.setRating(4.0);  // Neutral default
            candidate.setTotalReviews(0);
            candidate.setResponseTimeSeconds(60.0);  // 1 minute default
            candidate.setCompletionRate(0.8);
            candidate.setCompletedTasks(0);
        }
        
        // Get rating from separate cache if not in profile
        if (candidate.getRating() == 0.0) {
            double[] cachedRating = locationIndexService.getCachedRating(candidate.getHelperId());
            if (cachedRating != null) {
                candidate.setRating(cachedRating[0]);
                candidate.setTotalReviews((int) cachedRating[1]);
            }
        }
    }
    
    /**
     * Calculate proximity score (0.0 - 1.0).
     * Closer helpers get higher scores using exponential decay.
     */
    private double calculateProximityScore(CandidateHelper candidate) {
        double distance = candidate.getDistanceKm();
        
        if (distance <= 0) {
            return 1.0;
        }
        
        if (distance >= maxDistanceKm) {
            return 0.0;
        }
        
        // Exponential decay: score = e^(-distance/maxDistance)
        double score = Math.exp(-3.0 * distance / maxDistanceKm);
        
        // Boost for very close helpers (< 1km)
        if (distance < 1.0) {
            score = Math.min(1.0, score * 1.2);
        }
        
        return score;
    }
    
    /**
     * Calculate rating score (0.0 - 1.0).
     * Higher ratings get higher scores, with confidence factor for review count.
     */
    private double calculateRatingScore(CandidateHelper candidate) {
        double rating = candidate.getRating();
        int reviews = candidate.getTotalReviews();
        
        // Base score from rating (0-5 scale normalized to 0-1)
        double baseScore = rating / 5.0;
        
        // Confidence factor based on review count
        // More reviews = more confidence in the rating
        double confidence = Math.min(1.0, reviews / 50.0);  // Max confidence at 50 reviews
        
        // Blend with neutral rating (3.0) for low review counts
        double neutralScore = 3.0 / 5.0;
        double adjustedScore = (baseScore * confidence) + (neutralScore * (1 - confidence));
        
        return adjustedScore;
    }
    
    /**
     * Calculate response time score (0.0 - 1.0).
     * Faster responders get higher scores.
     */
    private double calculateResponseTimeScore(CandidateHelper candidate) {
        double responseTime = candidate.getResponseTimeSeconds();
        
        if (responseTime <= 0) {
            return 0.5;  // Unknown response time
        }
        
        if (responseTime >= maxResponseTimeSeconds) {
            return 0.0;
        }
        
        // Inverse linear scoring
        double score = 1.0 - (responseTime / maxResponseTimeSeconds);
        
        // Boost for very fast responders (< 10 seconds)
        if (responseTime < 10.0) {
            score = Math.min(1.0, score * 1.1);
        }
        
        return score;
    }
    
    /**
     * Calculate skill match score (0.0 - 1.0).
     * Based on overlap between required skills and helper skills.
     */
    private double calculateSkillMatchScore(CandidateHelper candidate, MatchRequest request) {
        List<String> requiredSkills = request.getRequiredSkills();
        
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return 1.0;  // No specific skills required
        }
        
        // Get helper skills from profile
        Map<String, String> profile = locationIndexService.getCachedProfile(candidate.getHelperId());
        if (profile == null) {
            return 0.5;  // Unknown skills, neutral score
        }
        
        String skillsStr = profile.get("skills");
        if (skillsStr == null || skillsStr.isEmpty()) {
            return 0.0;  // No skills listed
        }
        
        Set<String> helperSkills = Arrays.stream(skillsStr.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        
        Set<String> required = requiredSkills.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        
        // Calculate overlap
        Set<String> matching = new HashSet<>(helperSkills);
        matching.retainAll(required);
        
        Set<String> missing = new HashSet<>(required);
        missing.removeAll(helperSkills);
        
        candidate.setMatchingSkills(new ArrayList<>(matching));
        candidate.setMissingSkills(new ArrayList<>(missing));
        
        // Score based on percentage of required skills matched
        double matchRatio = (double) matching.size() / required.size();
        
        // Bonus for having more skills than required (versatility)
        double versatilityBonus = Math.min(0.1, (helperSkills.size() - matching.size()) * 0.01);
        
        return Math.min(1.0, matchRatio + versatilityBonus);
    }
    
    /**
     * Get top N candidates from ranked list.
     * 
     * @param rankedCandidates Sorted list of candidates
     * @param n Number of top candidates to return
     * @return Top N candidates
     */
    public List<CandidateHelper> getTopCandidates(List<CandidateHelper> rankedCandidates, int n) {
        if (rankedCandidates.size() <= n) {
            return rankedCandidates;
        }
        return rankedCandidates.subList(0, n);
    }
    
    /**
     * Filter candidates by minimum score threshold.
     * 
     * @param candidates List of scored candidates
     * @param minScore Minimum score threshold
     * @return Filtered list
     */
    public List<CandidateHelper> filterByMinScore(List<CandidateHelper> candidates, double minScore) {
        return candidates.stream()
                .filter(c -> c.getTotalScore() >= minScore)
                .collect(Collectors.toList());
    }
    
    /**
     * Get weight configuration summary for logging/debugging.
     */
    public Map<String, Double> getWeightConfiguration() {
        Map<String, Double> weights = new HashMap<>();
        weights.put("proximity", proximityWeight);
        weights.put("rating", ratingWeight);
        weights.put("responseTime", responseTimeWeight);
        weights.put("skillMatch", skillMatchWeight);
        return weights;
    }
}
