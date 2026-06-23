package com.failforward.backend.domain.notification.service;

import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.notification.dto.NotificationDtos.NotificationItem;
import com.failforward.backend.domain.notification.dto.NotificationDtos.NotificationListResponse;
import com.failforward.backend.domain.notification.entity.Notification;
import com.failforward.backend.domain.notification.repository.NotificationRepository;
import com.failforward.backend.domain.user.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    public static final String TYPE_EXPERIENCE_LIKE = "EXPERIENCE_LIKE";
    public static final String TYPE_EXPERIENCE_BOOKMARK = "EXPERIENCE_BOOKMARK";
    public static final String TARGET_TYPE_EXPERIENCE = "EXPERIENCE";

    private final NotificationRepository notificationRepository;
    private final CurrentUserProvider currentUserProvider;

    public NotificationListResponse getMyNotifications(Boolean read) {
        User user = currentUserProvider.getCurrentUserEntity();
        List<Notification> notifications = read == null
                ? notificationRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                : notificationRepository.findAllByUserIdAndIsReadOrderByCreatedAtDesc(user.getId(), read);

        return new NotificationListResponse(notifications.stream().map(NotificationItem::from).toList());
    }

    @Transactional
    public NotificationItem markAsRead(Long notificationId) {
        User user = currentUserProvider.getCurrentUserEntity();
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new NotFoundException("Notification not found."));
        notification.markRead();
        return NotificationItem.from(notification);
    }

    @Transactional
    public void createExperienceLikeNotification(User recipient, User actorUser, Long experienceId, String experienceTitle) {
        if (recipient.getId().equals(actorUser.getId())) {
            return;
        }

        boolean exists = notificationRepository.findByUserIdAndActorUserIdAndTypeAndTargetTypeAndTargetId(
                recipient.getId(),
                actorUser.getId(),
                TYPE_EXPERIENCE_LIKE,
                TARGET_TYPE_EXPERIENCE,
                experienceId
        ).isPresent();

        if (exists) {
            return;
        }

        notificationRepository.save(Notification.create(
                recipient,
                actorUser,
                TYPE_EXPERIENCE_LIKE,
                TARGET_TYPE_EXPERIENCE,
                experienceId,
                actorUser.getNickname() + "님이 회원님의 게시물에 좋아요를 눌렀습니다."
        ));
    }

    @Transactional
    public void createExperienceBookmarkNotification(
            User recipient,
            User actorUser,
            Long experienceId,
            String experienceTitle
    ) {
        if (recipient.getId().equals(actorUser.getId())) {
            return;
        }

        boolean exists = notificationRepository.findByUserIdAndActorUserIdAndTypeAndTargetTypeAndTargetId(
                recipient.getId(),
                actorUser.getId(),
                TYPE_EXPERIENCE_BOOKMARK,
                TARGET_TYPE_EXPERIENCE,
                experienceId
        ).isPresent();

        if (exists) {
            return;
        }

        notificationRepository.save(Notification.create(
                recipient,
                actorUser,
                TYPE_EXPERIENCE_BOOKMARK,
                TARGET_TYPE_EXPERIENCE,
                experienceId,
                actorUser.getNickname() + "님이 회원님의 게시물을 북마크 했습니다."
        ));
    }
}
