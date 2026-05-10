package com.failforward.backend.domain.experience.importer;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.experience-import")
public class ExperienceImportProperties {

    private boolean enabled;
    private String csvPath;
    private boolean preserveIds = true;
    private boolean overwriteExisting = true;
    private boolean importAnalysis = true;
    private ReplaceMode replaceMode = ReplaceMode.UPSERT_ONLY;
    private AuthorMode authorMode = AuthorMode.SYSTEM;
    private String systemEmail = "imported-cases@sidepick.local";
    private String systemNickname = "sidepick-import";
    private String pseudoEmailDomain = "sidepick.local";
    private TitleMode titleMode = TitleMode.SUMMARY;
    private CreatedAtMode createdAtMode = CreatedAtMode.RANDOM_DISTRIBUTED;
    private LocalDateTime createdAtStart = LocalDateTime.of(2025, 1, 1, 0, 0);
    private LocalDateTime createdAtEnd = LocalDateTime.of(2026, 4, 30, 23, 59, 59);
    private String defaultAgeGroup = "30s";
    private String defaultRiskLevel = "MEDIUM";
    private long defaultCategoryId = 5L;
    private Map<String, Long> categoryMap = new LinkedHashMap<>();

    public enum AuthorMode {
        SYSTEM,
        PSEUDO_RANDOM
    }

    public enum ReplaceMode {
        UPSERT_ONLY,
        DELETE_IMPORTED_THEN_IMPORT
    }

    public enum TitleMode {
        SUMMARY,
        CONTENT_PREFIX,
        GENERATED
    }

    public enum CreatedAtMode {
        RANDOM_DISTRIBUTED,
        SEQUENTIAL_DISTRIBUTED,
        FIXED_START,
        FIXED_END,
        NOW
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getCsvPath() {
        return csvPath;
    }

    public void setCsvPath(String csvPath) {
        this.csvPath = csvPath;
    }

    public boolean isPreserveIds() {
        return preserveIds;
    }

    public void setPreserveIds(boolean preserveIds) {
        this.preserveIds = preserveIds;
    }

    public boolean isOverwriteExisting() {
        return overwriteExisting;
    }

    public void setOverwriteExisting(boolean overwriteExisting) {
        this.overwriteExisting = overwriteExisting;
    }

    public boolean isImportAnalysis() {
        return importAnalysis;
    }

    public void setImportAnalysis(boolean importAnalysis) {
        this.importAnalysis = importAnalysis;
    }

    public ReplaceMode getReplaceMode() {
        return replaceMode;
    }

    public void setReplaceMode(ReplaceMode replaceMode) {
        this.replaceMode = replaceMode;
    }

    public AuthorMode getAuthorMode() {
        return authorMode;
    }

    public void setAuthorMode(AuthorMode authorMode) {
        this.authorMode = authorMode;
    }

    public String getSystemEmail() {
        return systemEmail;
    }

    public void setSystemEmail(String systemEmail) {
        this.systemEmail = systemEmail;
    }

    public String getSystemNickname() {
        return systemNickname;
    }

    public void setSystemNickname(String systemNickname) {
        this.systemNickname = systemNickname;
    }

    public String getPseudoEmailDomain() {
        return pseudoEmailDomain;
    }

    public void setPseudoEmailDomain(String pseudoEmailDomain) {
        this.pseudoEmailDomain = pseudoEmailDomain;
    }

    public TitleMode getTitleMode() {
        return titleMode;
    }

    public void setTitleMode(TitleMode titleMode) {
        this.titleMode = titleMode;
    }

    public CreatedAtMode getCreatedAtMode() {
        return createdAtMode;
    }

    public void setCreatedAtMode(CreatedAtMode createdAtMode) {
        this.createdAtMode = createdAtMode;
    }

    public LocalDateTime getCreatedAtStart() {
        return createdAtStart;
    }

    public void setCreatedAtStart(LocalDateTime createdAtStart) {
        this.createdAtStart = createdAtStart;
    }

    public LocalDateTime getCreatedAtEnd() {
        return createdAtEnd;
    }

    public void setCreatedAtEnd(LocalDateTime createdAtEnd) {
        this.createdAtEnd = createdAtEnd;
    }

    public String getDefaultAgeGroup() {
        return defaultAgeGroup;
    }

    public void setDefaultAgeGroup(String defaultAgeGroup) {
        this.defaultAgeGroup = defaultAgeGroup;
    }

    public String getDefaultRiskLevel() {
        return defaultRiskLevel;
    }

    public void setDefaultRiskLevel(String defaultRiskLevel) {
        this.defaultRiskLevel = defaultRiskLevel;
    }

    public long getDefaultCategoryId() {
        return defaultCategoryId;
    }

    public void setDefaultCategoryId(long defaultCategoryId) {
        this.defaultCategoryId = defaultCategoryId;
    }

    public Map<String, Long> getCategoryMap() {
        return categoryMap;
    }

    public void setCategoryMap(Map<String, Long> categoryMap) {
        this.categoryMap = categoryMap;
    }
}
