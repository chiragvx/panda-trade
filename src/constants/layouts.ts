import { IJsonModel } from 'flexlayout-react';

const GLOBAL_CONFIG = {
    tabSetEnableTabStrip: true,
    tabSetEnableMaximize: true,
    tabSetEnableClose: false,
    tabEnableClose: true,
    tabEnableRename: false,
};

// Default layout for new users
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

export const EXECUTION_LAYOUT: IJsonModel = CASUAL_LAYOUT;
