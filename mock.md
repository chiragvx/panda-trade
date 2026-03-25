# Mock Data Audit

Status: No active mock data sources in runtime code.

Audit scope:
- Removed `src/mock/*` (all previous mock hooks and symbol lists)
- Replaced widget-level seeded datasets with live API/store values or explicit empty/zero states
- Removed simulated order execution fallback
- Cleared seeded watchlist/global defaults

If a feed is unavailable, the UI now shows empty rows or `0` values instead of generated/sample data.
