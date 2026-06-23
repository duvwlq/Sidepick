package com.failforward.backend.domain.experience.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.config.FileStorageProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ExperienceImageStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final int MAX_IMAGE_COUNT = 10;
    private static final DateTimeFormatter FILE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

    private final FileStorageProperties fileStorageProperties;

    public ExperienceImageStorageService(FileStorageProperties fileStorageProperties) {
        this.fileStorageProperties = fileStorageProperties;
    }

    public List<String> storeAll(List<MultipartFile> files, String publicBaseUrl) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("At least one experience image is required.");
        }
        if (files.size() > MAX_IMAGE_COUNT) {
            throw new BadRequestException("You can upload up to 10 experience images.");
        }

        Path rootDir = Path.of(fileStorageProperties.uploadDir()).toAbsolutePath().normalize();
        Path experienceDir = rootDir.resolve("experience").normalize();
        ensureInsideRoot(rootDir, experienceDir);

        try {
            Files.createDirectories(experienceDir);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to prepare experience image directory.", exception);
        }

        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            validate(file);
            String extension = resolveExtension(file);
            String fileName = "experience-%s-%s.%s".formatted(
                    FILE_TIME_FORMATTER.format(LocalDateTime.now()),
                    UUID.randomUUID().toString().substring(0, 8),
                    extension
            );
            Path targetFile = experienceDir.resolve(fileName).normalize();
            ensureInsideRoot(rootDir, targetFile);

            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException exception) {
                throw new IllegalStateException("Failed to store experience image.", exception);
            }

            imageUrls.add(buildPublicUrl(publicBaseUrl, fileName));
        }

        return imageUrls;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Experience image file is required.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Only jpg, png, webp, and gif images are supported.");
        }
        if (file.getSize() > fileStorageProperties.maxExperienceImageBytes()) {
            throw new BadRequestException("Experience image size exceeds the upload limit.");
        }
    }

    private String resolveExtension(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) {
            return "jpg";
        }
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> "jpg";
        };
    }

    private String buildPublicUrl(String publicBaseUrl, String fileName) {
        String baseUrl = trimTrailingSlash(publicBaseUrl);
        return baseUrl + normalizePublicPath(fileStorageProperties.publicPath()) + "/experience/" + fileName;
    }

    private void ensureInsideRoot(Path rootDir, Path target) {
        if (!target.startsWith(rootDir)) {
            throw new IllegalStateException("Resolved upload path escaped the configured root.");
        }
    }

    private String normalizePublicPath(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) {
            return "/uploads";
        }
        return publicPath.startsWith("/") ? publicPath : "/" + publicPath;
    }

    private String trimTrailingSlash(String value) {
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }
}
