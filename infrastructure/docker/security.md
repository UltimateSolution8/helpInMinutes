# ============================================
# HelpInMinutes Security Configuration
# ============================================

## 1. Network Security

### Firewall Configuration

```bash
# Allow SSH (port 22)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (ports 80, 443)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Docker daemon
sudo ufw allow 2375/tcp
sudo ufw allow 2376/tcp

# Enable firewall
sudo ufw enable
```

### Docker Network Isolation

```yaml
# docker-compose.yml network configuration
networks:
  frontend:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
  backend:
    driver: bridge
    internal: true  # No external access
  storage:
    driver: bridge
    internal: true
```

### Rate Limiting (Nginx)

```nginx
# Nginx rate limiting configuration
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

location /api/ {
    limit_req zone=api_limit burst=100 nodelay;
    limit_conn conn_limit 100;
}
```

## 2. Secrets Management

### Environment Variables (Development)

```bash
# .env file - NEVER commit to version control
POSTGRES_PASSWORD=secure-password-here
REDIS_PASSWORD=secure-password-here
JWT_SECRET=your-jwt-secret-key
```

### Docker Secrets (Production/Swarm Mode)

```yaml
# docker-compose.yml secrets configuration
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
  redis_password:
    file: ./secrets/redis_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

### Kubernetes Secrets

```yaml
# k8s/secrets/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: helpinminutes-secrets
  namespace: helpinminutes
type: Opaque
stringData:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  JWT_SECRET: ${JWT_SECRET}
```

### External Secrets (AWS Secrets Manager)

```yaml
# Kubernetes ExternalSecret example
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-south-1
```

## 3. SSL/TLS Configuration

### Certificate Requirements

- Minimum 2048-bit RSA key
- TLS 1.2 or higher
- Strong cipher suites only
- HSTS enabled
- Certificate transparency logging

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Protocol versions
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Cipher suites
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
}
```

## 4. CORS Configuration

### Allowed Origins

```java
// Spring Boot CORS Configuration
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "https://helpinminutes.com",
                "https://admin.helpinminutes.com"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### Express.js CORS Configuration

```javascript
// Node.js CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://helpinminutes.com',
            'https://admin.helpinminutes.com'
        ];
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
```

## 5. Security Headers

### Response Headers

| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=63072000 | Enforce HTTPS |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-XSS-Protection | 1; mode=block | XSS protection |
| Content-Security-Policy | default-src 'self' | CSP policy |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer control |
| Permissions-Policy | geolocation=(), microphone=() | Feature policies |

### Nginx Security Headers

```nginx
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## 6. Authentication & Authorization

### JWT Configuration

```yaml
# application.yml
jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000  # 24 hours
  refresh-expiration: 604800000  # 7 days
  issuer: helpinminutes
```

### Password Requirements

```java
// Password validation
public class PasswordValidator {
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
    );
    
    public static boolean isValid(String password) {
        return PASSWORD_PATTERN.matcher(password).matches();
    }
}
```

### Role-Based Access Control

```java
// Spring Security configuration
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );
        return http.build();
    }
}
```

## 7. Database Security

### PostgreSQL Security

```sql
-- Create limited user
CREATE USER helpinminutes_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE helpinminutes TO helpinminutes_app;
GRANT USAGE ON SCHEMA public TO helpinminutes_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO helpinminutes_app;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
```

### Connection Encryption

```yaml
# Spring Boot datasource configuration
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/helpinminutes?ssl=true&sslmode=require
    username: ${POSTGRES_USER}
    password: ${POSTGRES_PASSWORD}
```

## 8. Audit Logging

### Audit Events

```java
// Audit log entity
@Entity
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String userId;
    private String action;
    private String resource;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime timestamp;
    private String details;
}
```

### Audit Configuration

```java
// Spring Boot Audit
@Configuration
@EnableJpaAuditing
public class AuditConfig {
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return Optional.of("SYSTEM");
            }
            return Optional.of(authentication.getName());
        };
    }
}
```

## 9. Vulnerability Scanning

### Trivy Scan

```bash
# Scan Docker images
trivy image docker.io/helpinminutes/identity-service:latest

# Scan filesystem
trivy fs --security-checks vuln,config .

# Scan Kubernetes manifests
trivy k8s --report summary cluster
```

### Dependency Scanning

```bash
# Java dependencies
./mvnw org.owasp:dependency-check-maven:check

# Node.js dependencies
npm audit --production

# Python dependencies
safety check -r requirements.txt
```

## 10. Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Enable SSL/TLS for all endpoints
- [ ] Configure rate limiting
- [ ] Set up CORS policies
- [ ] Enable security headers
- [ ] Configure audit logging
- [ ] Set up intrusion detection
- [ ] Enable database encryption
- [ ] Configure network segmentation
- [ ] Set up backup encryption
- [ ] Review access permissions
- [ ] Test authentication flows
- [ ] Validate input sanitization
- [ ] Check for SQL injection
- [ ] Verify XSS protection

### Ongoing

- [ ] Rotate secrets quarterly
- [ ] Update dependencies monthly
- [ ] Run security scans weekly
- [ ] Review audit logs daily
- [ ] Monitor for anomalies
- [ ] Update SSL certificates before expiry
- [ ] Penetration testing annually
- [ ] Security training quarterly
