package com.failforward.backend.domain.view.service;

import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.view.entity.UserExperienceView;
import com.failforward.backend.domain.view.repository.UserExperienceViewRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserExperienceViewService {

    private final UserExperienceViewRepository userExperienceViewRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public void recordView(FailureExperience experience) {
        User user = currentUserProvider.getCurrentUserEntityOrNull();
        if (user == null) {
            return;
        }

        userExperienceViewRepository.findByExperienceIdAndUserId(experience.getId(), user.getId())
                .ifPresentOrElse(
                        view -> view.refresh(LocalDateTime.now()),
                        () -> userExperienceViewRepository.save(UserExperienceView.create(experience, user, LocalDateTime.now()))
                );
    }
}
