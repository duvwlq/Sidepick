package com.failforward.backend.domain.analysis.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PromptLoader {

    private final String configuredPromptPath;

    public PromptLoader(
            @Value("${app.agent-c.prompt-path:ai/prompts/AI-04-agent_c_v1.md}") String configuredPromptPath
    ) {
        this.configuredPromptPath = configuredPromptPath;
    }

    public String getAgentCPromptPath() {
        return resolvePromptPath().toString().replace('\\', '/');
    }

    public String loadAgentCPrompt() {
        Path promptPath = resolvePromptPath();
        try {
            return Files.readString(promptPath, StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to load Agent C prompt file: " + promptPath, exception);
        }
    }

    private Path resolvePromptPath() {
        List<Path> candidates = List.of(
                Path.of(configuredPromptPath),
                Path.of(System.getProperty("user.dir")).resolve(configuredPromptPath),
                Path.of(System.getProperty("user.dir")).resolve("..").resolve(configuredPromptPath)
        );

        return candidates.stream()
                .map(Path::toAbsolutePath)
                .map(Path::normalize)
                .filter(Files::exists)
                .findFirst()
                .orElse(candidates.get(candidates.size() - 1).toAbsolutePath().normalize());
    }
}
