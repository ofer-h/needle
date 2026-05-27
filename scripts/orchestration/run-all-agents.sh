#!/usr/bin/env bash
# =============================================================================
# Needle — Master Orchestration Script
# Orchestrator: Cowork / Claude (me)
# Run this on your Mac from the needle project root.
# Usage: bash scripts/orchestration/run-all-agents.sh
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ORCH_DIR="$REPO_ROOT/scripts/orchestration"
LOG_DIR="$ORCH_DIR/logs"
REPORT_DIR="$ORCH_DIR/reports"
BASE_BRANCH="needle-ai-orchestration"

mkdir -p "$LOG_DIR" "$REPORT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       NEEDLE — PARALLEL AGENT ORCHESTRATION         ║"
echo "║                                                      ║"
echo "║  Agent A → v2 Store Adapter      (Claude Code)      ║"
echo "║  Agent B → SQLite Persistence    (Claude Code)      ║"
echo "║  Agent C → Capture Refactor      (Claude Code)      ║"
echo "║  Agent D → Anthropic API         (Antigravity agy)  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Verify we are on the orchestration branch
cd "$REPO_ROOT"
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "$BASE_BRANCH" ]; then
  echo "⚠️  Not on $BASE_BRANCH (you are on $CURRENT)"
  echo "   Run: git checkout $BASE_BRANCH"
  exit 1
fi

echo "✅ On branch: $BASE_BRANCH"
echo ""

# ── Helper: create agent branch if it doesn't exist ──────────────────────────
create_branch() {
  local branch=$1
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    echo "   Branch $branch already exists — skipping create"
  else
    git checkout -b "$branch"
    git checkout "$BASE_BRANCH"
    echo "   Created branch: $branch"
  fi
}

echo "── Creating agent branches ──────────────────────────────────────────────"
create_branch "agent/v2-store-adapter"
create_branch "agent/sqlite-persistence"
create_branch "agent/capture-refactor"
create_branch "agent/anthropic-api"
echo ""

# ── Agent A: V2 Store Adapter (Claude Code) ───────────────────────────────────
echo "── Launching Agent A: V2 Store Adapter ─────────────────────────────────"
AGENT_A_PROMPT=$(cat "$ORCH_DIR/agent-a-v2-store-adapter.md")
(
  cd "$REPO_ROOT"
  git checkout "agent/v2-store-adapter"
  echo "[$(date +%H:%M)] Agent A started" >> "$LOG_DIR/agent-v2-store-adapter.log"
  claude -p \
    --dangerously-skip-permissions \
    --model claude-opus-4-5 \
    --add-dir "$REPO_ROOT" \
    "$AGENT_A_PROMPT" \
    >> "$LOG_DIR/agent-v2-store-adapter.log" 2>&1
  echo "[$(date +%H:%M)] Agent A finished" >> "$LOG_DIR/agent-v2-store-adapter.log"
  git checkout "$BASE_BRANCH"
) &
AGENT_A_PID=$!
echo "   PID: $AGENT_A_PID — tailing: tail -f $LOG_DIR/agent-v2-store-adapter.log"
echo ""

# ── Agent B: SQLite Persistence (Claude Code) ────────────────────────────────
echo "── Launching Agent B: SQLite Persistence ───────────────────────────────"
AGENT_B_PROMPT=$(cat "$ORCH_DIR/agent-b-sqlite-persistence.md")
(
  cd "$REPO_ROOT"
  git checkout "agent/sqlite-persistence"
  echo "[$(date +%H:%M)] Agent B started" >> "$LOG_DIR/agent-sqlite-persistence.log"
  claude -p \
    --dangerously-skip-permissions \
    --model claude-sonnet-4-6 \
    --add-dir "$REPO_ROOT" \
    "$AGENT_B_PROMPT" \
    >> "$LOG_DIR/agent-sqlite-persistence.log" 2>&1
  echo "[$(date +%H:%M)] Agent B finished" >> "$LOG_DIR/agent-sqlite-persistence.log"
  git checkout "$BASE_BRANCH"
) &
AGENT_B_PID=$!
echo "   PID: $AGENT_B_PID — tailing: tail -f $LOG_DIR/agent-sqlite-persistence.log"
echo ""

# ── Agent C: Capture Screen Refactor (Claude Code) ───────────────────────────
echo "── Launching Agent C: Capture Screen Refactor ──────────────────────────"
AGENT_C_PROMPT=$(cat "$ORCH_DIR/agent-c-capture-refactor.md")
(
  cd "$REPO_ROOT"
  git checkout "agent/capture-refactor"
  echo "[$(date +%H:%M)] Agent C started" >> "$LOG_DIR/agent-capture-refactor.log"
  claude -p \
    --dangerously-skip-permissions \
    --model claude-sonnet-4-6 \
    --add-dir "$REPO_ROOT" \
    "$AGENT_C_PROMPT" \
    >> "$LOG_DIR/agent-capture-refactor.log" 2>&1
  echo "[$(date +%H:%M)] Agent C finished" >> "$LOG_DIR/agent-capture-refactor.log"
  git checkout "$BASE_BRANCH"
) &
AGENT_C_PID=$!
echo "   PID: $AGENT_C_PID — tailing: tail -f $LOG_DIR/agent-capture-refactor.log"
echo ""

# ── Agent D: Anthropic API — Antigravity (manual launch) ─────────────────────
echo "── Agent D: Anthropic API — MANUAL STEP REQUIRED ───────────────────────"
echo "   Antigravity can't be launched by this script."
echo "   Open a new terminal tab and run:"
echo ""
echo "   cd $REPO_ROOT"
echo "   git checkout agent/anthropic-api"
echo "   agy run \"\$(cat scripts/orchestration/agent-d-anthropic-api-agy.md | tail -n +12)\""
echo ""
echo "   Or just: agy chat  — then paste the prompt from agent-d-anthropic-api-agy.md"
echo ""

# ── Monitor loop ──────────────────────────────────────────────────────────────
echo "── Waiting for agents A, B, C to complete ──────────────────────────────"
echo "   Monitor live logs:"
echo "   tail -f $LOG_DIR/agent-v2-store-adapter.log"
echo "   tail -f $LOG_DIR/agent-sqlite-persistence.log"
echo "   tail -f $LOG_DIR/agent-capture-refactor.log"
echo ""

# Wait for all background agents
wait $AGENT_A_PID && echo "✅ Agent A (v2-store-adapter) complete" || echo "❌ Agent A failed — check log"
wait $AGENT_B_PID && echo "✅ Agent B (sqlite-persistence) complete" || echo "❌ Agent B failed — check log"
wait $AGENT_C_PID && echo "✅ Agent C (capture-refactor) complete" || echo "❌ Agent C failed — check log"

echo ""
echo "── Verifying each agent branch ─────────────────────────────────────────"

verify_branch() {
  local branch=$1
  local name=$2
  echo ""
  echo "  Checking $name ($branch)..."
  git checkout "$branch" 2>/dev/null
  if npm run typecheck --silent 2>/dev/null; then
    echo "  ✅ typecheck OK"
  else
    echo "  ❌ typecheck FAILED — DO NOT MERGE"
    git checkout "$BASE_BRANCH"
    return 1
  fi
  if npm run lint --silent 2>/dev/null; then
    echo "  ✅ lint OK"
  else
    echo "  ❌ lint FAILED — DO NOT MERGE"
    git checkout "$BASE_BRANCH"
    return 1
  fi
  git checkout "$BASE_BRANCH"
  return 0
}

MERGE_A=false; MERGE_B=false; MERGE_C=false

verify_branch "agent/v2-store-adapter" "Agent A" && MERGE_A=true
verify_branch "agent/sqlite-persistence" "Agent B" && MERGE_B=true
verify_branch "agent/capture-refactor" "Agent C" && MERGE_C=true

echo ""
echo "── Merging passing branches into $BASE_BRANCH ──────────────────────────"
git checkout "$BASE_BRANCH"

if $MERGE_C; then
  echo "  Merging agent/capture-refactor (no dependencies)..."
  git merge --no-ff "agent/capture-refactor" -m "merge: capture screen refactor from agent C"
  echo "  ✅ Merged capture-refactor"
else
  echo "  ⏭️  Skipping capture-refactor (failed verification)"
fi

if $MERGE_A; then
  echo "  Merging agent/v2-store-adapter..."
  git merge --no-ff "agent/v2-store-adapter" -m "merge: v2 store adapter from agent A"
  echo "  ✅ Merged v2-store-adapter"
else
  echo "  ⏭️  Skipping v2-store-adapter (failed verification)"
fi

if $MERGE_B; then
  echo "  Merging agent/sqlite-persistence..."
  git merge --no-ff "agent/sqlite-persistence" -m "merge: SQLite persistence from agent B"
  echo "  ✅ Merged sqlite-persistence"
else
  echo "  ⏭️  Skipping sqlite-persistence (failed verification)"
fi

echo ""
echo "── Final verification on $BASE_BRANCH ──────────────────────────────────"
npm run typecheck && echo "✅ typecheck clean" || echo "❌ typecheck errors after merge — fix manually"
npm run lint && echo "✅ lint clean" || echo "❌ lint errors after merge — fix manually"

echo ""
echo "── Reports ──────────────────────────────────────────────────────────────"
ls "$REPORT_DIR"/*.md 2>/dev/null && cat "$REPORT_DIR"/*.md || echo "  No reports yet — agents may still be running or reports not written"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Orchestration complete.                            ║"
echo "║  Remaining: Agent D (agy) on agent/anthropic-api   ║"
echo "║  When done: merge agent/anthropic-api manually      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
