package com.failforward.backend.domain.auth.repository;

import com.failforward.backend.domain.auth.entity.SocialAccount;
import com.failforward.backend.domain.user.entity.AuthProvider;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {

    Optional<SocialAccount> findByProviderAndProviderUserId(AuthProvider provider, String providerUserId);
}
