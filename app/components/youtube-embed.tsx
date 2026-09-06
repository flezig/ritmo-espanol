'use client';

import { useEffect, useState } from 'react';

export function YouTubeEmbed({
  videoId,
  title,
  start,
  end,
  compact = false,
}: {
  videoId: string;
  title: string;
  start?: number;
  end?: number;
  compact?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowHelp(true), 6500);
    return () => window.clearTimeout(timer);
  }, [videoId, start]);
  const query = new URLSearchParams({ rel: '0', playsinline: '1', controls: '1' });
  if (typeof start === 'number') query.set('start', String(start));
  if (typeof end === 'number') query.set('end', String(end));
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}${start ? `&t=${start}s` : ''}`;
  return (
    <div className={compact ? 'youtube-embed compact' : 'youtube-embed'}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?${query.toString()}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        allowFullScreen
        onLoad={() => setLoaded(true)}
        onError={() => setShowHelp(true)}
      />
      {(showHelp || !loaded) && (
        <div className="youtube-fallback">
          <span>{loaded ? 'Видео не запускается?' : 'Загружаем видео…'}</span>
          <a href={youtubeUrl} target="_blank" rel="noreferrer">
            Открыть нужный момент на YouTube
          </a>
          <small>Если YouTube заблокирован из-за cookies или региона, задание можно выполнить по подсказкам без видео.</small>
        </div>
      )}
    </div>
  );
}

