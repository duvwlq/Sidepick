package com.failforward.backend.common.privacy;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class SensitiveDataMaskingService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("(01[016789])[-\\s]?(\\d{3,4})[-\\s]?(\\d{4})");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\\b([A-Za-z0-9._%+-]{1,64})@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})\\b");
    private static final Pattern RESIDENT_ID_PATTERN = Pattern.compile("\\b(\\d{6})-(\\d{7})\\b");

    public String maskText(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        String masked = maskPhones(value);
        masked = maskEmails(masked);
        return maskResidentIds(masked);
    }

    public Map<String, Object> maskObjectMap(Map<String, Object> source) {
        if (source == null || source.isEmpty()) {
            return source;
        }

        Map<String, Object> masked = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            masked.put(entry.getKey(), maskValue(entry.getValue()));
        }
        return masked;
    }

    private Object maskValue(Object value) {
        if (value instanceof String text) {
            return maskText(text);
        }
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> nested = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                nested.put(String.valueOf(entry.getKey()), maskValue(entry.getValue()));
            }
            return nested;
        }
        if (value instanceof Iterable<?> iterable) {
            java.util.List<Object> maskedList = new java.util.ArrayList<>();
            for (Object item : iterable) {
                maskedList.add(maskValue(item));
            }
            return maskedList;
        }
        return value;
    }

    private String maskPhones(String value) {
        Matcher matcher = PHONE_PATTERN.matcher(value);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            matcher.appendReplacement(buffer, matcher.group(1) + "-****-" + matcher.group(3));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }

    private String maskEmails(String value) {
        Matcher matcher = EMAIL_PATTERN.matcher(value);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            String local = matcher.group(1);
            String domain = matcher.group(2);
            String visible = local.substring(0, 1);
            matcher.appendReplacement(buffer, visible + "**@" + domain);
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }

    private String maskResidentIds(String value) {
        Matcher matcher = RESIDENT_ID_PATTERN.matcher(value);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            matcher.appendReplacement(buffer, matcher.group(1) + "-*******");
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }
}
