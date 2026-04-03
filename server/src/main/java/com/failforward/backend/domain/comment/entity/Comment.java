package com.failforward.backend.domain.comment.entity;

import com.failforward.backend.common.entity.BaseTimeEntity;
import com.failforward.backend.domain.experience.entity.FailureExperience;
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
@Table(name = "comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id", nullable = false)
    private FailureExperience experience;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    private Comment(FailureExperience experience, User user, Comment parent, String content) {
        this.experience = experience;
        this.user = user;
        this.parent = parent;
        this.content = content;
        this.isDeleted = false;
    }

    public static Comment create(FailureExperience experience, User user, Comment parent, String content) {
        return new Comment(experience, user, parent, content);
    }

    public void updateContent(String content) {
        this.content = content;
    }

    public void markDeleted() {
        this.isDeleted = true;
        this.content = "[deleted]";
    }
}
