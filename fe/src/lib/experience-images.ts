import type { Experience } from './api';

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;
const HTML_IMAGE_PATTERN = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
const DIRECT_IMAGE_URL_PATTERN = /https?:\/\/[^\s<>"')]+?\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s<>"')]*)?/gi;

function collectUrlsFromContent(content: string) {
  const urls: string[] = [];

  for (const pattern of [MARKDOWN_IMAGE_PATTERN, HTML_IMAGE_PATTERN]) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const url = match[1]?.trim();
      if (url) {
        urls.push(url);
      }
    }
  }

  DIRECT_IMAGE_URL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(DIRECT_IMAGE_URL_PATTERN)) {
    const url = match[0]?.trim();
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

function collectUrlsFromUnknown(value: unknown, result: string[]) {
  if (!value) {
    return;
  }

  if (typeof value === 'string') {
    if (/^https?:\/\/.+\.(?:png|jpe?g|gif|webp|svg)(?:\?.*)?$/i.test(value.trim())) {
      result.push(value.trim());
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectUrlsFromUnknown(item, result));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      const loweredKey = key.toLowerCase();
      if (loweredKey.includes('image') || loweredKey.includes('img') || loweredKey.includes('photo')) {
        collectUrlsFromUnknown(nestedValue, result);
      }
    });
  }
}

export function extractExperienceImageUrls(experience: Experience) {
  const urls = [
    ...collectUrlsFromContent(experience.content),
  ];

  collectUrlsFromUnknown(experience.structuredData, urls);

  return Array.from(new Set(urls));
}

export function getExperienceImageMeta(experience: Experience) {
  const imageUrls = extractExperienceImageUrls(experience);
  return {
    imageUrls,
    imageCount: imageUrls.length,
    primaryImageUrl: imageUrls[0] ?? null,
  };
}
