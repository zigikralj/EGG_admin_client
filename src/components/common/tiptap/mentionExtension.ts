import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { MentionSuggestionList, type MentionSuggestionItem } from './MentionSuggestionList';

export const createMentionExtension = (getUsers: () => MentionSuggestionItem[]) =>
  Mention.configure({
    HTMLAttributes: {
      class: 'mention-tag',
    },
    renderHTML({ node, options }) {
      return [
        'span',
        {
          ...options.HTMLAttributes,
          'data-user-id': node.attrs.id,
          'data-user-name': node.attrs.label,
          contenteditable: 'false',
        },
        `@${node.attrs.label ?? node.attrs.id}`,
      ];
    },
    suggestion: {
      items: ({ query }) => {
        const users = getUsers() || [];
        return users
          .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8);
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
              getReferenceClientRect: props.clientRect as any,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            });
          },
          onUpdate: (props) => {
            component.updateProps(props);
            if (popup?.[0] && props.clientRect) {
              popup[0].setProps({
                getReferenceClientRect: props.clientRect as any,
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
