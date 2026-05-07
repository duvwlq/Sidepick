import type { Experience } from './api';

export type ExploreTag = {
  key: string;
  label: string;
  count: number;
};

type ExploreFilterMode = 'and' | 'or';

type ExperienceSearchIndex = {
  id: number;
  haystack: string;
  tagKeys: string[];
};

function normalizeText(value: string) {
  return value.trim().replaceAll('_', ' ').replace(/\s+/g, ' ').toLowerCase();
}

function buildTagKey(value: string) {
  return normalizeText(value);
}

export function formatExploreTagLabel(value: string) {
  return value.trim().replaceAll('_', ' ').replace(/\s+/g, ' ');
}

export function extractExperienceTagLabels(experience: Experience) {
  const tags = [
    experience.category.name,
    ...experience.failureReasons,
    ...experience.difficulties,
    ...(experience.analysis?.keywords ?? []),
    experience.analysis?.failureCategory ?? '',
  ]
    .map(formatExploreTagLabel)
    .filter(Boolean);

  return Array.from(new Set(tags));
}

export function extractExperienceTagKeys(experience: Experience) {
  return extractExperienceTagLabels(experience).map(buildTagKey);
}

export function buildExploreTags(experiences: Experience[]) {
  const counts = new Map<string, ExploreTag>();

  experiences.forEach((experience) => {
    extractExperienceTagLabels(experience).forEach((label) => {
      const key = buildTagKey(label);
      const current = counts.get(key);
      if (current) {
        counts.set(key, { ...current, count: current.count + 1 });
        return;
      }

      counts.set(key, { key, label, count: 1 });
    });
  });

  return Array.from(counts.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.label.localeCompare(right.label, 'ko');
  });
}

export function buildExperienceSearchIndex(experience: Experience): ExperienceSearchIndex {
  const tagLabels = extractExperienceTagLabels(experience);
  const haystack = normalizeText(
    [
      experience.title,
      experience.content,
      experience.category.name,
      ...tagLabels,
    ].join(' '),
  );

  return {
    id: experience.id,
    haystack,
    tagKeys: tagLabels.map(buildTagKey),
  };
}

export function filterExploreExperiences({
  experiences,
  query,
  selectedTags,
  mode = 'and',
}: {
  experiences: Experience[];
  query: string;
  selectedTags: string[];
  mode?: ExploreFilterMode;
}) {
  const normalizedQuery = normalizeText(query);

  return experiences.filter((experience) => {
    const searchIndex = buildExperienceSearchIndex(experience);
    const queryMatched = !normalizedQuery || searchIndex.haystack.includes(normalizedQuery);

    const tagsMatched =
      selectedTags.length === 0 ||
      (mode === 'and'
        ? selectedTags.every((tag) => searchIndex.tagKeys.includes(tag))
        : selectedTags.some((tag) => searchIndex.tagKeys.includes(tag)));

    return queryMatched && tagsMatched;
  });
}
