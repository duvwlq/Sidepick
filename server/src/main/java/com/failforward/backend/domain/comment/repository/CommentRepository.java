package com.failforward.backend.domain.comment.repository;

import com.failforward.backend.domain.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = {"user", "experience", "parent"})
    Optional<Comment> findWithDetailsById(Long id);
}
