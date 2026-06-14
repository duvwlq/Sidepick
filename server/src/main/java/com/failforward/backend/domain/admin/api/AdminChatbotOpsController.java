package com.failforward.backend.domain.admin.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.admin.dto.AdminChatbotOpsDtos.ChatbotOpsResponse;
import com.failforward.backend.domain.admin.service.AdminChatbotOpsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AdminChatbotOpsController {

    private final AdminChatbotOpsService adminChatbotOpsService;

    @GetMapping("/api/admin/chatbot-ops")
    public ApiResponse<ChatbotOpsResponse> getChatbotOps() {
        return ApiResponse.ok("Chatbot ops loaded.", adminChatbotOpsService.getChatbotOps());
    }
}
