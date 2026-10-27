import { describe, it, expect, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { createMentionExtension } from './mentionExtension';

describe('TipTap mention extension', () => {
  const mockUsers = [
    { id: 'usr-1', name: 'Nemanja Stanojević', role: 'Administrator' },
    { id: 'usr-2', name: 'Katarina Popović', role: 'User' },
    { id: 'usr-3', name: 'Jelena Nikolić', role: 'Manager' },
  ];

  it('renders mention nodes with both data-id and data-user-id for server compatibility', () => {
    const mentionExt = createMentionExtension(() => mockUsers);
    const editor = new Editor({
      extensions: [StarterKit, mentionExt],
      content: '',
    });

    editor.commands.insertContent({
      type: 'mention',
      attrs: {
        id: 'usr-1',
        label: 'Nemanja Stanojević',
      },
    });

    const html = editor.getHTML();
    expect(html).toContain('data-user-id="usr-1"');
    expect(html).toContain('data-id="usr-1"');
    expect(html).toContain('data-user-name="Nemanja Stanojević"');
    expect(html).toContain('class="mention-tag"');
    expect(html).toContain('@Nemanja Stanojević');

    editor.destroy();
  });

  it('parses legacy mention HTML containing class="mention-tag" and data-user-id without losing attributes', () => {
    const mentionExt = createMentionExtension(() => mockUsers);
    const legacyHtml = '<p>Check this with <span class="mention-tag" data-user-id="usr-2" data-user-name="Katarina Popović">@Katarina Popović</span> immediately</p>';

    const editor = new Editor({
      extensions: [StarterKit, mentionExt],
      content: legacyHtml,
    });

    const json = editor.getJSON();
    const paragraph = json.content?.[0];
    const mentionNode = paragraph?.content?.find((node) => node.type === 'mention');

    expect(mentionNode).toBeDefined();
    expect((mentionNode as any)?.attrs?.id).toBe('usr-2');
    expect((mentionNode as any)?.attrs?.label).toBe('Katarina Popović');

    const serializedHtml = editor.getHTML();
    expect(serializedHtml).toContain('data-user-id="usr-2"');
    expect(serializedHtml).toContain('data-id="usr-2"');

    editor.destroy();
  });

  it('filters mention suggestions by query case-insensitively and safely handles empty queries', async () => {
    const getUsers = vi.fn(async (q: string) => {
      const trimmed = (q || '').toLowerCase();
      return mockUsers.filter((u) => !trimmed || u.name.toLowerCase().includes(trimmed));
    });
    const mentionExt = createMentionExtension(getUsers);

    const suggestionOptions = (mentionExt.options as any)?.suggestion;
    expect(suggestionOptions).toBeDefined();

    // Query 'kat'
    const resultsKat = await suggestionOptions.items({ query: 'kat' });
    expect(resultsKat).toHaveLength(1);
    expect(resultsKat[0].id).toBe('usr-2');

    // Empty query returns all mock users
    const resultsAll = await suggestionOptions.items({ query: '' });
    expect(resultsAll).toHaveLength(3);

    // No match
    const resultsNone = await suggestionOptions.items({ query: 'nonexistent' });
    expect(resultsNone).toHaveLength(0);
  });
});
