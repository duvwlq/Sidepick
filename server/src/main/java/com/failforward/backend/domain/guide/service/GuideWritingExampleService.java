package com.failforward.backend.domain.guide.service;

import com.failforward.backend.domain.guide.dto.GuideWritingExampleDtos.GuideWritingCategory;
import com.failforward.backend.domain.guide.dto.GuideWritingExampleDtos.GuideWritingExample;
import com.failforward.backend.domain.guide.dto.GuideWritingExampleDtos.GuideWritingExamplesResponse;
import com.failforward.backend.domain.guide.dto.GuideWritingExampleDtos.GuideWritingGuideline;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GuideWritingExampleService {

    private final ObjectMapper objectMapper;

    private GuideWritingExamplesResponse cachedResponse;

    @PostConstruct
    void loadExamples() {
        List<Path> candidates = List.of(
                Path.of("/app", "import-data", "guide-writing-examples.json"),
                Path.of("import-data", "guide-writing-examples.json").toAbsolutePath().normalize(),
                Path.of("server", "import-data", "guide-writing-examples.json").toAbsolutePath().normalize()
        );
        Path filePath = candidates.stream()
                .filter(Files::exists)
                .findFirst()
                .orElse(candidates.get(candidates.size() - 1));

        try (InputStream inputStream = Files.newInputStream(filePath)) {
            JsonNode root = objectMapper.readTree(inputStream);
            cachedResponse = new GuideWritingExamplesResponse(
                    root.path("version").asText(""),
                    root.path("last_updated").asText(""),
                    root.path("author").asText(""),
                    root.path("ticket").asText(""),
                    root.path("depends_on").asText(""),
                    root.path("description").asText(""),
                    new GuideWritingGuideline(
                            root.path("guideline").path("length").asText(""),
                            root.path("guideline").path("tone").asText(""),
                            objectMapper.convertValue(root.path("guideline").path("patterns"), objectMapper.getTypeFactory().constructCollectionType(List.class, String.class))
                    ),
                    root.path("categories").isArray()
                            ? objectMapper.convertValue(
                                    root.path("categories"),
                                    objectMapper.getTypeFactory().constructCollectionType(List.class, GuideWritingCategory.class)
                            )
                            : List.of()
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to load guide-writing-examples.json", exception);
        }
    }

    public GuideWritingExamplesResponse getExamples() {
        return cachedResponse;
    }
}
