import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

public class VerifyJwt {
    public static void main(String[] args) {
        String token = args[0];
        String secret = "super-long-jwt-secret-key-for-testing-32bytes";

        try {
            byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            SecretKey key = Keys.hmacShaKeyFor(keyBytes);

            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            System.out.println("Decoded Token: " + claims);
        } catch (Exception e) {
            System.err.println("Error: " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
