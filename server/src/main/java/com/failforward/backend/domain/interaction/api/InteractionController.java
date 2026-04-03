package com.failforward.backend.domain.interaction.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.interaction.dto.InteractionRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InteractionController {

    @PostMapping("/api/experiences/{experienceId}/interactions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Map<String, Object>> createInteraction(
            @PathVariable Long experienceId,
            @Valid @RequestBody InteractionRequest request
    ) {
        return ApiResponse.ok(
                "Interaction recorded",
                Map.of("experienceId", experienceId, "interactionType", request.interactionType())
        );
    }
}
