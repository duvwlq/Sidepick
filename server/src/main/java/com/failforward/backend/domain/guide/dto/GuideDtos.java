package com.failforward.backend.domain.guide.dto;

import java.util.List;

public final class GuideDtos {

    private GuideDtos() {
    }

    public record ExperienceGuideResponse(
            Long experienceId,
            Long categoryId,
            String categoryKey,
            String difficultyKey,
            List<String> guideLines
    ) {
    }
}
