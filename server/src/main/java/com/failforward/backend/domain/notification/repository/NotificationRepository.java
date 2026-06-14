package com.failforward.backend.domain.notification.repository;

import com.failforward.backend.domain.notification.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = {"user", "actorUser"})
    List<Notification> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "actorUser"})
    List<Notification> findAllByUserIdAndIsReadOrderByCreatedAtDesc(Long userId, Boolean isRead);

    Optional<Notification> findByUserIdAndActorUserIdAndTypeAndTargetTypeAndTargetId(
            Long userId,
            Long actorUserId,
            String type,
            String targetType,
            Long targetId
    );

    Optional<Notification> findByIdAndUserId(Long notificationId, Long userId);
}
