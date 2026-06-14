package com.failforward.backend.domain.chatbot.service;

import com.failforward.backend.common.api.RateLimitExceededException;
import com.failforward.backend.common.config.ChatbotProperties;
import java.util.concurrent.ArrayBlockingQueue;
import org.springframework.stereotype.Component;

@Component
public class ChatbotRequestQueue {

    // This queue protects a single app instance from overload. It is not a cross-instance global limit.
    private final ArrayBlockingQueue<Integer> slots;

    public ChatbotRequestQueue(ChatbotProperties properties) {
        int capacity = Math.max(1, properties.queueCapacity());
        this.slots = new ArrayBlockingQueue<>(capacity);
        for (int index = 0; index < capacity; index++) {
            slots.offer(index);
        }
    }

    public int acquire() {
        Integer slot = slots.poll();
        if (slot == null) {
            throw new RateLimitExceededException("Chatbot instance queue is full.");
        }
        return slot;
    }

    public void release(int slot) {
        slots.offer(slot);
    }

    public int capacity() {
        return slots.remainingCapacity() + slots.size();
    }

    public int availableSlots() {
        return slots.size();
    }

    public int activeRequests() {
        return capacity() - availableSlots();
    }
}
