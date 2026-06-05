package com.failforward.backend.domain.agenta.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.agenta.dto.AgentADtos.AnalyzeDraftRequest;
import com.failforward.backend.domain.agenta.dto.AgentADtos.AnalyzeDraftResponse;
import com.failforward.backend.domain.agenta.service.AgentAService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AgentAController {

    private final AgentAService agentAService;

    @PostMapping("/api/agent-a/analyze-draft")
    public ApiResponse<AnalyzeDraftResponse> analyzeDraft(@RequestBody AnalyzeDraftRequest request) {
        return ApiResponse.ok("Draft analyzed.", agentAService.analyzeDraft(request));
    }
}
