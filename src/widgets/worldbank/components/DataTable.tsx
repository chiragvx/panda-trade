import React, { useState, useMemo } from 'react';
import { WorldBankDataPoint } from '../../../services/worldBankApi';
import { COLOR, TYPE, BORDER, SPACE, Text } from '../../../ds';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface Props {
  data: WorldBankDataPoint[];
}

type SortField = 'TIME_PERIOD' | 'OBS_VALUE' | 'REF_AREA';
type SortOrder = 'asc' | 'desc';

export const DataTable: React.FC<Props> = ({ data }) => {
  const [sortField, setSortField] = useState<SortField>('TIME_PERIOD');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let valA: string | number = a[sortField] || '';
      let valB: string | number = b[sortField] || '';

      if (sortField === 'OBS_VALUE' || sortField === 'TIME_PERIOD') {
        valA = Number(valA);
        valB = Number(valB);
        if (isNaN(valA)) valA = 0;
        if (isNaN(valB)) valB = 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} color={COLOR.text.muted} />;
    return sortOrder === 'asc' ? <ArrowUp size={12} color={COLOR.semantic.info} /> : <ArrowDown size={12} color={COLOR.semantic.info} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: SPACE[2], padding: '8px 12px', background: COLOR.bg.elevated, borderBottom: BORDER.standard, position: 'sticky', top: 0, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => handleSort('TIME_PERIOD')}>
          <Text size="xs" color="muted" weight="bold">YEAR</Text>
          <SortIcon field="TIME_PERIOD" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => handleSort('OBS_VALUE')}>
          <Text size="xs" color="muted" weight="bold">VALUE</Text>
          <SortIcon field="OBS_VALUE" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => handleSort('REF_AREA')}>
          <Text size="xs" color="muted" weight="bold">REGION (CODE)</Text>
          <SortIcon field="REF_AREA" />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
        {sortedData.length === 0 ? (
          <div style={{ padding: SPACE[6], textAlign: 'center' }}>
            <Text color="muted">No data available for selected filters.</Text>
          </div>
        ) : (
          sortedData.map((d, i) => (
            <div key={`${d.TIME_PERIOD}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: SPACE[2], padding: '8px 12px', borderBottom: BORDER.standard, '&:hover': { background: COLOR.bg.elevated } }}>
              <Text family="mono" size="sm">{d.TIME_PERIOD}</Text>
              <Text family="mono" size="sm" weight="bold">{Number(d.OBS_VALUE).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
              <Text family="mono" size="sm" color="muted">{d.REF_AREA}</Text>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
