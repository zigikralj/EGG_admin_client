import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeHtml, cleanWordHtml } from './cleanWordHtml';
import { stripHtmlToText } from './stripHtmlToText';

describe('HTML Sanitization & Text Utilities', () => {
  it('escapeHtml escapes meta-characters correctly', () => {
    expect(escapeHtml('<script>alert("xss") & \'test\'</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;) &amp; &#039;test&#039;&lt;/script&gt;'
    );
  });

  it('sanitizeHtml strips dangerous scripts and handlers while preserving formatting and mentions', () => {
    const dirty =
      '<p>Safe text</p><script>alert("hack")</script><img src="x" onerror="alert(1)"><span class="mention-tag" data-user-id="123" data-user-name="Alice" contenteditable="false">@Alice</span>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('Safe text');
    expect(clean).toContain('class="mention-tag"');
    expect(clean).toContain('data-user-id="123"');
    expect(clean).toContain('data-user-name="Alice"');
    expect(clean).toContain('contenteditable="false"');
  });

  it('stripHtmlToText removes invisible characters like &nbsp; and decodes HTML entities cleanly', () => {
    const noteWithTrailingNbsp =
      '<p>how are you man? everything good? <span class="mention-tag" data-user-id="3">@Katarina Popović</span>&nbsp;</p>';
    expect(stripHtmlToText(noteWithTrailingNbsp)).toBe(
      'how are you man? everything good? @Katarina Popović'
    );

    const noteWithEntities =
      '<p>Energo-Term&nbsp;Kraljevo &amp; &lt;Heating&gt; &#39;Special&#39; &quot;Notes&quot;&nbsp;</p>';
    expect(stripHtmlToText(noteWithEntities)).toBe(
      'Energo-Term Kraljevo & <Heating> \'Special\' "Notes"'
    );

    const multiBlock = '<p>First line</p><p>Second line</p>';
    expect(stripHtmlToText(multiBlock)).toBe('First line Second line');

    expect(stripHtmlToText('<p>&nbsp;</p>')).toBe('');
    expect(stripHtmlToText('<p><br></p>')).toBe('');
    expect(stripHtmlToText('&nbsp;&nbsp;&nbsp;')).toBe('');
    expect(stripHtmlToText('')).toBe('');

    const wordHtml = `<!--[if gte mso 9]><xml>
 <o:OfficeDocumentSettings>
  <o:AllowPNG/>
 </o:OfficeDocumentSettings>
</xml><![endif]--><!--[if gte mso 9]><xml>
 <w:WordDocument>
  <w:View>Normal</w:View>
  <w:Zoom>0</w:Zoom>
  <w:TrackMoves>false</w:TrackMoves>
  <w:TrackFormatting/>
  <w:HyphenationZone>21</w:HyphenationZone>
  <w:PunctuationKerning/>
  <w:ValidateAgainstSchemas/>
  <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
  <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
  <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
  <w:DoNotPromoteQF/>
  <w:LidThemeOther>SR-LATN-RS</w:LidThemeOther>
  <w:LidThemeAsian>X-NONE</w:LidThemeAsian>
  <w:LidThemeComplexScript>X-NONE</w:LidThemeComplexScript>
 </w:WordDocument>
</xml><![endif]--><style>
<!--
 /* Style Definitions */
 p.MsoNormal, li.MsoNormal, div.MsoNormal
	{mso-style-name:Normal;}
-->
</style><p class="MsoNormal">Izvršen je godišnji izveštaj za eIRH portal za hemikalije iz uvoza.</p><p class="MsoNormal"><span class="mention-tag" data-user-id="2594a072-8fc8-4a91-b252-3f30b2b0f578" data-user-name="Nina Marinković" contenteditable="false">@Nina Marinković</span>&nbsp;</p>`;

    const stripped = stripHtmlToText(wordHtml);
    expect(stripped).not.toContain('Normal 0');
    expect(stripped).not.toContain('Style Definitions');
    expect(stripped).not.toContain('SR-LATN-RS');
    expect(stripped).toBe(
      'Izvršen je godišnji izveštaj za eIRH portal za hemikalije iz uvoza. @Nina Marinković'
    );
  });

  it('cleanWordHtml and sanitizeHtml strip Office XML, comments, and style tags while preserving content', () => {
    const dirtyWordHtml =
      '<xml><w:WordDocument>metadata</w:WordDocument></xml><style>body { color: red; }</style><!--[if gte mso 9]>comment<![endif]--><p class="MsoNormal">Actual content</p>';
    const cleaned = cleanWordHtml(dirtyWordHtml);
    expect(cleaned).not.toContain('<xml>');
    expect(cleaned).not.toContain('metadata');
    expect(cleaned).not.toContain('<style>');
    expect(cleaned).not.toContain('color: red');
    expect(cleaned).toContain('Actual content');

    const sanitized = sanitizeHtml(dirtyWordHtml);
    expect(sanitized).not.toContain('<xml>');
    expect(sanitized).not.toContain('metadata');
    expect(sanitized).not.toContain('<style>');
    expect(sanitized).toContain('Actual content');
  });
});
