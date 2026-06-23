package com.failforward.backend.domain.notification.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.notification.dto.NotificationDtos.NotificationItem;
import com.failforward.backend.domain.notification.dto.NotificationDtos.NotificationListResponse;
import com.failforward.backend.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/api/notifications")
    public ApiResponse<NotificationListResponse> getNotifications(
            @RequestParam(required = false) Boolean read
    ) {
        return ApiResponse.ok("Notifications loaded.", notificationService.getMyNotifications(read));
    }

    @PatchMapping("/api/notifications/{notificationId}/read")
    public ApiResponse<NotificationItem> markNotificationRead(@PathVariable Long notificationId) {
        return ApiResponse.ok("Notification marked as read.", notificationService.markAsRead(notificationId));
    }
}
