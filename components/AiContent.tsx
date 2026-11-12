/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The one renderer for streamed AI readings (#57), shared by the
 * chart reading panel and the compatibility page. Reading text is 17/25 in the
 * body color (Apple China's reading size); section headers are 14px gold, the
 * accent's one place outside the chart itself.
 */

/**
 * Renders the reading's light markdown: `**【标题】**` lines become section
 * headers and `**…**` becomes emphasis. While streaming, a breathing pole-star
 * mark shows that text is still arriving.
 */
export default function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, i) => {
        const section = line.match(/^\*\*【(.+?)】\*\*$/);
        if (section) {
          return (
            <h3 key={i} className="pb-1 first:pt-0" style={{ paddingTop: i === 0 ? 0 : 16, fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--ac)' }}>
              {section[1]}
            </h3>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const parts = line.split(/\*\*(.+?)\*\*/);
        return (
          <p key={i} style={{ fontSize: 'var(--fs-read)', lineHeight: 'var(--lh-read)', color: 'var(--tx-1)' }}>
            {parts.map((part, j) => (j % 2 === 0 ? part : <strong key={j} style={{ color: 'var(--tx-0)' }}>{part}</strong>))}
          </p>
        );
      })}
      {streaming && <span aria-hidden="true" className="pole-mark animate-breathe mt-2" style={{ width: 12, height: 12 }} />}
    </div>
  );
}
