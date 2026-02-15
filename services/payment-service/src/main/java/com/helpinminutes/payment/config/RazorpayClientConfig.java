package com.helpinminutes.payment.config;

import com.razorpay.RazorpayClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class RazorpayClientConfig {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret}")
    private String webhookSecret;

    @Bean
    public RazorpayClient razorpayClient() {
        try {
            log.info("Initializing Razorpay client with key ID: {}", keyId);
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            log.info("Razorpay client initialized successfully");
            return client;
        } catch (Exception e) {
            log.error("Failed to initialize Razorpay client: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize Razorpay client", e);
        }
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public String getKeyId() {
        return keyId;
    }

    public String getKeySecret() {
        return keySecret;
    }
}
