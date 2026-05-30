package com.failforward.backend.common.privacy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class SensitiveDataMaskingServiceTest {

    private final SensitiveDataMaskingService maskingService = new SensitiveDataMaskingService();

    @Test
    void maskTextMasksPhoneEmailAndResidentId() {
        String masked = maskingService.maskText("010-1234-5678 testuser@example.com 990101-1234567");

        assertThat(masked).contains("010-****-5678");
        assertThat(masked).contains("t**@example.com");
        assertThat(masked).contains("990101-*******");
    }

    @Test
    void maskObjectMapMasksNestedCollections() {
        Map<String, Object> masked = maskingService.maskObjectMap(Map.of(
                "phone", "01012345678",
                "email", "owner@example.com",
                "nested", Map.of("residentId", "990101-1234567"),
                "items", List.of("010 9999 0000", "second@example.com")
        ));

        assertThat(masked.get("phone")).isEqualTo("010-****-5678");
        assertThat(masked.get("email")).isEqualTo("o**@example.com");
        assertThat(((Map<?, ?>) masked.get("nested")).get("residentId")).isEqualTo("990101-*******");
        List<?> items = (List<?>) masked.get("items");
        assertThat(items).hasSize(2);
        assertThat(items.get(0)).isEqualTo("010-****-0000");
        assertThat(items.get(1)).isEqualTo("s**@example.com");
    }
}
