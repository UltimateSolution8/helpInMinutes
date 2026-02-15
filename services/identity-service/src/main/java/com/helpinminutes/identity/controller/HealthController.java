package com.helpinminutes.identity.controller;

import com.helpinminutes.identity.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "identity-service");
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debug() {
        // Reflection to get private fields
        try {
            java.lang.reflect.Field secretField = JwtTokenProvider.class.getDeclaredField("jwtSecret");
            secretField.setAccessible(true);
            String jwtSecret = (String) secretField.get(jwtTokenProvider);

            java.lang.reflect.Field keyField = JwtTokenProvider.class.getDeclaredField("key");
            keyField.setAccessible(true);
            Object key = keyField.get(jwtTokenProvider);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "UP");
            response.put("service", "identity-service");
            response.put("timestamp", LocalDateTime.now());
            response.put("jwtSecret", jwtSecret);
            response.put("jwtSecretLength", jwtSecret.length());
            response.put("jwtKey", key);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("service", "identity-service");
            response.put("timestamp", LocalDateTime.now());
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}