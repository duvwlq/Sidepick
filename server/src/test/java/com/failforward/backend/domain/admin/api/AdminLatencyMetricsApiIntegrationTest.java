package com.failforward.backend.domain.admin.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.failforward.backend.support.ApiIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminLatencyMetricsApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void adminLatencyMetricsRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/latency-metrics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminLatencyMetricsRejectsNonAdminUser() throws Exception {
        String token = registerAndLogin("metrics_user@sidepick.dev", "password123", "metricsUser", "20s");

        mockMvc.perform(get("/api/admin/latency-metrics")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    void adminLatencyMetricsReturnsRecordedEndpointsForAdmin() throws Exception {
        String adminToken = registerAndLogin("admin@sidepick.dev", "password123", "metricsAdmin", "20s");

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/admin/latency-metrics")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalSamples").isNumber())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode endpoints = json.path("data").path("endpoints");

        JsonNode healthMetric = findEndpoint(endpoints, "GET /api/health");
        assertThat(healthMetric).isNotNull();
        assertThat(healthMetric.path("count").asLong()).isGreaterThanOrEqualTo(2L);
        assertThat(healthMetric.path("p95Ms").asLong()).isGreaterThanOrEqualTo(0L);
        assertThat(healthMetric.path("maxMs").asLong()).isGreaterThanOrEqualTo(healthMetric.path("p50Ms").asLong());

        JsonNode categoriesMetric = findEndpoint(endpoints, "GET /api/categories");
        assertThat(categoriesMetric).isNotNull();
        assertThat(categoriesMetric.path("count").asLong()).isGreaterThanOrEqualTo(1L);
    }

    private JsonNode findEndpoint(JsonNode endpoints, String endpoint) {
        for (JsonNode item : endpoints) {
            if (endpoint.equals(item.path("endpoint").asText())) {
                return item;
            }
        }
        return null;
    }
}
