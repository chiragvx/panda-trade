import React, { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Key, Anchor, ShieldCheck } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

export const AisStreamConnect: React.FC = () => {
    const { aisStreamApiKey, setAisStreamApiKey, addConnection } = useSettingsStore();
    const [tempKey, setTempKey] = useState(aisStreamApiKey);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setAisStreamApiKey(tempKey);
        addConnection('aisstream-01');
        setTimeout(() => setIsSaving(false), 800);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: COLOR.bg.surface,
        border: BORDER.standard,
        padding: '8px 10px',
        fontSize: TYPE.size.md,
        fontFamily: TYPE.family.mono,
        color: COLOR.text.primary,
        outline: 'none',
        borderRadius: 0,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: TYPE.size.xs,
        fontWeight: TYPE.weight.bold,
        color: COLOR.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: TYPE.letterSpacing.caps,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '6px',
    };

    return (
        <div style={{ padding: SPACE[2], display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Anchor size={20} color={COLOR.semantic.info} />
                <div>
                   <h3 style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.black, color: COLOR.text.primary, margin: 0, letterSpacing: TYPE.letterSpacing.caps }}>AISSTREAM_PROTOCOL</h3>
                   <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold, letterSpacing: TYPE.letterSpacing.tight }}>Required for life-stream Marine tracking data.</span>
                </div>
            </div>

            <div style={{ borderTop: BORDER.standard, paddingTop: SPACE[4] }}>
                <label style={labelStyle}><Key size={12} /> AISSTREAM API KEY</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                        type="password" 
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        style={inputStyle}
                        placeholder="Paste your API key here..."
                    />
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ 
                            background: isSaving ? COLOR.bg.elevated : COLOR.semantic.info,
                            border: 'none',
                            color: COLOR.text.inverse,
                            padding: '0 16px',
                            fontSize: TYPE.size.xs,
                            fontWeight: TYPE.weight.black,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            letterSpacing: TYPE.letterSpacing.caps,
                            borderRadius: '2px'
                        }}
                    >
                        {isSaving ? 'UPDATING...' : 'SAVE'}
                    </button>
                </div>
            </div>

            {aisStreamApiKey && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: TYPE.size.xs, color: COLOR.semantic.up, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>
                    <ShieldCheck size={12} />
                    <span>API_KEY_STORAGE_ACTIVE</span>
                </div>
            )}
        </div>
    );
};
