import { IJsonModel } from 'flexlayout-react';

const GLOBAL_CONFIG = {
    tabSetEnableTabStrip: true,
    tabSetEnableMaximize: true,
    tabSetEnableClose: false,
    tabEnableClose: true,
    tabEnableRename: false,
};

export const DEFAULT_LAYOUT: IJsonModel = {
  global: GLOBAL_CONFIG,
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset", id: "ts_left", weight: 22,
        children: [{ type: "tab", name: "Watchlist", component: "watchlist" }]
      },
      {
        type: "column", weight: 50,
        children: [
          { type: "tabset", id: "ts_main", weight: 70, children: [{ type: "tab", name: "Chart", component: "chart" }] },
          { type: "tabset", id: "ts_bottom", weight: 30, children: [{ type: "tab", name: "Orders", component: "orders" }, { type: "tab", name: "Positions", component: "positions" }] }
        ]
      },
      {
        type: "tabset", id: "ts_right", weight: 28,
        children: [{ type: "tab", name: "News", component: "news" }, { type: "tab", name: "Market Depth", component: "depth" }]
      }
    ]
  }
};

export const EXECUTION_LAYOUT: IJsonModel = DEFAULT_LAYOUT;

export const ANALYSIS_LAYOUT: IJsonModel = {
    global: GLOBAL_CONFIG,
    layout: {
        type: "row",
        children: [
            {
                type: "column", weight: 30,
                children: [
                    { type: "tabset", weight: 50, children: [{ type: "tab", name: "Watchlist", component: "watchlist" }] },
                    { type: "tabset", weight: 50, children: [{ type: "tab", name: "Trending", component: "trending" }] }
                ]
            },
            {
                type: "tabset", weight: 70, children: [{ type: "tab", name: "Full Chart", component: "chart" }, { type: "tab", name: "Macro News", component: "news" }]
            }
        ]
    }
};

export const DERIVATIVES_LAYOUT: IJsonModel = {
    global: GLOBAL_CONFIG,
    layout: {
        type: "row",
        children: [
            {
                type: "tabset", weight: 25,
                children: [{ type: "tab", name: "F&O Watchlist", component: "watchlist" }]
            },
            {
                type: "column", weight: 50,
                children: [
                    { type: "tabset", weight: 60, children: [{ type: "tab", name: "Options Chart", component: "chart" }] },
                    { type: "tabset", weight: 40, children: [{ type: "tab", name: "Order Book", component: "orders" }, { type: "tab", name: "F&O Positions", component: "positions" }] }
                ]
            },
            {
                type: "tabset", weight: 25,
                children: [{ type: "tab", name: "Option Chain", component: "depth" }, { type: "tab", name: "Greeks", component: "depth" }]
            }
        ]
    }
};
