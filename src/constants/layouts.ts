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
      {
        type: "tabset",
        weight: 22,
        children: [{ type: "tab", name: "Watchlist", component: "watchlist" }]
      },
      {
        type: "column",
        weight: 78,
        children: [
          {
            type: "tabset",
            weight: 64,
            children: [{ type: "tab", name: "Main Chart", component: "chart" }]
          },
          {
            type: "tabset",
            weight: 36,
            selected: 0,
            children: [
              { type: "tab", name: "Orders", component: "orders" },
              { type: "tab", name: "Positions", component: "positions" },
              { type: "tab", name: "Holdings", component: "holdings" }
            ]
          }
        ]
      }
    ]
  }
};

export const EXECUTION_LAYOUT: IJsonModel = CASUAL_LAYOUT;
