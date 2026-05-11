package com.failforward.backend.common.security;

import com.failforward.backend.common.api.UnauthorizedException;
import com.failforward.backend.domain.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpirationSeconds;
    private final long refreshTokenExpirationSeconds;
    private final AdminAccessPolicy adminAccessPolicy;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration-seconds:3600}") long accessTokenExpirationSeconds,
            @Value("${app.jwt.refresh-token-expiration-seconds:1209600}") long refreshTokenExpirationSeconds,
            AdminAccessPolicy adminAccessPolicy
    ) {
        this.secretKey = createSecretKey(secret);
        this.accessTokenExpirationSeconds = accessTokenExpirationSeconds;
        this.refreshTokenExpirationSeconds = refreshTokenExpirationSeconds;
        this.adminAccessPolicy = adminAccessPolicy;
    }

    public String generateAccessToken(User user) {
        return generateToken(user, accessTokenExpirationSeconds);
    }

    public String generateRefreshToken(User user) {
        return generateToken(user, refreshTokenExpirationSeconds);
    }

    public AuthenticatedUser getAuthenticatedUser(String token) {
        Claims claims = parseClaims(token);
        return new AuthenticatedUser(
                Long.parseLong(claims.getSubject()),
                claims.get("email", String.class),
                claims.get("nickname", String.class),
                Boolean.TRUE.equals(claims.get("admin", Boolean.class))
        );
    }

    public boolean isValidToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    private String generateToken(User user, long expirationSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("nickname", user.getNickname())
                .claim("admin", adminAccessPolicy.isAdmin(user))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationSeconds)))
                .signWith(secretKey)
                .compact();
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception exception) {
            throw new UnauthorizedException("Invalid or expired token.");
        }
    }

    private SecretKey createSecretKey(String secret) {
        try {
            byte[] decoded = Decoders.BASE64.decode(secret);
            return Keys.hmacShaKeyFor(decoded);
        } catch (Exception ignored) {
            byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
            if (raw.length < 32) {
                throw new IllegalArgumentException("JWT secret must be at least 32 bytes.");
            }
            Key key = Keys.hmacShaKeyFor(raw);
            return (SecretKey) key;
        }
    }
}
