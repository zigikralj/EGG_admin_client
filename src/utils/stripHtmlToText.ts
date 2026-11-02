import DOMPurify from 'dompurify';
import { cleanWordHtml } from './cleanWordHtml';

/**
 * Strips HTML tags and decodes/normalizes HTML entities (like &nbsp;, &amp;, etc.)
 * into human-readable plain text suitable for card previews and summaries.
 */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  const preCleaned = cleanWordHtml(html);
  let text = '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(preCleaned, 'text/html');

    doc.querySelectorAll('style, script, xml, noscript, meta, link').forEach((el) => {
      el.remove();
    });

    // Add spaces for breaks and block elements so words don't stick together
    doc.querySelectorAll('br').forEach((br) => {
      br.replaceWith(' ');
    });
    doc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, blockquote, ul, ol, li').forEach((el) => {
      el.append(' ');
    });

    text = doc.body.textContent || '';
  } catch {
    text = DOMPurify.sanitize(preCleaned, {
      ALLOWED_TAGS: [],
      FORBID_TAGS: ['style', 'script', 'xml', 'meta', 'link', 'title'],
      FORBID_CONTENTS: ['style', 'script', 'xml', 'meta', 'link', 'title'],
    }) as string;
  }

  return text
    .replace(/&(?:nbsp|#160|#xa0);/gi, ' ')
    .replace(/&(?:amp|#38);/gi, '&')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&(?:lt|#60);/gi, '<')
    .replace(/&(?:gt|#62);/gi, '>')
    .replace(/[\u00a0\u200B\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
