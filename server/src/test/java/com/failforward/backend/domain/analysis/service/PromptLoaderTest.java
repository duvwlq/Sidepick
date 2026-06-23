package com.failforward.backend.domain.analysis.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PromptLoaderTest {

    @TempDir
    Path tempDir;

    @Test
    void loadsPromptFromConfiguredRelativePath() throws Exception {
        Path promptFile = tempDir.resolve("ai/prompts/AI-04-agent_c_v1.md");
        Files.createDirectories(promptFile.getParent());
        Files.writeString(promptFile, "agent-c prompt");

        String originalUserDir = System.getProperty("user.dir");
        System.setProperty("user.dir", tempDir.toString());
        try {
            PromptLoader promptLoader = new PromptLoader("ai/prompts/AI-04-agent_c_v1.md");

            assertThat(promptLoader.getAgentCPromptPath())
                    .endsWith("ai/prompts/AI-04-agent_c_v1.md");
            assertThat(promptLoader.loadAgentCPrompt()).isEqualTo("agent-c prompt");
        } finally {
            System.setProperty("user.dir", originalUserDir);
        }
    }
}
