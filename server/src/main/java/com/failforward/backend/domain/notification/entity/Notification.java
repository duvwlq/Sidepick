package com.failforward.backend.domain.notification.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import com.failforward.backend.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "notifications")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id", nullable = false)
    private User actorUser;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "target_type", nullable = false, length = 30)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    private Notification(User user, User actorUser, String type, String targetType, Long targetId, String message) {
        this.user = user;
        this.actorUser = actorUser;
        this.type = type;
        this.targetType = targetType;
        this.targetId = targetId;
        this.message = message;
        this.isRead = false;
    }

    public static Notification create(User user, User actorUser, String type, String targetType, Long targetId, String message) {
        return new Notification(user, actorUser, type, targetType, targetId, message);
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public String getMessage() {
        return message;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void markRead() {
        this.isRead = true;
    }
}
