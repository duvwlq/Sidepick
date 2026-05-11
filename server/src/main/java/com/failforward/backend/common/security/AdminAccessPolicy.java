package com.failforward.backend.common.security;

import com.failforward.backend.domain.user.entity.User;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminAccessPolicy {

    private final List<String> adminEmails;

    public AdminAccessPolicy(@Value("${app.security.admin-emails:}") String adminEmails) {
        this.adminEmails = Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
    }

    public boolean isAdmin(User user) {
        return user != null && isAdminEmail(user.getEmail());
    }

    public boolean isAdmin(AuthenticatedUser user) {
        return user != null && (user.admin() || isAdminEmail(user.email()));
    }

    public boolean isAdminEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return adminEmails.contains(email.trim().toLowerCase(Locale.ROOT));
    }
}
