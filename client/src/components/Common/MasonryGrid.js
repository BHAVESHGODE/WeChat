import React, { useMemo } from 'react';

function MasonryGrid({ items, renderItem, columns, gap = 16, minColWidth = 200 }) {
  const colCount = columns || useMemo(() => {
    if (typeof window === 'undefined') return 3;
    const w = window.innerWidth;
    if (w < 480) return 2;
    if (w < 768) return 2;
    if (w < 1024) return 3;
    if (w < 1440) return 4;
    return 5;
  }, []);

  const cols = useMemo(() => {
    const result = Array.from({ length: colCount }, () => []);
    items.forEach((item, i) => {
      result[i % colCount].push(item);
    });
    return result;
  }, [items, colCount]);

  return (
    <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap }}>
          {col.map((item, ii) => (
            <div key={item._id || item.id || ii} className="masonry-item" style={{ breakInside: 'avoid' }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default MasonryGrid;
