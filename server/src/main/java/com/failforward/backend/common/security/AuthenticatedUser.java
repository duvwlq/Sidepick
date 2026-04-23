package com.failforward.backend.common.security;

public record AuthenticatedUser(
        Long id,
        String email,
        String nickname
) {
}
