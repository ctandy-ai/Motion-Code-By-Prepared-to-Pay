# Stride / P2P – Programs + Calendar + Goal-Aware Builder
Generated: 2025-11-05

## What you get
- **Programs**: Build weeks from milestones (YOUR exercises), then save named programs for reuse.
- **Calendar**: Schedule sessions per athlete by date.
- **Goal-aware AI**: If athlete goal = "marathon", builder reduces plyo contacts and adds MAS/long-run hints.

## Quick Start (Replit)
1) New **Python** Repl → upload `replit_p2p_app_full.zip` → **Extract here**.
2) Shell:
   ```bash
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
3) Webview:
   - Create athlete (belt/goal/bandwidth)
   - Select milestones → **Build Week** → **Save Program**
   - Add sessions to **Calendar** per date

## Endpoints
- `POST /api/build-week` → `{week}` (goal-aware)
- `POST /api/programs`, `GET /api/programs`
- `POST /api/calendar`, `GET /api/calendar/{athlete_id}`
- `GET /api/library/exercises`, `GET /api/library/mbs`, `GET /api/milestones`
