package com.failforward.backend.domain.user.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.config.FileStorageProperties;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserProfileImageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final DateTimeFormatter FILE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

    private final FileStorageProperties fileStorageProperties;
    private final UserRepository userRepository;

    public String store(User user, MultipartFile file, String publicBaseUrl) {
        validate(file);

        Path rootDir = Path.of(fileStorageProperties.uploadDir()).toAbsolutePath().normalize();
        Path profileDir = rootDir.resolve("profile").normalize();
        ensureInsideRoot(rootDir, profileDir);

        String extension = resolveExtension(file);
        String fileName = "user-%d-%s.%s".formatted(
                user.getId(),
                FILE_TIME_FORMATTER.format(LocalDateTime.now()),
                extension
        );
        Path targetFile = profileDir.resolve(fileName).normalize();
        ensureInsideRoot(rootDir, targetFile);

        try {
            Files.createDirectories(profileDir);
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to store profile image.", exception);
        }

        deletePreviousImageIfManaged(user.getProfileImage(), rootDir, publicBaseUrl);

        String imageUrl = buildPublicUrl(publicBaseUrl, fileName);
        user.updateProfileImage(imageUrl);
        userRepository.save(user);
        return imageUrl;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Profile image file is required.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Only jpg, png, webp, and gif images are supported.");
        }
        if (file.getSize() > fileStorageProperties.maxProfileImageBytes()) {
            throw new BadRequestException("Profile image size exceeds the upload limit.");
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
        return baseUrl + normalizePublicPath(fileStorageProperties.publicPath()) + "/profile/" + fileName;
    }

    private void deletePreviousImageIfManaged(String previousImageUrl, Path rootDir, String publicBaseUrl) {
        if (previousImageUrl == null || previousImageUrl.isBlank()) {
            return;
        }

        String managedPrefix = trimTrailingSlash(publicBaseUrl)
                + normalizePublicPath(fileStorageProperties.publicPath())
                + "/profile/";
        if (!previousImageUrl.startsWith(managedPrefix)) {
            return;
        }

        String fileName = previousImageUrl.substring(managedPrefix.length()).trim();
        if (fileName.isBlank()) {
            return;
        }

        Path previousFile = rootDir.resolve("profile").resolve(fileName).normalize();
        ensureInsideRoot(rootDir, previousFile);
        try {
            Files.deleteIfExists(previousFile);
        } catch (IOException ignored) {
            // Best-effort cleanup only.
        }
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
