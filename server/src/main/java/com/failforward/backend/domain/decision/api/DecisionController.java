package com.failforward.backend.domain.decision.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.decision.dto.DecisionDtos.DecisionRequest;
import com.failforward.backend.domain.decision.dto.DecisionDtos.DecisionResponse;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/decisions")
public class DecisionController {

    private static final AtomicLong DECISION_SEQUENCE = new AtomicLong(1L);

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DecisionResponse> createDecision(@Valid @RequestBody DecisionRequest request) {
        DecisionResponse response = new DecisionResponse(
                DECISION_SEQUENCE.getAndIncrement(),
                1L,
                request.viewedExperiences(),
                request.comparedExperiences(),
                request.decisionType(),
                request.decisionReason(),
                request.confidenceLevel(),
                request.timeSpentMinutes(),
                LocalDateTime.now()
        );
        return ApiResponse.ok("Decision recorded", response);
    }
}
