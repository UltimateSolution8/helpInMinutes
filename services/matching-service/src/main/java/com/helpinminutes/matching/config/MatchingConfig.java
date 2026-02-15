package com.helpinminutes.matching.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration for matching algorithm parameters.
 */
@Slf4j
@Getter
@Configuration
public class MatchingConfig {

    @Value("${h3.resolution:9}")
    private int h3Resolution;

    @Value("${matching.weights.proximity:0.35}")
    private double proximityWeight;

    @Value("${matching.weights.rating:0.25}")
    private double ratingWeight;

    @Value("${matching.weights.responseTime:0.20}")
    private double responseTimeWeight;

    @Value("${matching.weights.skillMatch:0.20}")
    private double skillMatchWeight;

    @Value("${matching.scoring.maxDistanceKm:10.0}")
    private double maxDistanceKm;

    @Value("${matching.scoring.maxResponseTimeSeconds:300.0}")
    private double maxResponseTimeSeconds;

    @Value("${matching.scoring.minRatingThreshold:3.0}")
    private double minRatingThreshold;

    @Value("${matching.timeout.ms:300}")
    private int matchingTimeoutMs;

    @Value("${matching.max-helpers-to-notify:5}")
    private int maxHelpersToNotify;

    @Value("${matching.dispatch-timeout-seconds:15}")
    private int dispatchTimeoutSeconds;

    @Value("${matching.retry.max-attempts:3}")
    private int maxRetryAttempts;

    @Value("${matching.retry.expanded-radius-multiplier:2.0}")
    private double expandedRadiusMultiplier;

    @PostConstruct
    public void validate() {
        // Validate weights sum to approximately 1.0
        double totalWeight = proximityWeight + ratingWeight + responseTimeWeight + skillMatchWeight;
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            log.warn("Matching weights do not sum to 1.0: {}. Normalizing.", totalWeight);
            normalizeWeights();
        }
        
        log.info("MatchingConfig initialized: resolution={}, weights=[proximity={}, rating={}, response={}, skill={}]",
                h3Resolution, proximityWeight, ratingWeight, responseTimeWeight, skillMatchWeight);
    }

    private void normalizeWeights() {
        double total = proximityWeight + ratingWeight + responseTimeWeight + skillMatchWeight;
        proximityWeight /= total;
        ratingWeight /= total;
        responseTimeWeight /= total;
        skillMatchWeight /= total;
    }

    public Map<String, Object> getConfigMap() {
        Map<String, Object> config = new HashMap<>();
        config.put("h3Resolution", h3Resolution);
        config.put("proximityWeight", proximityWeight);
        config.put("ratingWeight", ratingWeight);
        config.put("responseTimeWeight", responseTimeWeight);
        config.put("skillMatchWeight", skillMatchWeight);
        config.put("maxDistanceKm", maxDistanceKm);
        config.put("maxResponseTimeSeconds", maxResponseTimeSeconds);
        config.put("minRatingThreshold", minRatingThreshold);
        config.put("matchingTimeoutMs", matchingTimeoutMs);
        config.put("maxHelpersToNotify", maxHelpersToNotify);
        config.put("dispatchTimeoutSeconds", dispatchTimeoutSeconds);
        config.put("maxRetryAttempts", maxRetryAttempts);
        config.put("expandedRadiusMultiplier", expandedRadiusMultiplier);
        return config;
    }
}
