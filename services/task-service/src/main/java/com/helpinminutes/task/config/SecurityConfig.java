package com.helpinminutes.task.config;

import com.helpinminutes.task.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration for Task Service.
 * 
 * NOTE: This configuration is for development/testing purposes only.
 * In production, JWT validation should be configured to validate tokens
 * issued by the Identity Service.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for REST APIs
            .csrf(AbstractHttpConfigurer::disable)
            
            // Add JWT authentication filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            
            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                // Permit health endpoints without authentication
                .requestMatchers("/api/v1/health").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                // Permit categories and skills endpoints without authentication
                .requestMatchers("/api/v1/categories/**").permitAll()
                .requestMatchers("/api/v1/skills/**").permitAll()
                // Require authentication for all other endpoints
                .anyRequest().authenticated()
            )
            
            // Use stateless session management
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        
        return http.build();
    }
}
