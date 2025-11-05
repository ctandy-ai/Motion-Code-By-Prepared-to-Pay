# Stride / P2P – Programs + Calendar + Coach Assistant (embedded chat)
Generated: 2025-11-05

## What you get
- **Programs**: Build weeks from milestones (YOUR exercises) and save for reuse.
- **Calendar**: Schedule sessions for each athlete.
- **Coach Assistant** (chat-style): Type natural language; it updates athlete goal/bandwidth, suggests milestones, and pre-fills the builder.

## Replit Quick Start
1) New **Python** Repl → upload `replit_p2p_app_assistant.zip` → **Extract here**.
2) Shell:
   ```bash
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
3) Webview:
   - Create athlete → Open **Coach Assistant** → type: *"Training for a marathon; bandwidth low. Add MS_ST_UNILAT_SYM."*
   - It updates the athlete and preselects milestones → Click **Build Week** → **Save Program** → add to **Calendar**.

