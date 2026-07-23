import { useMemo } from 'react';

export function HighlightText({
  text,
  keyword,
  className = '',
}: {
  text: string;
  keyword: string;
  className?: string;
}) {
  const parts = useMemo(() => {
    const kw = keyword.trim();
    if (!kw || !text) return [{ text, match: false }];
    const lowerText = text.toLowerCase();
    const lowerKw = kw.toLowerCase();
    const result: { text: string; match: boolean }[] = [];
    let lastIdx = 0;
    let idx = lowerText.indexOf(lowerKw);
    while (idx !== -1) {
      if (idx > lastIdx) {
        result.push({ text: text.slice(lastIdx, idx), match: false });
      }
      result.push({ text: text.slice(idx, idx + kw.length), match: true });
      lastIdx = idx + kw.length;
      idx = lowerText.indexOf(lowerKw, lastIdx);
    }
    if (lastIdx < text.length) {
      result.push({ text: text.slice(lastIdx), match: false });
    }
    return result;
  }, [text, keyword]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-gray-900">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
