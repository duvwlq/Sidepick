package com.failforward.backend.domain.notification.dto;

import com.failforward.backend.domain.notification.entity.Notification;
import java.time.LocalDateTime;
import java.util.List;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record NotificationItem(
            Long id,
            String type,
            String message,
            boolean isRead,
            String targetType,
            Long targetId,
            LocalDateTime createdAt
    ) {
        public static NotificationItem from(Notification notification) {
            return new NotificationItem(
                    notification.getId(),
                    notification.getType(),
                    notification.getMessage(),
                    Boolean.TRUE.equals(notification.getIsRead()),
                    notification.getTargetType(),
                    notification.getTargetId(),
                    notification.getCreatedAt()
            );
        }
    }

    public record NotificationListResponse(
            List<NotificationItem> items
    ) {
    }
}
