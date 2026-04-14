import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader2, BarChart2, Table as TableIcon, Globe, AlertCircle, RefreshCw, Calendar, X, Plus } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE, Text, WidgetShell, SegmentedControl, EmptyState, Select, Tag, Button } from '../../ds';
import { fetchIndicatorData, WorldBankDataPoint, searchIndicators, IndicatorMeta, fetchAllEntities } from '../../services/worldBankApi';
import { IndicatorChart } from './components/IndicatorChart';
import { DataTable } from './components/DataTable';

const DEFAULT_DATABASE = 'WB_WDI';
const PRESETS = [
  { group: 'GROWTH & OUTPUT', items: [
    { id: 'WB_WDI_NY_GDP_MKTP_KD_ZG', name: 'GDP Growth (Annual %)' },
    { id: 'WB_WDI_NY_GDP_PCAP_CD', name: 'GDP per Capita (Current US$)' },
    { id: 'WB_WDI_NE_GDI_FTOT_ZS', name: 'Gross Capital Formation (% of GDP)' },
  ]},
  { group: 'MONETARY & PRICES', items: [
    { id: 'WB_WDI_FP_CPI_TOTL_ZG', name: 'Inflation (Consumer Prices %)' },
    { id: 'WB_WDI_FR_INR_RINR', name: 'Real Interest Rate (%)' },
    { id: 'WB_WDI_FM_LBL_BMNY_GD_ZS', name: 'Broad Money (% of GDP)' },
  ]},
  { group: 'FISCAL & DEBT', items: [
    { id: 'WB_WDI_GC_DOD_TOTL_GD_ZS', name: 'Central Govt Debt (% of GDP)' },
    { id: 'WB_WDI_GC_TAX_TOTL_GD_ZS', name: 'Tax Revenue (% of GDP)' },
    { id: 'WB_WDI_BN_CAB_XOKA_GD_ZS', name: 'Current Account Balance (% of GDP)' },
  ]},
];

const MAJOR_ECONOMIES = [
  { group: 'GLOBAL & BLOCS', items: [
    { code: 'WLD', name: 'World' },
    { code: 'G7', name: 'G7 Members' },
    { code: 'G20', name: 'G20 Members' },
    { code: 'EUU', name: 'European Union' },
  ]},
  { group: 'MAJOR ECONOMIES', items: [
    { code: 'USA', name: 'United States' },
    { code: 'CHN', name: 'China' },
    { code: 'IND', name: 'India' },
    { code: 'JPN', name: 'Japan' },
  ]},
];

const RELEVANT_YEARS = Array.from({ length: 45 }, (_, i) => (2024 - i).toString());

const WorldBankExplorer: React.FC = () => {
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
    const [activeIndicator, setActiveIndicator] = useState<{ id: string; name: string }>(PRESETS[0].items[0]);
    const [activeRegions, setActiveRegions] = useState<string[]>(['IND', 'CHN']); 
    
    const [fromYear, setFromYear] = useState('1990');
    const [toYear, setToYear] = useState('2024');

    const [data, setData] = useState<WorldBankDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search/Entity states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<IndicatorMeta[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDrop, setShowSearchDrop] = useState(false);

    const [allEntities, setAllEntities] = useState<{ id: string; name: string }[]>([]);
    const [entitySearch, setEntitySearch] = useState('');
    const [showEntityDrop, setShowEntityDrop] = useState(false);

    useEffect(() => {
        fetchAllEntities().then(setAllEntities);
    }, []);

    const toggleRegion = (code: string) => {
        setActiveRegions(prev => {
            if (prev.includes(code)) {
                if (prev.length === 1) return prev;
                return prev.filter(c => c !== code);
            }
            if (prev.length >= 6) return prev;
            return [...prev, code];
        });
    };

    const loadData = useCallback(async () => {
        if (activeRegions.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetchIndicatorData(DEFAULT_DATABASE, activeIndicator.id, activeRegions.join(','), fromYear, toYear);
            setData(res.value || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch Data360 API.');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [activeIndicator, activeRegions, fromYear, toYear]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            setShowSearchDrop(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchIndicators(searchQuery, 10);
                setSearchResults(results || []);
                setShowSearchDrop(true);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredEntities = useMemo(() => {
        if (!entitySearch) return [];
        return allEntities
            .filter(e => e.name.toLowerCase().includes(entitySearch.toLowerCase()) || e.id.toLowerCase().includes(entitySearch.toLowerCase()))
            .slice(0, 10);
    }, [allEntities, entitySearch]);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={14} color={COLOR.semantic.info} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>MACRO COMPARATOR</Text>
                    </div>
                </WidgetShell.Toolbar.Left>
                <WidgetShell.Toolbar.Right>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
                        <Calendar size={12} color={COLOR.text.muted} />
                        <Select 
                            selectSize="sm" 
                            value={fromYear} 
                            onChange={(e) => setFromYear(e.target.value)}
                            style={{ width: '70px' }}
                        >
                            {RELEVANT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </Select>
                        <Text size="xs" color="muted">—</Text>
                        <Select 
                            selectSize="sm" 
                            value={toYear} 
                            onChange={(e) => setToYear(e.target.value)}
                            style={{ width: '70px' }}
                        >
                            {RELEVANT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </Select>
                    </div>
                    <div style={{ height: '16px', width: '1px', background: COLOR.bg.border, marginRight: '8px' }} />
                    <SegmentedControl 
                        options={[{ label: 'CHART', value: 'chart' }, { label: 'TABLE', value: 'table' }]} 
                        value={viewMode} 
                        onChange={(v) => setViewMode(v as 'chart' | 'table')}
                    />
                </WidgetShell.Toolbar.Right>
            </WidgetShell.Toolbar>

            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {/* Sidebar */}
                <div style={{ width: '300px', borderRight: BORDER.standard, display: 'flex', flexDirection: 'column', background: COLOR.bg.surface }}>
                    <div style={{ padding: SPACE[3], borderBottom: BORDER.standard }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], background: COLOR.bg.elevated, border: BORDER.standard, padding: '10px', borderRadius: '0px' }}>
                                {isSearching ? <Loader2 size={13} className="spin" color={COLOR.semantic.info} /> : <Search size={13} color={COLOR.text.muted} />}
                                <input 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    onFocus={() => { if(searchResults.length > 0) setShowSearchDrop(true); }}
                                    onBlur={() => setTimeout(() => setShowSearchDrop(false), 200)}
                                    placeholder="Search Macro Metrics..." 
                                    style={{ background: 'transparent', border: 'none', outline: 'none', color: COLOR.text.primary, fontSize: TYPE.size.sm, width: '100%', fontFamily: TYPE.family.mono }} 
                                />
                            </div>

                            {showSearchDrop && (searchResults || []).length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: COLOR.bg.overlay, border: BORDER.standard, borderRadius: '0px', marginTop: '4px', maxHeight: '300px', overflowY: 'auto', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                                    {searchResults.map(res => (
                                        <div 
                                            key={res.series_description.idno} 
                                            onClick={() => {
                                                setActiveIndicator({ id: res.series_description.idno, name: res.series_description.name });
                                                setSearchQuery('');
                                                setShowSearchDrop(false);
                                            }}
                                            style={{ padding: '12px', borderBottom: BORDER.standard, cursor: 'pointer' }}
                                            className="hover-bg-elevated"
                                        >
                                            <Text size="xs" weight="black" block style={{ color: COLOR.text.primary }}>{res.series_description.name}</Text>
                                            <Text family="mono" size="xs" color="muted">{res.series_description.idno}</Text>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: SPACE[3] }} className="custom-scrollbar">
                        <div style={{ marginBottom: SPACE[5] }}>
                            <Text size="xs" color="muted" weight="black" style={{ marginBottom: SPACE[3], display: 'block', letterSpacing: '0.1em' }}>INDICATOR PRESETS</Text>
                            {PRESETS.map(group => (
                                <div key={group.group} style={{ marginBottom: SPACE[4] }}>
                                    <Text size="xs" color="muted" weight="bold" style={{ fontSize: '10px', marginLeft: '4px', display: 'block', marginBottom: '6px' }}>{group.group}</Text>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {group.items.map(p => {
                                            const isActive = activeIndicator.id === p.id;
                                            return (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => setActiveIndicator(p)}
                                                    style={{ 
                                                        textAlign: 'left', padding: '8px 10px', border: 'none', cursor: 'pointer',
                                                        background: isActive ? COLOR.interactive.selected : 'transparent',
                                                        color: isActive ? COLOR.semantic.info : COLOR.text.secondary,
                                                        borderLeft: isActive ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent'
                                                    }}
                                                >
                                                    <Text size="xs" weight={isActive ? "black" : "regular"} color={isActive ? "info" : "secondary"} family="mono">{p.name}</Text>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <Text size="xs" color="muted" weight="black" style={{ marginBottom: SPACE[3], display: 'block', letterSpacing: '0.1em' }}>COMPARE ENTITIES</Text>
                            
                            {/* Entity Search field - UI consistent */}
                            <div style={{ position: 'relative', marginBottom: SPACE[4] }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], background: COLOR.bg.elevated, border: BORDER.standard, padding: '8px', borderRadius: '0px' }}>
                                    <Plus size={12} color={COLOR.text.muted} />
                                    <input 
                                        value={entitySearch} 
                                        onChange={e => { setEntitySearch(e.target.value); setShowEntityDrop(true); }}
                                        placeholder="Add Country/Region..." 
                                        style={{ background: 'transparent', border: 'none', outline: 'none', color: COLOR.text.primary, fontSize: '11px', width: '100%', fontFamily: TYPE.family.mono }} 
                                    />
                                </div>
                                {showEntityDrop && filteredEntities.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: COLOR.bg.overlay, border: BORDER.standard, borderRadius: '0px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                                        {filteredEntities.map(e => (
                                            <div 
                                                key={e.id} 
                                                onClick={() => { toggleRegion(e.id); setEntitySearch(''); setShowEntityDrop(false); }}
                                                style={{ padding: '8px', borderBottom: BORDER.standard, cursor: 'pointer' }}
                                                className="hover-bg-elevated"
                                            >
                                                <Text size="xs" block weight="bold">{e.name}</Text>
                                                <Text family="mono" style={{ fontSize: '9px', color: COLOR.text.muted }}>{e.id}</Text>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Active Comparisons list */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: SPACE[4] }}>
                                {activeRegions.map(code => (
                                    <div 
                                        key={code}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: COLOR.bg.elevated, border: BORDER.standard }}
                                    >
                                        <Text family="mono" size="xs" weight="bold">{code}</Text>
                                        {activeRegions.length > 1 && (
                                            <X size={10} style={{ cursor: 'pointer', color: COLOR.text.muted }} 
                                               onClick={() => toggleRegion(code)} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Presets for Regions - Grid layout based on user screenshot */}
                            <div>
                                {MAJOR_ECONOMIES.map(group => (
                                    <div key={group.group} style={{ marginBottom: SPACE[4] }}>
                                        <Text size="xs" color="muted" weight="bold" style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>{group.group}</Text>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                            {group.items.map(e => {
                                                const isActive = activeRegions.includes(e.code);
                                                return (
                                                    <Tag 
                                                        key={e.code}
                                                        label={e.code}
                                                        variant={isActive ? 'info' : 'muted'}
                                                        style={{ 
                                                            height: '24px', justifyContent: 'center', cursor: 'pointer',
                                                            opacity: isActive ? 1 : 0.6
                                                        }}
                                                        onClick={() => toggleRegion(e.code)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: COLOR.bg.base }}>
                    
                    {/* Visualizer Header */}
                    <div style={{ padding: `${SPACE[4]} ${SPACE[5]}`, borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                             <div style={{ width: '4px', height: '32px', background: COLOR.semantic.info, borderRadius: '0px' }} />
                             <div>
                                <Text size="xl" weight="black" block style={{ letterSpacing: '-0.02em', color: COLOR.text.primary, fontFamily: TYPE.family.heading }}>{activeIndicator.name}</Text>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                    <Text size="xs" color="muted" weight="bold" style={{ letterSpacing: '0.05em' }}>
                                        {activeRegions.map(c => allEntities.find(e => e.id === c)?.name || c).join(' VS ')} 
                                    </Text>
                                    <span style={{ fontSize: '10px', opacity: 0.3 }}>|</span>
                                    <Text size="xs" color="muted" family="mono">{fromYear} — {toYear}</Text>
                                </div>
                             </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {loading && <RefreshCw size={14} className="spin" color={COLOR.semantic.info} />}
                        </div>
                    </div>

                    {/* Data View */}
                    <div style={{ flex: 1, padding: viewMode === 'chart' ? SPACE[5] : 0, overflow: 'hidden' }}>
                        {error ? (
                            <EmptyState icon={<AlertCircle size={48} strokeWidth={1} color={COLOR.semantic.down} />} message="DATA_ERROR" subMessage={error} />
                        ) : loading && data.length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Loader2 size={32} className="spin" color={COLOR.semantic.info} />
                            </div>
                        ) : data.length === 0 && !loading ? (
                            <EmptyState icon={<BarChart2 size={48} strokeWidth={1} />} message="NO_DATA" subMessage="No historical data found for the selected entity and indicator." />
                        ) : viewMode === 'chart' ? (
                            <IndicatorChart data={data} chartType="area" />
                        ) : (
                            <DataTable data={data} />
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } 
                .spin { animation: spin 1s linear infinite; }
                .hover-bg-elevated:hover { background-color: ${COLOR.bg.elevated} !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${COLOR.bg.border}; border-radius: 0px; }
            `}</style>
        </WidgetShell>
    );
};

export default WorldBankExplorer;
