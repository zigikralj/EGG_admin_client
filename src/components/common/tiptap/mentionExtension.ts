import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { MentionSuggestionList, type MentionSuggestionItem } from './MentionSuggestionList';

export type MentionUserFetcher = (
  query: string,
  signal?: AbortSignal
) => Promise<MentionSuggestionItem[]> | MentionSuggestionItem[];

export const createMentionExtension = (getUsers: MentionUserFetcher) =>
  Mention.extend({
    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: (element) =>
            element.getAttribute('data-id') || element.getAttribute('data-user-id'),
          renderHTML: (attributes) => {
            if (!attributes.id) return {};
            return {
              'data-id': attributes.id,
              'data-user-id': attributes.id,
            };
          },
        },
        label: {
          default: null,
          parseHTML: (element) =>
            element.getAttribute('data-label') ||
            element.getAttribute('data-user-name') ||
            element.textContent?.replace(/^@/, '').trim() ||
            null,
          renderHTML: (attributes) => {
            if (!attributes.label) return {};
            return {
              'data-label': attributes.label,
              'data-user-name': attributes.label,
            };
          },
        },
      };
    },
    parseHTML() {
      return [
        { tag: 'span[data-type="mention"]' },
        { tag: 'span[data-user-id]' },
        { tag: 'span.mention-tag' },
      ];
    },
    renderHTML({ node, HTMLAttributes }) {
      return [
        'span',
        {
          'data-type': 'mention',
          class: 'mention-tag',
          'data-id': node.attrs.id,
          'data-user-id': node.attrs.id,
          'data-label': node.attrs.label,
          'data-user-name': node.attrs.label,
          contenteditable: 'false',
          ...HTMLAttributes,
        },
        `@${node.attrs.label ?? node.attrs.id ?? ''}`,
      ];
    },
  }).configure({
    suggestion: {
      debounce: 150,
      items: async ({ query, signal }: { query: string; signal?: AbortSignal }) => {
        const users = await getUsers(query, signal);
        return users || [];
      },
      render: () => {
        let component: ReactRenderer;
        let popup: TippyInstance[];

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionSuggestionList, {
              props,
              editor: props.editor,
            });

            if (!props.clientRect) return;

            popup = tippy('body', {
              getReferenceClientRect: () => props.clientRect?.() || new DOMRect(),
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
              zIndex: 9999,
              arrow: false,
              offset: [0, 6],
              theme: 'mention-popover',
            });
          },
          onUpdate: (props) => {
            component.updateProps(props);
            if (popup?.[0] && props.clientRect) {
              popup[0].setProps({
                getReferenceClientRect: () => props.clientRect?.() || new DOMRect(),
              });
            }
          },
          onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide();
              return true;
            }
            return (component?.ref as any)?.onKeyDown(props) || false;
          },
          onExit: () => {
            popup?.[0]?.destroy();
            component?.destroy();
          },
        };
      },
    },
  });

