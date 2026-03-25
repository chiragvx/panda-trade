import React, { useState, useEffect } from 'react';
import { TabNode } from 'flexlayout-react';
import { useSelectionStore } from '../../store/useStore';
import { X, ArrowRightLeft, ShieldCheck, Zap } from 'lucide-react';

interface OrderEntryWidgetProps {
    node?: TabNode;
}

export const OrderEntryWidget: React.FC<OrderEntryWidgetProps> = ({ node }) => {
    const { selectedSymbol: globalSymbol } = useSelectionStore();
    const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
    const [symbol, setSymbol] = useState(globalSymbol?.ticker || '');
    const [price, setPrice] = useState('0.00');
    const [qty, setQty] = useState('1');

    useEffect(() => {
        if (node) {
            const name = node.getName();
            // Expected name format: "SYMBOL BUY" or "SYMBOL SELL"
            const parts = name.split(' ');
            if (parts.length >= 2) {
                setSymbol(parts[0]);
                setMode(parts[1] === 'SELL' ? 'SELL' : 'BUY');
            }
        }
    }, [node]);

    useEffect(() => {
        if (!node && globalSymbol) {
            setSymbol(globalSymbol.ticker);
            setPrice(globalSymbol.ltp.toString());
        }
    }, [globalSymbol, node]);

    return (
        <div className={`flex flex-col h-full w-full select-none overflow-hidden transition-colors duration-300 ${
            mode === 'BUY' ? 'bg-accent-green/5' : 'bg-accent-red/5'
        }`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between transition-colors ${
                mode === 'BUY' ? 'border-accent-green/20' : 'border-accent-red/20'
            }`}>
                <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg transition-all ${
                        mode === 'BUY' ? 'bg-accent-green shadow-green-900/20' : 'bg-accent-red shadow-red-900/20'
                    }`}>
                        {mode === 'BUY' ? 'B' : 'S'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-text-primary uppercase tracking-tight">{symbol || 'SELECT SYMBOL'}</span>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Limit Order</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1.5 px-2 py-1 rounded bg-bg-elevated border transition-all ${
                         mode === 'BUY' ? 'border-accent-green/30 text-accent-green' : 'border-accent-red/30 text-accent-red'
                    }`}>
                        <Zap size={10} className="animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Live Order</span>
                    </div>
                </div>
            </div>

            {/* Inputs */}
            <div className="flex-1 p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Quantity</label>
                        <input 
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            className="w-full bg-bg-primary border border-border/50 rounded-xl px-4 py-3 text-sm font-mono font-bold text-text-primary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Price</label>
                        <input 
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-bg-primary border border-border/50 rounded-xl px-4 py-3 text-sm font-mono font-bold text-text-primary focus:border-accent-blue focus:ring-1 focus:ring-accent-blue outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {['MARKET', 'LIMIT', 'SL'].map(type => (
                        <button key={type} className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                            type === 'LIMIT' ? 'bg-bg-elevated border-accent-blue text-accent-blue' : 'bg-transparent border-border/20 text-text-muted hover:border-border/50'
                        }`}>
                            {type}
                        </button>
                    ))}
                </div>

                <div className="p-4 bg-bg-primary/50 rounded-xl border border-border/20 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Margin Required</span>
                        <span className="text-sm font-mono font-bold text-text-primary">₹{(parseFloat(qty || '0') * parseFloat(price || '0')).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Available Cash</span>
                        <span className="text-[11px] font-mono font-bold text-accent-teal">₹1,42,500.20</span>
                    </div>
                    <div className="h-px bg-border/20" />
                    <div className="flex items-center space-x-2 text-accent-green">
                        <ShieldCheck size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Post-Trade Margin OK</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-bg-primary/30 border-t border-border/10">
                <button 
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center space-x-3 shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    mode === 'BUY' ? 'bg-accent-green text-white shadow-green-900/30' : 'bg-accent-red text-white shadow-red-900/30'
                }`}>
                    <span>Place {mode} Order</span>
                    <ArrowRightLeft size={18} />
                </button>
            </div>
        </div>
    );
};
