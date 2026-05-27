# Agent D — Anthropic API Integration
# Tool: Antigravity (agy) — run this on your Mac
# Branch: agent/anthropic-api

## Run this on your Mac terminal:
```bash
cd ~/dev/needle
git checkout needle-ai-orchestration
git checkout -b agent/anthropic-api
agy run "$(cat scripts/orchestration/agent-d-anthropic-api-agy.md | tail -n +12)"
```

## Prompt for agy (everything below this line is the agent prompt):

You are working on Needle — a macOS Electron app for ADHD task management.
Read scripts/orchestration/KNOWLEDGE_PACK.md before doing anything else.
Then read PRD.md sections "Capture" and "AI Classification".
Then read src/renderer/components/Capture/CaptureScreen.tsx.
Then read src/shared/ipc-contracts.ts.
Then read src/shared/types.ts.

Your task: wire up the Anthropic API for capture classification.

## Branch
You are on branch agent/anthropic-api. Commit after each step.

## Step 1: Install Anthropic SDK
```
npm install @anthropic-ai/sdk --legacy-peer-deps
```

## Step 2: Create AI service (src/main/ai/classify.ts)
Build a classify() function that takes a raw capture string and returns:
```typescript
interface ClassificationResult {
  bucket: 'act' | 'remember';
  title: string;           // cleaned-up, actionable version of the input
  suggestedDate?: string;  // YYYY-MM-DD if Act and has a time dimension
  suggestedTime?: string;  // HH:MM if specific time detected
  reasoning: string;       // one sentence explaining why
  confidence: number;      // 0-1
}
```

The prompt for Claude should:
- Be a focused system prompt that understands the Act/Remember distinction
- Include examples of each bucket
- Output structured JSON that maps to ClassificationResult
- Be optimized for speed (use claude-haiku-4-5 model — fast and cheap for classification)

Read docs/v2/product-direction.md for the product philosophy before writing the prompt.

## Step 3: API key handling (src/main/ai/config.ts)
- Read ANTHROPIC_API_KEY from process.env
- If not set, check app.getPath('userData') + '/config.json' for { "anthropicApiKey": "..." }
- Export getApiKey(): string | null
- Never log or expose the key

## Step 4: IPC handler (src/main/ipc/ai-handlers.ts)
Add IPC channel 'ai:classify' that:
- Takes { text: string }
- Calls classify(text)
- Returns ClassificationResult
- Handles errors gracefully (API down, no key, rate limit) — return { error: string } on failure

Register in src/main/ipc/index.ts.

## Step 5: Preload + window.d.ts
Expose ai:classify through contextBridge following existing patterns in src/preload/index.ts.
Add type to src/renderer/window.d.ts.

## Step 6: Wire into CaptureScreen
In src/renderer/components/Capture/CaptureScreen.tsx:
- When user submits capture text, call window.api.classify(text)
- Show the "classifying" state during the API call
- On result, show the classified output (bucket, title, suggested date)
- On error, show the raw text with a fallback "Save as Remember" option

## Step 7: API key setup UI (minimal)
Add a simple settings section somewhere accessible (could be a modal or a small toolbar item)
where the user can paste their Anthropic API key and save it to userData/config.json.
Keep it minimal — one input, one save button.

## Verification
- npm run typecheck — must pass
- npm run lint — must pass  
- Test with a real API key if available, or mock the response if not
- Log results to scripts/orchestration/logs/agent-anthropic-api.log

## Report
Write to scripts/orchestration/reports/agent-anthropic-api.md when done.
