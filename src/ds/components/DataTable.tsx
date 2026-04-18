import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { COLOR, LAYOUT, TYPE, BORDER, ROW_HEIGHT } from '../tokens';
import { humanizeLabel } from '../textFormat';

interface Column<T> {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T, index: number) => void;
  onRowContextMenu?: (e: React.MouseEvent, item: T, index: number) => void;
  onRowMouseEnter?: (item: T, index: number) => void;
  onRowMouseLeave?: (item: T, index: number) => void;
  getRowStyle?: (item: T, index: number) => React.CSSProperties | undefined;
  sortCol?: string | null;
  sortDir?: 'asc' | 'desc';
  onSort?: (col: string) => void;
  rowHeight?: keyof typeof ROW_HEIGHT;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  stickyLastColumn?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DataTable = <T extends Record<string, any>>({ 
  data, 
  columns, 
  onRowClick,
  onRowContextMenu,
  onRowMouseEnter,
  onRowMouseLeave,
  getRowStyle,
  sortCol,
  sortDir,
  onSort,
  rowHeight = 'compact',
  stickyHeader = true,
  stickyFirstColumn = false,
  stickyLastColumn = false,
  className,
  style
}: DataTableProps<T>) => {
  const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);
    
  return (
    <div className={className} style={{ width: '100%', overflow: 'auto', flex: 1, ...style }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: 'max-content' }}>
        <thead style={{ position: stickyHeader ? 'sticky' : 'static', top: 0, zIndex: 20, background: COLOR.bg.surface }}>
          <tr style={{ height: ROW_HEIGHT.header }}>
            {columns.map((col, idx) => {
              const isActive = sortCol === col.key;
              const isStickyFirst = idx === 0 && stickyFirstColumn;
              const isStickyLast = idx === columns.length - 1 && stickyLastColumn;
              return (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  style={{
                    padding: `0 ${LAYOUT.cellPadH}`,
                    fontSize: TYPE.size.xs,
                    fontWeight: TYPE.weight.bold,
                    color: isActive ? COLOR.text.primary : COLOR.text.muted,
                    
                    letterSpacing: TYPE.letterSpacing.caps,
                    fontFamily: TYPE.family.mono,
                    borderRight: BORDER.standard,
                    borderBottom: BORDER.strong,
                    cursor: col.sortable ? 'pointer' : 'default',
                    textAlign: col.align || 'left',
                    width: col.width,
                    minWidth: col.width,
                    transition: 'all 0.1s linear',
                    userSelect: 'none',
                    position: (isStickyFirst || isStickyLast) ? 'sticky' : 'static',
                    left: isStickyFirst ? 0 : 'auto',
                    right: isStickyLast ? 0 : 'auto',
                    zIndex: (isStickyFirst || isStickyLast) ? 30 : 20,
                    background: isStickyLast ? 'transparent' : COLOR.bg.surface
                  }}
                  className={col.sortable ? "hover:bg-interactive-hover" : ""}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start', gap: '4px' }}>
                    {col.align === 'right' && isActive && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    <span>{humanizeLabel(col.label)}</span>
                    {(col.align !== 'right' || !col.align) && isActive && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => {
            const customStyle = getRowStyle?.(item, rowIdx);
            return (
              <tr 
                key={rowIdx} 
                onClick={() => onRowClick?.(item, rowIdx)}
                onMouseEnter={() => { setHoveredRow(rowIdx); onRowMouseEnter?.(item, rowIdx); }}
                onMouseLeave={() => { setHoveredRow(null); onRowMouseLeave?.(item, rowIdx); }}
                onContextMenu={(e) => onRowContextMenu?.(e, item, rowIdx)}
                style={{ 
                  height: ROW_HEIGHT[rowHeight], 
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 60ms linear',
                  background: hoveredRow === rowIdx ? 'rgba(255, 255, 255, 0.05)' : customStyle?.background || 'transparent',
                  ...customStyle
                }}
              >
                {columns.map((col, colIdx) => {
                  const isStickyFirst = colIdx === 0 && stickyFirstColumn;
                  const isStickyLast = colIdx === columns.length - 1 && stickyLastColumn;
                  
                  let cellBg = 'transparent';
                  if (isStickyFirst) {
                      cellBg = hoveredRow === rowIdx ? 'rgba(40, 40, 40, 1)' : (customStyle?.background as string) || COLOR.bg.base;
                  } else if (isStickyLast) {
                      cellBg = hoveredRow === rowIdx ? (customStyle?.background as string) || COLOR.bg.base : 'transparent';
                  }

                  return (
                    <td 
                      key={col.key}
                      style={{ 
                        padding: isStickyLast ? '0' : '0 12px', 
                        fontSize: TYPE.size.sm,
                        fontFamily: TYPE.family.mono,
                        fontWeight: TYPE.weight.medium,
                        color: COLOR.text.primary,
                        textAlign: col.align || 'left',
                        borderRight: isStickyLast ? 'none' : BORDER.standard,
                        borderBottom: customStyle?.borderBottom || BORDER.standard,
                        borderTop: customStyle?.borderTop || 'none',
                        width: col.width,
                        minWidth: col.width,
                        position: (isStickyFirst || isStickyLast) ? 'sticky' : 'static',
                        left: isStickyFirst ? 0 : 'auto',
                        right: isStickyLast ? 1 : 'auto',
                        zIndex: (isStickyFirst || isStickyLast) ? 10 : 1,
                        backgroundColor: cellBg,
                        pointerEvents: isStickyLast && hoveredRow !== rowIdx ? 'none' : 'auto'
                      }}
                    >
                      {col.render ? col.render(item[col.key], item, rowIdx) : item[col.key]}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

