package com.failforward.backend.domain.guide.dto;

import java.util.List;

public final class GuideWritingExampleDtos {

    private GuideWritingExampleDtos() {
    }

    public record GuideWritingExamplesResponse(
            String version,
            String lastUpdated,
            String author,
            String ticket,
            String dependsOn,
            String description,
            GuideWritingGuideline guideline,
            List<GuideWritingCategory> categories
    ) {
    }

    public record GuideWritingGuideline(
            String length,
            String tone,
            List<String> patterns
    ) {
    }

    public record GuideWritingCategory(
            String id,
            String category,
            List<GuideWritingExample> examples
    ) {
    }

    public record GuideWritingExample(
            String pattern,
            String text
    ) {
    }
}
