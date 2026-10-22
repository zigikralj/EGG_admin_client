import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import {
  Box,
  Paper,
  IconButton,
  Button,
  CircularProgress,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Typography,
  Popper,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Fade,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';

import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types';
import {
  FormatBoldIcon,
  FormatItalicIcon,
  FormatUnderlinedIcon,
  StrikethroughSIcon,
  FormatListBulletedIcon,
  FormatListNumberedIcon,
  FormatQuoteIcon,
  TitleIcon,
  FormatClearIcon,
  FormatColorTextIcon,
  UndoIcon,
  RedoIcon,
  ArrowDropDownIcon,
  AlternateEmailIcon,
  CheckCircleIcon,
  ErrorIcon,
  CodeIcon,
  TextFieldsIcon,
  EditNoteIcon,
  AutoFixHighIcon,
} from '../icons';

const COLOR_PALETTE = [
  { label: 'Black', value: '#000000' },
  { label: 'Dark Slate', value: '#1e293b' },
  { label: 'Slate Gray', value: '#64748b' },
  { label: 'Light Gray', value: '#94a3b8' },
  { label: 'White', value: '#ffffff' },
  { label: 'Forest Green', value: '#1b5e20' },
  { label: 'Primary Green', value: '#2e7d32' },
  { label: 'Emerald Green', value: '#16a34a' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Sky Blue', value: '#0288d1' },
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Amber / Orange', value: '#ed6c02' },
  { label: 'Red / Error', value: '#d32f2f' },
  { label: 'Rose Pink', value: '#e11d48' },
];

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  const preCleaned = cleanWordHtml(html);
  return DOMPurify.sanitize(preCleaned, DOMPURIFY_CONFIG) as string;
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const preCleaned = cleanWordHtml(html);
  const sanitizedHtml = DOMPurify.sanitize(preCleaned, DOMPURIFY_CONFIG) as string;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedHtml, 'text/html');

    doc.querySelectorAll('style, script, xml, noscript, meta, link').forEach((el) => {
      el.remove();
    });

    // Replace <br> with newlines
    doc.querySelectorAll('br').forEach((br) => {
      br.replaceWith('\n');
    });

    // Handle list items
    doc.querySelectorAll('li').forEach((li) => {
      li.prepend(document.createTextNode('• '));
      li.append('\n');
    });

    // Handle block elements by appending a newline
    const blocks = doc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, blockquote, ul, ol');
    blocks.forEach((el) => {
      el.append('\n');
    });

    const text = (doc.body.textContent || '')
      .replace(/&(?:nbsp|#160|#xa0);/gi, ' ')
      .replace(/[\u00a0\u200B\uFEFF]/g, ' ');
    return text.replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    const fallbackText = DOMPurify.sanitize(sanitizedHtml, {
      ALLOWED_TAGS: [],
      FORBID_TAGS: ['style', 'script', 'xml', 'meta', 'link', 'title'],
      FORBID_CONTENTS: ['style', 'script', 'xml', 'meta', 'link', 'title'],
    }) as string;
    return fallbackText
      .replace(/&(?:nbsp|#160|#xa0);/gi, ' ')
      .replace(/[\u00a0\u200B\uFEFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

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

export function plainTextToHtml(plain: string, users: User[] = []): string {
  if (!plain || !plain.trim()) return '';
  const lines = plain.split(/\r?\n/);
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      paragraphs.push(`<p>${currentParagraph.join('<br>')}</p>`);
      currentParagraph = [];
    }
  };

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      flushParagraph();
    } else {
      let escaped = escapeHtml(rawLine);

      if (users && users.length > 0) {
        for (const u of users) {
          if (u.name) {
            const escapedUserName = escapeHtml(u.name);
            const pattern = new RegExp(`@${escapeRegex(escapedUserName)}\\b`, 'gi');
            escaped = escaped.replace(
              pattern,
              `<span class="mention-tag" data-user-id="${escapeHtml(String(u.id))}" data-user-name="${escapedUserName}" contenteditable="false">@${escapedUserName}</span>`
            );
          }
        }
      }

      currentParagraph.push(escaped);
    }
  }
  flushParagraph();

  return sanitizeHtml(paragraphs.join(''));
}

export function formatHtml(html: string): string {
  if (!html || !html.trim()) return '';

  const sanitizedHtml = DOMPurify.sanitize(html, DOMPURIFY_CONFIG) as string;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedHtml, 'text/html');
    const root = doc.body;

    const blockTags = new Set([
      'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'table', 'thead',
      'tbody', 'tr', 'td', 'th', 'section', 'article', 'pre', 'hr'
    ]);

    function serializeNode(node: Node, indentLevel: number): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return escapeHtml(node.textContent || '');
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        const indent = '  '.repeat(indentLevel);

        let openTag = `<${tagName}`;
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          openTag += ` ${attr.name}="${escapeHtml(attr.value)}"`;
        }

        if (['br', 'hr', 'img', 'input'].includes(tagName)) {
          return `${openTag}>`;
        }

        openTag += '>';
        const closeTag = `</${tagName}>`;

        const hasBlockChildren = Array.from(el.childNodes).some(
          (child) => child.nodeType === Node.ELEMENT_NODE && blockTags.has((child as HTMLElement).tagName.toLowerCase())
        );

        if (hasBlockChildren) {
          const childrenStr = Array.from(el.childNodes)
            .map((child) => {
              if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) {
                return '';
              }
              const childFormatted = serializeNode(child, indentLevel + 1);
              return childFormatted ? `\n${'  '.repeat(indentLevel + 1)}${childFormatted}` : '';
            })
            .filter(Boolean)
            .join('');
          return `${openTag}${childrenStr}\n${indent}${closeTag}`;
        } else {
          const inlineChildren = Array.from(el.childNodes)
            .map((child) => serializeNode(child, indentLevel))
            .join('');
          return `${openTag}${inlineChildren}${closeTag}`;
        }
      }

      return '';
    }

    const formattedBlocks = Array.from(root.childNodes)
      .map((node) => {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
          return '';
        }
        return serializeNode(node, 0);
      })
      .filter(Boolean)
      .join('\n');

    return formattedBlocks || sanitizedHtml;
  } catch {
    return sanitizedHtml;
  }
}

export type EditorMode = 'rich' | 'plain' | 'html';

export interface AutoSaveConfig {
  onSave: (value: string) => Promise<any>;
  delay?: number;
  enabled?: boolean;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: number | string;
  readOnly?: boolean;
  disabled?: boolean;
  users?: User[];
  autoSave?: AutoSaveConfig;
  defaultMode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = 160,
  readOnly = false,
  disabled = false,
  users: propUsers,
  autoSave,
  defaultMode = 'rich',
  onModeChange,
}) => {
  const { t } = useLanguage();
  const auth = useAuth();
  const availableUsers = propUsers || auth.users || [];

  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);
  const isMountedRef = useRef(false);

  // Editor View Mode State
  const [editorMode, setEditorMode] = useState<EditorMode>(defaultMode);
  const [plainText, setPlainText] = useState<string>(() => htmlToPlainText(value));
  const [htmlSource, setHtmlSource] = useState<string>(() => formatHtml(value || ''));
  const [isPlainModified, setIsPlainModified] = useState(false);
  const originalHtmlRef = useRef<string>(value || '');

  // Auto-save State & Refs
  const autoSaveEnabled = !readOnly && !disabled && Boolean(autoSave && autoSave.enabled !== false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const valueRef = useRef(value);
  const lastSavedRef = useRef(value);
  const inFlightSaveValRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const autoSaveRef = useRef(autoSave);
  autoSaveRef.current = autoSave;

  const triggerSave = useCallback(async (valToSave: string) => {
    if (!autoSaveRef.current?.onSave) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }

    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    if ((valToSave || '') === (lastSavedRef.current || '')) {
      return;
    }

    isSavingRef.current = true;
    inFlightSaveValRef.current = valToSave;
    setSaveStatus('saving');

    try {
      const res = await autoSaveRef.current.onSave(valToSave);
      if (res && typeof res === 'object' && res.success === false) {
        setSaveStatus('error');
      } else {
        lastSavedRef.current = valToSave;
        if ((valueRef.current || '') !== (valToSave || '')) {
          pendingSaveRef.current = true;
        } else {
          setSaveStatus('saved');
          if (savedTimeoutRef.current) {
            clearTimeout(savedTimeoutRef.current);
          }
          savedTimeoutRef.current = setTimeout(() => {
            setSaveStatus('idle');
          }, 2500);
        }
      }
    } catch {
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
      inFlightSaveValRef.current = null;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        triggerSave(valueRef.current);
      }
    }
  }, []);

  const notifyChange = useCallback((newHtml: string) => {
    isInternalChangeRef.current = true;
    onChange(newHtml);
    valueRef.current = newHtml;

    if (autoSaveEnabled && autoSaveRef.current?.onSave) {
      if ((newHtml || '') !== (lastSavedRef.current || '')) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        const delay = autoSaveRef.current.delay ?? 3500;
        saveTimeoutRef.current = setTimeout(() => {
          triggerSave(valueRef.current);
        }, delay);
      }
    }
  }, [onChange, autoSaveEnabled, triggerSave]);

  // Formatting active states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  const [headingAnchorEl, setHeadingAnchorEl] = useState<null | HTMLElement>(null);
  const [colorAnchorEl, setColorAnchorEl] = useState<null | HTMLElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value || value === '<p><br></p>' || value === '<br>');

  // Mention State
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionAnchorEl, setMentionAnchorEl] = useState<HTMLElement | null>(null);
  const mentionRangeRef = useRef<Range | null>(null);

  const filteredUsers = useMemo(() => {
    const q = mentionQuery.toLowerCase().trim();
    return availableUsers.filter((u) => {
      if (u.status === 'BLOCKED') return false;
      if (!q) return true;
      const nameMatch = u.name.toLowerCase().includes(q);
      const emailMatch = u.email ? u.email.toLowerCase().includes(q) : false;
      const roleMatch = u.role ? u.role.toLowerCase().includes(q) : false;
      return nameMatch || emailMatch || roleMatch;
    }).slice(0, 8);
  }, [availableUsers, mentionQuery]);

  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current || readOnly || disabled) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // ignore
    }
  }, [readOnly, disabled]);

  // Check for @ mentions in current caret position
  const checkForMention = useCallback(() => {
    if (readOnly || disabled || !editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setMentionOpen(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (!editorRef.current.contains(node)) {
      setMentionOpen(false);
      return;
    }

    // Only process text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const caretPos = range.startOffset;
      const textBeforeCaret = text.slice(0, caretPos);
      const lastAtIndex = textBeforeCaret.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const query = textBeforeCaret.slice(lastAtIndex + 1);
        // Ensure no whitespace in query and that @ is either at start or after whitespace/boundary
        const charBeforeAt = lastAtIndex > 0 ? textBeforeCaret[lastAtIndex - 1] : ' ';
        if (!/\s/.test(query) && (/\s/.test(charBeforeAt) || lastAtIndex === 0)) {
          // Save range for replacement
          const mentionRange = document.createRange();
          mentionRange.setStart(node, lastAtIndex);
          mentionRange.setEnd(node, caretPos);
          mentionRangeRef.current = mentionRange;

          setMentionQuery(query);
          setMentionIndex(0);
          setMentionAnchorEl(editorRef.current);
          setMentionOpen(true);
          return;
        }
      }
    }

    setMentionOpen(false);
  }, [readOnly, disabled]);

  // Insert Mention
  const insertMention = useCallback((user: User) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    let range = mentionRangeRef.current;

    if (!range && selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }

    if (range) {
      range.deleteContents();

      // Create mention span
      const mentionSpan = document.createElement('span');
      mentionSpan.className = 'mention-tag';
      mentionSpan.setAttribute('data-user-id', user.id);
      mentionSpan.setAttribute('data-user-name', user.name);
      mentionSpan.setAttribute('contenteditable', 'false');
      mentionSpan.textContent = `@${user.name}`;

      // Style mention span
      mentionSpan.style.backgroundColor = 'rgba(25, 118, 210, 0.12)';
      mentionSpan.style.color = '#1976d2';
      mentionSpan.style.padding = '2px 6px';
      mentionSpan.style.borderRadius = '4px';
      mentionSpan.style.fontWeight = '600';
      mentionSpan.style.display = 'inline-flex';
      mentionSpan.style.alignItems = 'center';
      mentionSpan.style.margin = '0 2px';
      mentionSpan.style.userSelect = 'all';

      const spaceNode = document.createTextNode(' ');

      range.insertNode(spaceNode);
      range.insertNode(mentionSpan);

      // Move cursor after space
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.setEndAfter(spaceNode);

      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }

    setMentionOpen(false);
    mentionRangeRef.current = null;

    // Trigger input change
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || '';
      const empty = !textContent.trim() && !editorRef.current.querySelector('img, hr, iframe, ul, ol');
      setIsEmpty(empty);
      notifyChange(empty ? '' : html);
    }
  }, [notifyChange]);

  // Sync external value changes to editor DOM and mode states
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      if (editorRef.current) {
        editorRef.current.innerHTML = sanitizeHtml(value || '');
        const textContent = editorRef.current.textContent || '';
        setIsEmpty(!textContent.trim() && !editorRef.current.querySelector('img, hr, iframe'));
      }
      return;
    }

    // If incoming prop is identical to what we have locally or matches what's currently in flight, ignore it
    if (value === valueRef.current || (inFlightSaveValRef.current !== null && value === inFlightSaveValRef.current)) {
      return;
    }

    // If local content has unsaved modifications and incoming prop is our last saved snapshot, ignore the echo
    if (
      (valueRef.current || '') !== (lastSavedRef.current || '') &&
      (value || '') === (lastSavedRef.current || '')
    ) {
      return;
    }

    // If auto-save is currently saving or pending and incoming prop is an echo of either in-flight or last-saved
    if (
      (isSavingRef.current || pendingSaveRef.current || saveTimeoutRef.current !== null) &&
      (value === lastSavedRef.current || value === inFlightSaveValRef.current)
    ) {
      return;
    }

    if (editorRef.current) {
      if (isInternalChangeRef.current) {
        isInternalChangeRef.current = false;
        return;
      }
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== value) {
        editorRef.current.innerHTML = sanitizeHtml(value || '');
        const textContent = editorRef.current.textContent || '';
        setIsEmpty(!textContent.trim() && !editorRef.current.querySelector('img, hr, iframe'));
      }
    }
    if (!isInternalChangeRef.current) {
      valueRef.current = value;
      setHtmlSource(formatHtml(value || ''));
      setPlainText(htmlToPlainText(value || ''));
      originalHtmlRef.current = value || '';
      setIsPlainModified(false);
      lastSavedRef.current = value || '';
      setSaveStatus('idle');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    }
  }, [value]);

  const handleModeChange = useCallback((newMode: EditorMode) => {
    if (newMode === editorMode) return;

    if (editorMode === 'rich') {
      const currentHtml = (editorRef.current && editorRef.current.innerHTML) ? editorRef.current.innerHTML : (valueRef.current || value || '');
      if (newMode === 'plain') {
        originalHtmlRef.current = currentHtml;
        setIsPlainModified(false);
        const converted = htmlToPlainText(currentHtml);
        setPlainText(converted);
        setIsEmpty(!converted.trim());
      } else if (newMode === 'html') {
        const formatted = formatHtml(currentHtml);
        setHtmlSource(formatted);
        setIsEmpty(!formatted.trim());
      }
    } else if (editorMode === 'plain') {
      if (newMode === 'rich') {
        if (isPlainModified) {
          const convertedHtml = plainTextToHtml(plainText, availableUsers);
          valueRef.current = convertedHtml;
          notifyChange(convertedHtml);
          if (editorRef.current) {
            editorRef.current.innerHTML = sanitizeHtml(convertedHtml);
          }
          setIsEmpty(!convertedHtml.trim());
        } else {
          valueRef.current = originalHtmlRef.current;
          if (editorRef.current) {
            editorRef.current.innerHTML = sanitizeHtml(originalHtmlRef.current);
          }
          setIsEmpty(!originalHtmlRef.current.trim());
        }
      } else if (newMode === 'html') {
        const convertedHtml = isPlainModified
          ? plainTextToHtml(plainText, availableUsers)
          : originalHtmlRef.current;
        const formatted = formatHtml(convertedHtml);
        setHtmlSource(formatted);
        valueRef.current = convertedHtml;
        if (isPlainModified) {
          notifyChange(convertedHtml);
        }
        setIsEmpty(!formatted.trim());
      }
    } else if (editorMode === 'html') {
      const sanitizedSource = sanitizeHtml(htmlSource);
      valueRef.current = sanitizedSource;
      notifyChange(sanitizedSource);
      if (newMode === 'rich') {
        if (editorRef.current) {
          editorRef.current.innerHTML = sanitizedSource;
        }
        setIsEmpty(!sanitizedSource.trim());
      } else if (newMode === 'plain') {
        originalHtmlRef.current = sanitizedSource;
        setIsPlainModified(false);
        const converted = htmlToPlainText(sanitizedSource);
        setPlainText(converted);
        setIsEmpty(!converted.trim());
      }
    }

    setEditorMode(newMode);
    onModeChange?.(newMode);
  }, [editorMode, plainText, htmlSource, isPlainModified, availableUsers, notifyChange, onModeChange]);

  const handleFormatHtml = useCallback(() => {
    const formatted = formatHtml(htmlSource);
    setHtmlSource(formatted);
    notifyChange(formatted);
  }, [htmlSource, notifyChange]);

  const handlePlainTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPlain = e.target.value;
    setPlainText(newPlain);
    setIsPlainModified(true);
    const convertedHtml = plainTextToHtml(newPlain, availableUsers);
    setHtmlSource(convertedHtml);
    setIsEmpty(!newPlain.trim());
    notifyChange(convertedHtml);
  }, [availableUsers, notifyChange]);

  const handleHtmlSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setHtmlSource(newHtml);
    setIsEmpty(!newHtml.trim());
    notifyChange(newHtml);
  }, [notifyChange]);

  // Flush on unmount if pending changes exist
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (autoSaveEnabled && (valueRef.current || '') !== (lastSavedRef.current || '')) {
        autoSaveRef.current?.onSave(valueRef.current);
      }
    };
  }, [autoSaveEnabled]);

  // Listen for selection changes inside editor
  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current) {
        updateActiveFormats();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateActiveFormats]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const textContent = editorRef.current.textContent || '';
    const empty = !textContent.trim() && !editorRef.current.querySelector('img, hr, iframe, ul, ol');
    setIsEmpty(empty);

    notifyChange(empty ? '' : html);
    updateActiveFormats();
    checkForMention();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mentionOpen && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }
  };

  const exec = (command: string, val: string | null = null) => {
    if (readOnly || disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val ?? undefined);
    handleInput();
    updateActiveFormats();
  };

  const handleHeadingSelect = (tag: string) => {
    setHeadingAnchorEl(null);
    if (tag === 'p') {
      exec('formatBlock', '<p>');
    } else {
      exec('formatBlock', `<${tag}>`);
    }
  };

  const handleMentionButtonClick = () => {
    if (readOnly || disabled || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertText', false, '@');
    handleInput();
  };

  const handleOpenColorMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (readOnly || disabled) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
    setColorAnchorEl(e.currentTarget);
  };

  const restoreSavedSelection = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  const clearColorInSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      document.execCommand('foreColor', false, 'inherit');
      return;
    }

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const root = container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement;

    if (root && editorRef.current.contains(root)) {
      // Walk up ancestors within editor to remove hardcoded inline color
      let ancestor: HTMLElement | null = root;
      while (ancestor && ancestor !== editorRef.current) {
        if (ancestor.style && ancestor.style.color) {
          ancestor.style.color = '';
          if (!ancestor.getAttribute('style') || ancestor.style.cssText.trim() === '') {
            ancestor.removeAttribute('style');
          }
        }
        ancestor = ancestor.parentElement;
      }

      // Check all elements within selection
      const elementsToClean: HTMLElement[] = [];
      if (root !== editorRef.current) {
        elementsToClean.push(root);
      }
      root.querySelectorAll('*').forEach((el) => {
        if (sel.containsNode(el, true) || (range.intersectsNode && range.intersectsNode(el))) {
          elementsToClean.push(el as HTMLElement);
        }
      });

      elementsToClean.forEach((el) => {
        if (el.style && el.style.color) {
          el.style.color = '';
          if (!el.getAttribute('style') || el.style.cssText.trim() === '') {
            el.removeAttribute('style');
          }
        }
        if (el.tagName.toLowerCase() === 'font' && el.hasAttribute('color')) {
          el.removeAttribute('color');
        }
      });
    }

    document.execCommand('foreColor', false, 'inherit');
  };

  const handleApplyColor = (color: string | null) => {
    restoreSavedSelection();
    if (color === null) {
      clearColorInSelection();
    } else {
      document.execCommand('foreColor', false, color);
    }
    handleInput();
    setColorAnchorEl(null);
  };

  const handleClearFormat = () => {
    if (readOnly || disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    clearColorInSelection();
    exec('removeFormat');
    exec('formatBlock', '<p>');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const html = e.clipboardData.getData('text/html');
    if (!html) return;

    try {
      const isWordHtml =
        /<!--\[if/i.test(html) ||
        /<xml/i.test(html) ||
        /mso-/i.test(html) ||
        /MsoNormal/i.test(html) ||
        /urn:schemas-microsoft-com/i.test(html);

      const cleanedHtml = cleanWordHtml(html);
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanedHtml, 'text/html');
      let modified = isWordHtml;

      doc.body.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
          const color = htmlEl.style.color?.toLowerCase().replace(/\s+/g, '');
          if (
            color === '#fff' ||
            color === '#ffffff' ||
            color === 'white' ||
            color === 'rgb(248,250,252)' ||
            color === 'rgb(255,255,255)' ||
            color === 'rgb(241,245,249)' ||
            color === 'rgb(226,232,240)'
          ) {
            htmlEl.style.color = '';
            modified = true;
          }
          const bg = htmlEl.style.backgroundColor?.toLowerCase().replace(/\s+/g, '');
          if (
            bg === '#1e293b' ||
            bg === 'rgb(30,41,59)' ||
            bg === 'rgb(15,23,42)' ||
            bg === 'rgba(0,0,0,0)' ||
            bg === 'transparent'
          ) {
            htmlEl.style.backgroundColor = '';
            modified = true;
          }
          if (!htmlEl.getAttribute('style') || htmlEl.style.cssText.trim() === '') {
            htmlEl.removeAttribute('style');
          }
        }
        if (htmlEl.tagName.toLowerCase() === 'font') {
          const fontColor = htmlEl.getAttribute('color')?.toLowerCase();
          if (fontColor === '#fff' || fontColor === '#ffffff' || fontColor === 'white') {
            htmlEl.removeAttribute('color');
            modified = true;
          }
        }
      });

      if (modified) {
        e.preventDefault();
        const sanitized = sanitizeHtml(doc.body.innerHTML);
        document.execCommand('insertHTML', false, sanitized);
        handleInput();
      }
    } catch {
      // ignore
    }
  };

  return (
    <Paper
      variant="outlined"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          if (autoSaveEnabled && (valueRef.current || '') !== (lastSavedRef.current || '')) {
            triggerSave(valueRef.current);
          }
          onBlur?.();
        }
      }}
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'border-color 0.2s ease',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
        },
      }}
    >
      {/* TOOLBAR */}
      {!readOnly && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
            p: 0.75,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
          }}
        >
          {/* TEXT FORMATTING */}
          <Tooltip title={t('editorBold')} arrow>
            <IconButton
              size="small"
              color={activeFormats.bold ? 'primary' : 'default'}
              onClick={() => exec('bold')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.bold ? 'action.selected' : 'transparent',
              }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorItalic')} arrow>
            <IconButton
              size="small"
              color={activeFormats.italic ? 'primary' : 'default'}
              onClick={() => exec('italic')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.italic ? 'action.selected' : 'transparent',
              }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorUnderline')} arrow>
            <IconButton
              size="small"
              color={activeFormats.underline ? 'primary' : 'default'}
              onClick={() => exec('underline')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.underline ? 'action.selected' : 'transparent',
              }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorStrikethrough')} arrow>
            <IconButton
              size="small"
              color={activeFormats.strikeThrough ? 'primary' : 'default'}
              onClick={() => exec('strikeThrough')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.strikeThrough ? 'action.selected' : 'transparent',
              }}
            >
              <StrikethroughSIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* LISTS */}
          <Tooltip title={t('editorBulletList')} arrow>
            <IconButton
              size="small"
              color={activeFormats.insertUnorderedList ? 'primary' : 'default'}
              onClick={() => exec('insertUnorderedList')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.insertUnorderedList ? 'action.selected' : 'transparent',
              }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorNumberedList')} arrow>
            <IconButton
              size="small"
              color={activeFormats.insertOrderedList ? 'primary' : 'default'}
              onClick={() => exec('insertOrderedList')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{
                borderRadius: 1,
                bgcolor: activeFormats.insertOrderedList ? 'action.selected' : 'transparent',
              }}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* MENTION USER BUTTON */}
          <Tooltip title={t('editorMentionUser')} arrow>
            <IconButton
              size="small"
              color="primary"
              onClick={handleMentionButtonClick}
              disabled={disabled || editorMode !== 'rich'}
              sx={{
                borderRadius: 1,
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.18)',
                },
              }}
            >
              <AlternateEmailIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* HEADINGS / BLOCK FORMATS */}
          <Tooltip title={t('editorHeading')} arrow>
            <IconButton
              size="small"
              onClick={(e) => setHeadingAnchorEl(e.currentTarget)}
              disabled={disabled || editorMode !== 'rich'}
              sx={{ borderRadius: 1, display: 'flex', alignItems: 'center', px: 0.75 }}
            >
              <TitleIcon fontSize="small" />
              <ArrowDropDownIcon sx={{ fontSize: '1rem', ml: -0.25 }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={headingAnchorEl}
            open={Boolean(headingAnchorEl)}
            onClose={() => setHeadingAnchorEl(null)}
            slotProps={{ paper: { sx: { minWidth: 150 } } }}
          >
            <MenuItem onClick={() => handleHeadingSelect('h3')}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('editorHeading')} 1
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => handleHeadingSelect('h4')}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t('editorHeading')} 2
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => handleHeadingSelect('p')}>
              <Typography variant="body2">{t('editorParagraph')}</Typography>
            </MenuItem>
          </Menu>

          <Tooltip title={t('editorQuote')} arrow>
            <IconButton
              size="small"
              onClick={() => exec('formatBlock', '<blockquote>')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{ borderRadius: 1 }}
            >
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* TEXT COLOR BUTTON */}
          <Tooltip title={t('editorTextColor')} arrow>
            <IconButton
              size="small"
              color={Boolean(colorAnchorEl) ? 'primary' : 'default'}
              onClick={handleOpenColorMenu}
              disabled={disabled || editorMode !== 'rich'}
              sx={{
                borderRadius: 1,
                bgcolor: Boolean(colorAnchorEl) ? 'action.selected' : 'transparent',
              }}
            >
              <FormatColorTextIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={colorAnchorEl}
            open={Boolean(colorAnchorEl)}
            onClose={() => setColorAnchorEl(null)}
            slotProps={{
              paper: {
                sx: {
                  p: 1.5,
                  minWidth: 200,
                  maxWidth: 240,
                  borderRadius: 2,
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.5)'
                      : '0 8px 24px rgba(0,0,0,0.12)',
                },
              },
            }}
          >
            <MenuItem
              onClick={() => handleApplyColor(null)}
              sx={{
                borderRadius: 1,
                py: 0.75,
                px: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                mb: 0.75,
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '2px dashed',
                  borderColor: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                }}
              >
                A
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t('editorDefaultColor')}
              </Typography>
            </MenuItem>

            <Divider sx={{ my: 0.75 }} />

            <Typography
              variant="caption"
              sx={{ px: 0.5, fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}
            >
              {t('editorTextColor')}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 1,
                p: 0.5,
              }}
            >
              {COLOR_PALETTE.map((c) => (
                <Tooltip key={c.value} title={c.label} arrow>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => handleApplyColor(c.value)}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: c.value,
                      border: '1.5px solid',
                      borderColor: (theme) =>
                        c.value.toLowerCase() === '#ffffff'
                          ? theme.palette.divider
                          : 'transparent',
                      cursor: 'pointer',
                      p: 0,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      outline: 'none',
                      '&:hover': {
                        transform: 'scale(1.2)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        borderColor: 'primary.main',
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 0.5,
                pt: 0.25,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                {t('editorCustomColor')}
              </Typography>
              <Box
                component="input"
                type="color"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleApplyColor(e.target.value);
                }}
                sx={{
                  width: 28,
                  height: 28,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 0.25,
                  cursor: 'pointer',
                  bgcolor: 'background.paper',
                }}
              />
            </Box>
          </Menu>

          <Tooltip title={t('editorClearFormat')} arrow>
            <IconButton
              size="small"
              onClick={handleClearFormat}
              disabled={disabled || editorMode !== 'rich'}
              sx={{ borderRadius: 1 }}
            >
              <FormatClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* UNDO / REDO */}
          <Tooltip title={t('editorUndo')} arrow>
            <IconButton
              size="small"
              onClick={() => exec('undo')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{ borderRadius: 1 }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('editorRedo')} arrow>
            <IconButton
              size="small"
              onClick={() => exec('redo')}
              disabled={disabled || editorMode !== 'rich'}
              sx={{ borderRadius: 1 }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          {/* VIEW MODE SWITCHER (ICONS ONLY NEXT TO OTHER COMMANDS) */}
          <ToggleButtonGroup
            size="small"
            value={editorMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode) handleModeChange(newMode);
            }}
            aria-label="editor mode"
            sx={{
              height: 28,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              p: '2px',
              borderRadius: 1.25,
              border: '1px solid',
              borderColor: 'divider',
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
                borderRadius: 1,
                p: '3px 6px',
                minWidth: 28,
                height: 24,
                color: 'text.secondary',
                transition: 'all 0.15s ease',
                '&.Mui-selected': {
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 1px 3px rgba(0,0,0,0.4)'
                      : '0 1px 3px rgba(0,0,0,0.1)',
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              },
            }}
          >
            <ToggleButton value="rich" aria-label={t('editorModeRich')}>
              <Tooltip title={t('editorModeRich')} arrow>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EditNoteIcon fontSize="small" />
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="plain" aria-label={t('editorModePlain')}>
              <Tooltip title={t('editorModePlain')} arrow>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TextFieldsIcon fontSize="small" />
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="html" aria-label={t('editorModeHtml')}>
              <Tooltip title={t('editorModeHtml')} arrow>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CodeIcon fontSize="small" />
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* FORMAT HTML BUTTON (VISIBLE ONLY IN HTML MODE) */}
          {editorMode === 'html' && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
              <Tooltip title={t('editorFormatHtml')} arrow>
                <IconButton
                  size="small"
                  onClick={handleFormatHtml}
                  disabled={disabled}
                  color="primary"
                  aria-label={t('editorFormatHtml')}
                  sx={{
                    borderRadius: 1,
                    height: 28,
                    width: 28,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(144, 202, 249, 0.12)'
                        : 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(144, 202, 249, 0.22)'
                          : 'rgba(25, 118, 210, 0.16)',
                    },
                  }}
                >
                  <AutoFixHighIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )}

      {/* RICH TEXT EDITOR (contentEditable) */}
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          display: editorMode === 'rich' ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        {isEmpty && placeholder && !readOnly && (
          <Typography
            variant="body2"
            sx={{
              position: 'absolute',
              top: 12,
              left: 14,
              color: 'text.secondary',
              opacity: 0.65,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {placeholder}
          </Typography>
        )}

        <Box
          ref={editorRef}
          contentEditable={!readOnly && !disabled}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => {
            updateActiveFormats();
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape') {
              checkForMention();
            }
          }}
          onMouseUp={() => {
            updateActiveFormats();
            checkForMention();
          }}
          sx={{
            p: 1.5,
            minHeight,
            maxHeight: 400,
            overflowY: 'auto',
            outline: 'none',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'text.primary',
            '& p': {
              m: 0,
              mb: 0.75,
              '&:last-child': { mb: 0 },
            },
            '& h3': {
              m: 0,
              mb: 1,
              mt: 1,
              fontSize: '1.15rem',
              fontWeight: 700,
            },
            '& h4': {
              m: 0,
              mb: 0.75,
              mt: 0.75,
              fontSize: '1rem',
              fontWeight: 600,
            },
            '& ul, & ol': {
              m: 0,
              my: 0.75,
              pl: 2.75,
            },
            '& li': {
              mb: 0.35,
              '&:last-child': { mb: 0 },
            },
            '& blockquote': {
              m: 0,
              my: 1,
              pl: 1.5,
              py: 0.5,
              borderLeft: '3px solid',
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
              borderRadius: '0 4px 4px 0',
              fontStyle: 'italic',
            },
            '& .mention-tag': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.18)' : 'rgba(25, 118, 210, 0.12)',
              color: (theme) => (theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main'),
              border: '1px solid',
              borderColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.35)' : 'rgba(25, 118, 210, 0.25)',
              borderRadius: '4px',
              px: 0.75,
              py: 0.15,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              margin: '0 2px',
              userSelect: 'all',
              lineHeight: 1.3,
            },
          }}
        />
      </Box>

      {/* PLAIN TEXT VIEW (textarea) */}
      {editorMode === 'plain' && (
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            component="textarea"
            value={plainText}
            onChange={handlePlainTextChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder || t('editorPlainPlaceholder')}
            spellCheck
            sx={{
              width: '100%',
              p: 1.5,
              minHeight,
              maxHeight: 400,
              boxSizing: 'border-box',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              bgcolor: 'transparent',
              color: 'text.primary',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              overflowY: 'auto',
              '&:focus': {
                outline: 'none',
              },
            }}
          />
        </Box>
      )}

      {/* HTML SOURCE VIEW (textarea) */}
      {editorMode === 'html' && (
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            component="textarea"
            value={htmlSource}
            onChange={handleHtmlSourceChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={t('editorHtmlPlaceholder')}
            spellCheck={false}
            sx={{
              width: '100%',
              p: 1.5,
              minHeight,
              maxHeight: 400,
              boxSizing: 'border-box',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.02)'),
              color: 'text.primary',
              fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              overflowY: 'auto',
              whiteSpace: 'pre',
              tabSize: 2,
              '&:focus': {
                outline: 'none',
              },
            }}
          />
        </Box>
      )}

      {/* MENTION AUTOCOMPLETE POPPER */}
      <Popper
        open={mentionOpen && filteredUsers.length > 0}
        anchorEl={mentionAnchorEl}
        placement="bottom-start"
        transition
        style={{ zIndex: 1400 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Paper
              elevation={6}
              sx={{
                mt: 0.5,
                maxHeight: 280,
                width: 260,
                overflowY: 'auto',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 8px 24px rgba(0,0,0,0.5)'
                    : '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t('editorMentionSearchPlaceholder')} ({filteredUsers.length})
                </Typography>
              </Box>
              <List dense sx={{ p: 0.5 }}>
                {filteredUsers.map((user, idx) => {
                  const isSelected = idx === mentionIndex;
                  const initials = user.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)
                    : 'U';

                  return (
                    <ListItemButton
                      key={user.id}
                      selected={isSelected}
                      onClick={() => insertMention(user)}
                      sx={{
                        borderRadius: 1.5,
                        my: 0.25,
                        py: 0.75,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          '& .MuiTypography-root': {
                            color: 'inherit',
                          },
                          '& .MuiChip-root': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                          },
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar
                          src={user.avatarUrl || undefined}
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'primary.main',
                          }}
                        >
                          {initials}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            {user.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            <Chip
                              label={user.role}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                px: 0.2,
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Paper>
          </Fade>
        )}
      </Popper>

      {/* AUTO-SAVE FLOATING TOAST (BOTTOM-RIGHT CORNER) */}
      {autoSaveEnabled && (
        <Fade in={saveStatus !== 'idle'} timeout={200} unmountOnExit>
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 12,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: 1.5,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(30, 41, 59, 0.92)'
                  : 'rgba(255, 255, 255, 0.95)',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.45)'
                  : '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
              backdropFilter: 'blur(8px)',
              pointerEvents: saveStatus === 'error' ? 'auto' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {saveStatus === 'saving' && (
              <>
                <CircularProgress size={13} thickness={5} sx={{ color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}
                >
                  {t('notesSaving')}
                </Typography>
              </>
            )}

            {saveStatus === 'saved' && (
              <>
                <CheckCircleIcon sx={{ fontSize: 15, color: 'success.main' }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  {t('notesSaved')}
                </Typography>
              </>
            )}

            {saveStatus === 'error' && (
              <>
                <ErrorIcon sx={{ fontSize: 15, color: 'error.main' }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'error.main', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  {t('notesSaveFailed')}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  onClick={() => triggerSave(valueRef.current)}
                  sx={{
                    minWidth: 'auto',
                    p: '0 4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    lineHeight: 1.2,
                    ml: 0.5,
                  }}
                >
                  {t('btnRetry')}
                </Button>
              </>
            )}
          </Box>
        </Fade>
      )}
    </Paper>
  );
};

