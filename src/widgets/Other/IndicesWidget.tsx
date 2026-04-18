import React, { useMemo, useState } from 'react';
import { useIndices } from '../../hooks/useIndices';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { DataTable } from '../../ds/components/DataTable';
import { Change } from '../../ds/components/Change';
import { Price } from '../../ds/components/Price';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Info, BarChart3, Link2 } from 'lucide-react';
import { Tooltip } from '../../ds/components/Tooltip';

import { WidgetShell } from '../../ds/components/WidgetShell';
import { Search, Activity } from 'lucide-react';

export const IndicesWidget: React.FC = () => {
  const indices = useIndices();
  const { setSelectedSymbol } = useSelectionStore();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const filteredData = useMemo(() => {
    return indices.filter(i =>
        i.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [indices, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;
    return [...filteredData].sort((a, b) => {
      const av = (a as any)[sortCol];
      const bv = (b as any)[sortCol];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0);
    });
  }, [filteredData, sortCol, sortDir]);

  const columns = useMemo(() => [
    {
      key: 'ticker',
      label: 'INDEX_SYMBOL',
      width: 140,
      sortable: true,
      render: (val: string, item: any) => (
        <span style={{ fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontFamily: TYPE.family.mono }}>{val}</span>
      )
    },
    {
      key: 'ltp',
      label: 'PRICE',
      align: 'right' as const,
      width: 90,
      sortable: true,
      render: (val: number) => <Price value={val} size="sm" />
    },
    {
      key: 'pChange',
      label: '%CHG',
      align: 'right' as const,
      width: 80,
      sortable: true,
      render: (val: number) => <Change value={val} format="percent" size="sm" />
    },
    {
        key: 'actions',
        label: '',
        width: 100,
        align: 'right' as const,
        render: (_: any, item: any, index: number) => {
            const isHovered = hoveredRow === index;
            return (
                <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'flex-end', 
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.1s ease-in-out',
                    pointerEvents: isHovered ? 'auto' : 'none'
                }}>
                    <Tooltip content="Fundamentals" position="top">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSymbol({ ...item, ticker: item.ticker, name: item.ticker });
                                if ((window as any).replaceTab) (window as any).replaceTab('fundamentals');
                            }}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: COLOR.text.muted }}
                        >
                            <Info size={14} className="hover:text-blue-400" />
                        </button>
                    </Tooltip>

                    <Tooltip content="Chart" position="top">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSymbol({ ...item, ticker: item.ticker, name: item.ticker });
                                if ((window as any).targetWidget) (window as any).targetWidget('chart');
                            }}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: COLOR.text.muted }}
                        >
                            <BarChart3 size={14} className="hover:text-indigo-400" />
                        </button>
                    </Tooltip>

                    <Tooltip content="Option Chain" position="top">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSymbol({ ...item, ticker: item.ticker, name: item.ticker });
                                if ((window as any).replaceTab) (window as any).replaceTab('option-chain');
                            }}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: COLOR.text.muted }}
                        >
                            <Link2 size={14} className="hover:text-purple-400" />
                        </button>
                    </Tooltip>
                </div>
            );
        }
    }
  ], [hoveredRow, setSelectedSymbol]);

  return (
    <WidgetShell>
      <WidgetShell.Toolbar>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} color={COLOR.semantic.info} />
            <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>MARKET_INDICES</span>
          </div>

          <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
              <Search size={12} color={COLOR.text.muted} />
            </div>
            <input 
              placeholder="SEARCH_INDICES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                height: '28px',
                background: 'transparent',
                border: BORDER.standard,
                color: COLOR.text.primary,
                fontSize: '10px',
                fontWeight: TYPE.weight.bold,
                fontFamily: TYPE.family.mono,
                width: '100%',
                padding: '0 10px 0 28px',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </WidgetShell.Toolbar>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: COLOR.bg.surface }}>
        <DataTable
          data={sortedData}
          columns={columns}
          rowHeight="relaxed"
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={handleSort}
          onRowMouseEnter={(_, idx) => setHoveredRow(idx)}
          onRowMouseLeave={() => setHoveredRow(null)}
          stickyLastColumn={true}
          onRowClick={(item) => setSelectedSymbol({ ...item, ticker: item.ticker, name: item.ticker } as any)}
        />
      </div>
    </WidgetShell>
  );
};
