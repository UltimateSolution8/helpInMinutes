import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class test-jwt {

    public static void main(String[] args) {
        // Test 1: Identity service
        String identitySecret = "helpinminutes-jwt-secret-key-for-development-only-32bytes";
        System.out.println("Identity Service Secret: " + identitySecret);
        System.out.println("Identity Service Secret Length: " + identitySecret.length());
        String identityToken = generateToken(identitySecret, "6c0747a9-c353-49e6-95c7-3b1118f053fd", "jane.smith@example.com", "BUYER");
        System.out.println("Identity Service Token: " + identityToken);

        // Test 2: Payment service
        String paymentSecret = "helpinminutes-jwt-secret-key-for-development-only-32bytes";
        System.out.println("\nPayment Service Secret: " + paymentSecret);
        System.out.println("Payment Service Secret Length: " + paymentSecret.length());
        boolean paymentVerified = verifyToken(identityToken, paymentSecret);
        System.out.println("Payment Service Token Verified: " + paymentVerified);

        // Test 3: Check if secrets are the same
        System.out.println("\nSecrets are identical: " + identitySecret.equals(paymentSecret));
    }

    private static String generateToken(String secret, String userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("role", role);
        claims.put("type", "ACCESS");

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + 3600000);

        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        
        // If the secret is too short, pad it; if too long, hash it
        if (keyBytes.length < 32) {
            // Pad to 32 bytes
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        } else if (keyBytes.length > 32) {
            // Hash to 32 bytes using SHA-256
            try {
                java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                keyBytes = digest.digest(keyBytes);
            } catch (Exception e) {
                throw new RuntimeException("Failed to hash JWT secret", e);
            }
        }
        
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        return Jwts.builder()
                .claims(claims)
                .subject(userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    private static boolean verifyToken(String token, String secret) {
        try {
            byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            
            // If the secret is too short, pad it; if too long, hash it
            if (keyBytes.length < 32) {
                // Pad to 32 bytes
                byte[] padded = new byte[32];
                System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
                keyBytes = padded;
            } else if (keyBytes.length > 32) {
                // Hash to 32 bytes using SHA-256
                try {
                    java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                    keyBytes = digest.digest(keyBytes);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to hash JWT secret", e);
                }
            }
            
            SecretKey key = Keys.hmacShaKeyFor(keyBytes);

            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return true;
        } catch (Exception e) {
            System.out.println("Verification failed: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
