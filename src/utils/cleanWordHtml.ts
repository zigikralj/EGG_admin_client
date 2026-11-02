import DOMPurify from 'dompurify';

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const DOMPURIFY_CONFIG = {
  ADD_TAGS: ['span'],
  ADD_ATTR: ['contenteditable', 'data-user-id', 'data-user-name', 'target', 'style', 'color'],
  ALLOW_DATA_ATTR: true,
};

/**
 * Strips Microsoft Word and Office specific metadata, XML blocks, conditional comments,
 * and style tags to prevent raw XML and style definitions from polluting notes.
 * Uses a robust HTML parser (DOMPurify) rather than vulnerable regexes.
 */
export function cleanWordHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'script', 'xml', 'meta', 'link', 'title'],
    FORBID_CONTENTS: ['style', 'script', 'xml', 'meta', 'link', 'title'],
    ADD_TAGS: ['span'],
    ADD_ATTR: ['contenteditable', 'data-user-id', 'data-user-name', 'target', 'style', 'color'],
    ALLOW_DATA_ATTR: true,
  }) as string;
}

/**
 * Sanitizes HTML strings for safe rendering via dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  const preCleaned = cleanWordHtml(html);
  return DOMPurify.sanitize(preCleaned, DOMPURIFY_CONFIG) as string;
}
