import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { COLOR, TYPE, BORDER, ROW_HEIGHT } from '../tokens';

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
  sortCol?: string | null;
  sortDir?: 'asc' | 'desc';
  onSort?: (col: string) => void;
  rowHeight?: keyof typeof ROW_HEIGHT;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DataTable = <T extends Record<string, any>>({ 
  data, 
  columns, 
  onRowClick,
  sortCol,
  sortDir,
  onSort,
  rowHeight = 'compact',
  stickyHeader = true,
  stickyFirstColumn = false,
  className,
  style
}: DataTableProps<T>) => {
    
  return (
    <div className={className} style={{ width: '100%', overflow: 'auto', flex: 1, ...style }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: 'max-content' }}>
        <thead style={{ position: stickyHeader ? 'sticky' : 'static', top: 0, zIndex: 20, background: COLOR.bg.surface }}>
          <tr style={{ height: ROW_HEIGHT.header }}>
            {columns.map((col, idx) => {
              const isActive = sortCol === col.key;
              const isSticky = idx === 0 && stickyFirstColumn;
              return (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  style={{
                    padding: '0 12px',
                    fontSize: TYPE.size.xs,
                    fontWeight: TYPE.weight.black,
                    color: isActive ? COLOR.text.primary : COLOR.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: TYPE.letterSpacing.caps,
                    fontFamily: TYPE.family.mono,
                    borderRight: BORDER.standard,
                    borderBottom: BORDER.standard,
                    cursor: col.sortable ? 'pointer' : 'default',
                    textAlign: col.align || 'left',
                    width: col.width,
                    minWidth: col.width,
                    transition: 'all 0.1s linear',
                    userSelect: 'none',
                    position: isSticky ? 'sticky' : 'static',
                    left: isSticky ? 0 : 'auto',
                    zIndex: isSticky ? 30 : 20,
                    background: COLOR.bg.surface
                  }}
                  className={col.sortable ? "hover:bg-interactive-hover" : ""}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start', gap: '4px' }}>
                    {col.align === 'right' && isActive && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    <span>{col.label}</span>
                    {(col.align !== 'right' || !col.align) && isActive && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <tr 
              key={rowIdx} 
              onClick={() => onRowClick?.(item, rowIdx)}
              style={{ 
                height: ROW_HEIGHT[rowHeight], 
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 60ms linear',
              }}
              className="group hover:bg-interactive-hover"
            >
              {columns.map((col, colIdx) => {
                const isSticky = colIdx === 0 && stickyFirstColumn;
                return (
                  <td 
                    key={col.key}
                    style={{ 
                      padding: '0 12px', 
                      fontSize: TYPE.size.sm,
                      fontFamily: TYPE.family.mono,
                      fontWeight: TYPE.weight.medium,
                      color: COLOR.text.primary,
                      textAlign: col.align || 'left',
                      borderRight: BORDER.standard,
                      borderBottom: BORDER.standard,
                      width: col.width,
                      minWidth: col.width,
                      position: isSticky ? 'sticky' : 'static',
                      left: isSticky ? 0 : 'auto',
                      zIndex: isSticky ? 10 : 1,
                      backgroundColor: 'inherit' // Ensures it picks up hover color or row color
                    }}
                  >
                    {col.render ? col.render(item[col.key], item, rowIdx) : item[col.key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

