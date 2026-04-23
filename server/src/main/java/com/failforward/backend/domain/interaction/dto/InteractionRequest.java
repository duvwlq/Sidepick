package com.failforward.backend.domain.interaction.dto;

import jakarta.validation.constraints.NotBlank;

public record InteractionRequest(
        @NotBlank String interactionType
) {
}
