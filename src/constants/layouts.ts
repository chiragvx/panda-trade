import { IJsonModel } from 'flexlayout-react';

const GLOBAL_CONFIG = {
    tabSetEnableTabStrip: true,
    tabSetEnableMaximize: true,
    tabSetEnableClose: false,
    tabEnableClose: true,
    tabEnableRename: false,
};

// 1. CASUAL
export const CASUAL_LAYOUT: IJsonModel = {
  global: GLOBAL_CONFIG,
  layout: {
    type: "row",
    children: [
      { type: "tabset", weight: 30, children: [{ type: "tab", name: "Watchlist", component: "watchlist" }] },
      { type: "tabset", weight: 70, children: [{ type: "tab", name: "Main Chart", component: "chart" }] },
      { type: "tabset", weight: 30, children: [{ type: "tab", name: "Orders", component: "orders" }] }
    ]
  }
};

// 2. OPTIONS TRADER
export const OPTIONS_TRADER_LAYOUT: IJsonModel = {
    global: GLOBAL_CONFIG,
    layout: {
        type: "row",
        children: [
            { type: "tabset", weight: 20, children: [{ type: "tab", name: "F&O Scrips", component: "watchlist" }] },
            { 
              type: "column", weight: 50, 
              children: [
                { type: "tabset", weight: 60, children: [{ type: "tab", name: "Chart", component: "chart" }] },
                { type: "tabset", weight: 40, children: [{ type: "tab", name: "Positions", component: "positions" }] }
              ] 
            },
            { type: "tabset", weight: 30, children: [{ type: "tab", name: "Live Chain", component: "options-chain" }] }
        ]
    }
};

// 3. RESEARCH
export const RESEARCH_LAYOUT: IJsonModel = {
    global: GLOBAL_CONFIG,
    layout: {
        type: "row",
        children: [
            { type: "tabset", weight: 25, children: [{ type: "tab", name: "Fundamentals", component: "fundamentals" }, { type: "tab", name: "Technicals", component: "technicals" }] },
            { type: "tabset", weight: 50, children: [{ type: "tab", name: "Multi-Chart", component: "chart" }] },
            { type: "tabset", weight: 25, children: [{ type: "tab", name: "Macro News", component: "news" }, { type: "tab", name: "Corporate Actions", component: "corporate-actions" }] }
        ]
    }
};

// 4. PORTFOLIO MANAGER
export const PORTFOLIO_MANAGER_LAYOUT: IJsonModel = {
    global: GLOBAL_CONFIG,
    layout: {
        type: "row",
        children: [
            { type: "tabset", weight: 30, children: [{ type: "tab", name: "Holdings", component: "holdings" }] },
            { type: "tabset", weight: 40, children: [{ type: "tab", name: "Risk Monitor", component: "marine-map" }, { type: "tab", name: "Positions", component: "positions" }] },
            { type: "tabset", weight: 30, children: [{ type: "tab", name: "P&L Heatmap", component: "holdings-heatmap" }] }
        ]
    }
};

// 5. QUANT
export const QUANT_LAYOUT: IJsonModel = {
    global: GLOBAL_CONFIG,
    layout: {
        type: "row",
        children: [
            { type: "tabset", weight: 25, children: [{ type: "tab", name: "OI Analytics", component: "oi-graph" }, { type: "tab", name: "IV Chart", component: "iv-chart" }] },
            { type: "tabset", weight: 50, children: [{ type: "tab", name: "Skew Analysis", component: "volatility-skew" }, { type: "tab", name: "Chart", component: "chart" }] },
            { type: "tabset", weight: 25, children: [{ type: "tab", name: "Technicals", component: "technicals" }] }
        ]
    }
};

// 6. CHART TRADER
export const CHART_TRADER_LAYOUT: IJsonModel = {
    global: GLOBAL_CONFIG,
    layout: {
        type: "row",
        children: [
            { type: "tabset", weight: 70, children: [{ type: "tab", name: "Main Trading Chart", component: "chart" }] },
            { 
              type: "column", weight: 30, 
              children: [
                { type: "tabset", weight: 50, children: [{ type: "tab", name: "Options Chain", component: "options-chain" }] },
                { type: "tabset", weight: 50, children: [{ type: "tab", name: "OI Graph", component: "oi-graph" }] }
              ] 
            }
        ]
    }
};

// 7. PSYCHO
export const PSYCHO_LAYOUT: IJsonModel = {
    global: GLOBAL_CONFIG,
    layout: {
        type: "row",
        children: [
            { 
              type: "column", weight: 20, 
              children: [
                { type: "tabset", weight: 50, children: [{ type: "tab", name: "Fear & Greed", component: "fear-greed-index" }] }
              ] 
            },
            { type: "tabset", weight: 50, children: [{ type: "tab", name: "Psycho Chart", component: "chart" }, { type: "tab", name: "Live Chain", component: "options-chain" }] },
            { 
              type: "column", weight: 30, 
              children: [
                { type: "tabset", weight: 33, children: [{ type: "tab", name: "FII/DII", component: "fii-dii-activity" }] },
                { type: "tabset", weight: 33, children: [{ type: "tab", name: "Blocks", component: "block-deals" }] },
                { type: "tabset", weight: 34, children: [{ type: "tab", name: "Screener", component: "stock-screener" }] }
              ] 
            }
        ]
    }
};

export const EXECUTION_LAYOUT: IJsonModel = CASUAL_LAYOUT;
