package com.failforward.backend.domain.category.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "business_categories")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BusinessCategory {

    @Id
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String icon;

    @Column(nullable = false, length = 20)
    private String color;

    private BusinessCategory(Long id, String name, String description, String icon, String color) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.color = color;
    }

    public static BusinessCategory create(Long id, String name, String description, String icon, String color) {
        return new BusinessCategory(id, name, description, icon, color);
    }
}
