package com.failforward.backend.domain.auth.repository;

import com.failforward.backend.domain.auth.entity.EmailVerificationToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    void deleteByEmail(String email);

    Optional<EmailVerificationToken> findTopByEmailOrderByCreatedAtDesc(String email);
}
