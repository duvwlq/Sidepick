package com.failforward.backend.domain.chatbot.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.ChatbotMessageRequest;
import com.failforward.backend.domain.chatbot.dto.ChatbotDtos.ChatbotMessageResponse;
import com.failforward.backend.domain.chatbot.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/api/chatbot/message")
    public ApiResponse<ChatbotMessageResponse> sendMessage(@Valid @RequestBody ChatbotMessageRequest request) {
        return ApiResponse.ok("Chatbot reply created.", chatbotService.sendMessage(request));
    }
}
