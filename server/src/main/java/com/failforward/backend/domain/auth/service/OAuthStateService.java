package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.domain.auth.dto.AuthDtos.OAuthStatePayload;
import com.failforward.backend.domain.user.entity.AuthProvider;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class OAuthStateService {
    private static final Duration STATE_TTL = Duration.ofMinutes(10);

    private final Map<String, OAuthStateRecord> stateStore = new ConcurrentHashMap<>();

    public OAuthStatePayload issue(AuthProvider provider, String redirectUri) {
        if (provider == null || provider == AuthProvider.LOCAL) {
            throw new BadRequestException("OAuth provider is invalid.");
        }

        LocalDateTime expiresAt = LocalDateTime.now().plus(STATE_TTL);
        String state = UUID.randomUUID().toString();
        stateStore.put(state, new OAuthStateRecord(provider, redirectUri, expiresAt));
        clearExpiredStates();
        return new OAuthStatePayload(state, provider, expiresAt);
    }

    public void consume(AuthProvider provider, String state, String redirectUri) {
        OAuthStateRecord record = stateStore.remove(state);
        if (record == null) {
            throw new BadRequestException("OAuth state is missing or invalid.");
        }
        if (record.expiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OAuth state has expired.");
        }
        if (record.provider() != provider) {
            throw new BadRequestException("OAuth provider does not match the issued state.");
        }
        if (!record.redirectUri().equals(redirectUri)) {
            throw new BadRequestException("OAuth redirect URI does not match the issued state.");
        }
    }

    private void clearExpiredStates() {
        LocalDateTime now = LocalDateTime.now();
        stateStore.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private record OAuthStateRecord(
            AuthProvider provider,
            String redirectUri,
            LocalDateTime expiresAt
    ) {
    }
}
