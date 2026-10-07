'use client';

import type { SRSRecord } from '../../lib/learning-core';

export function ReviewCalendar({ records }: { records: Record<string, SRSRecord> }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const end = date.getTime() + 86400000,
      count = Object.values(records).filter(
        (record) =>
          record.reviews &&
          record.nextReview >= date.getTime() &&
          record.nextReview < end,
      ).length;
    return {
      label:
        index === 0
          ? 'Сегодня'
          : date.toLocaleDateString('ru-RU', {
              weekday: 'short',
              day: 'numeric',
            }),
      count,
    };
  });
  return (
    <section className="review-calendar">
      <header>
        <div>
          <p className="eyebrow">КАЛЕНДАРЬ ПОВТОРЕНИЙ</p>
          <h3>Ближайшие 7 дней</h3>
        </div>
        <small>каждый навык планируется отдельно</small>
      </header>
      <div>
        {days.map((day) => (
          <article className={day.count ? 'has-reviews' : ''} key={day.label}>
            <span>{day.label}</span>
            <b>{day.count}</b>
            <small>{day.count ? 'карточек' : 'свободно'}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
