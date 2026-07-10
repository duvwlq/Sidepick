const CASE_ID_TAG_PATTERN = /\s*\[case_id:\s*[^\]]+\]/gi;

export function sanitizeChatbotDisplayText(text: string) {
  return text.replace(CASE_ID_TAG_PATTERN, '').trim();
}
