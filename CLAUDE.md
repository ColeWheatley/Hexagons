# Working with this repo

## Tasking OpenAI Codex agents

This repo's owner is on a limited Claude plan; expensive/frontier-model work
(investigation, architecture, verification) stays with Claude, but grindy or
open-ended implementation work — tuning sweeps, test harnesses, mechanical
merges, bench-gated perf iteration — should be delegated to **Codex** (its
tokens are effectively free to him). Treat this as the default split, not an
occasional trick.

### The binary is not on PATH

```
/Applications/Codex.app/Contents/Resources/codex
```

Auth is already configured (`codex login status` → "Logged in using ChatGPT").
Default config (`~/.codex/config.toml`) is `model = "gpt-5.5"`,
`model_reasoning_effort = "xhigh"` — fine to rely on those defaults, or pass
`-m`/`-c model_reasoning_effort=...` explicitly for clarity in scripts.

### Isolation: use a standalone clone, not a worktree — AND pass `--add-dir` for `.git` regardless

`git worktree add` looks appealing but **breaks commits worse than a clone
does**: worktree git metadata lives in the *main* repo's
`.git/worktrees/<name>/`, outside whatever directory you hand to Codex's
sandbox.

Prefer a standalone clone:

```bash
git clone -q /path/to/repo /path/to/Hexagons-codex/<task-name>
cd /path/to/Hexagons-codex/<task-name>
git checkout -q -b codex/<task-name>
```

**But a plain clone is not sufficient by itself** — Codex's macOS sandbox
blocks writes to *any* `.git` directory by default, even inside a real
clone that's otherwise fully inside the workspace-write root (verified:
`touch .git/probe` → `Operation not permitted`, confirmed by direct
reproduction, not just inferred from a failed commit). Every launch —
including `resume` calls — needs:

```bash
--add-dir /path/to/Hexagons-codex/<task-name>/.git
```

For a worktree (if you're stuck with one), the equivalent grant must point
at the **whole main repo's `.git`**, not just its
`.git/worktrees/<name>/` subfolder — `git add`/`git commit` in a worktree
touch shared refs/objects back in the primary `.git`, so a narrower
`--add-dir` still fails even though a probe *file write* inside
`.git/worktrees/<name>/` alone appears to succeed:

```bash
--add-dir /path/to/Hexagons/.git
```

Verify before trusting either: `touch .git/probe && rm .git/probe` (clone)
or `git commit --allow-empty -m probe` then `git reset --hard HEAD~1` to
clean it up (worktree, since the file-level probe can give a false
positive there).

Merge back later with a local remote-less merge — no push needed:
`git remote add tmp <clone-path> && git fetch tmp && git merge
tmp/<branch> && git remote remove tmp`.

Gitignored data (DEM/TIF sources, the basisu binary, baked `aerial_tiles`/
`tiles_bin` output) won't be in a fresh clone — symlink it in read-only from
the main checkout before launching:

```bash
ln -s /path/to/Hexagons/hex_backend/aerial_tifs hex_backend/aerial_tifs
ln -s /path/to/Hexagons/frontend/app/aerial_tiles frontend/app/aerial_tiles
```

### Launch syntax

```bash
codex exec -s workspace-write -m gpt-5.5 -c model_reasoning_effort=\"xhigh\" \
  - < CODEX_GOAL.md > run.log 2>&1 &
disown
```

- `-` reads the prompt from stdin — write a real brief to a file
  (`CODEX_GOAL.md` in the task clone) rather than inlining a short prompt.
  Long, explicit, self-contained briefs produce far better results than
  short ones (same principle as briefing a subagent).
- For network access (npm installs, CDN fetches, `pip install`, running a
  headless-Chrome bench that loads the app's CDN-hosted three.js):
  add `-c sandbox_workspace_write.network_access=true`.
- Always background it (`run_in_background: true` on the Bash tool, or `&
  disown` at the shell level) — these are long, autonomous sessions, not
  quick calls.
- **`disown` isn't a full guarantee.** If the host machine itself reboots or
  the whole Claude Code session is torn down (observed: a runaway ~90GB RAM
  process forced a hard restart), the detached `codex exec` process dies too
  and nothing survives except what's on disk. There's no way to fully
  outrun that from inside the agent — the mitigation is aggressive commit
  discipline (see below), not the launch flags.

### Resuming a session

Flags go on `exec`, **before** the `resume` subcommand — this is easy to get
backwards and fails with a confusing arg-parsing error:

```bash
# WRONG: codex exec resume <id> -s workspace-write ...  (flags rejected)
codex exec -s workspace-write -m gpt-5.5 -c model_reasoning_effort=\"xhigh\" \
  resume <session-id> "follow-up instructions"
```

`resume` preserves the agent's prior context, so prefer it over a cold
relaunch whenever a session ID is known (each launch's startup banner prints
`session id: ...` — capture it in the log).

### Brief structure that works

- **Explicit deliverables**, not vague goals — file paths, exact commit
  message formats, a definition of done.
- **A monitoring protocol you can poll cheaply.** Instruct the agent to
  commit after every discrete step (or, for grind loops, after every
  candidate — kept *or* reverted) with a consistent message prefix, e.g.
  `[tag] did X | next: Y | status: ok|blocked:<reason>`. Then check progress
  with `git log --oneline <base>..HEAD` on the clone instead of reading the
  full transcript (the transcript can be tens of thousands of tokens; the
  commit log is free). A background `Monitor` diffing `git log` on an
  interval works well for "notify me when something new lands."
- **Commit early, commit often — this is the actual crash-durability
  mechanism**, more important than clever recovery logic. A brief that says
  "commit when a phase completes" is not aggressive enough; say "commit
  after every candidate, including a bare ledger-only commit for a rejected
  one" instead. Uncommitted work is unrecoverable if the process dies.
- **Bench-gated work needs a numeric gate spelled out in the brief**
  (e.g. "keep a change iff metric X improves ≥3% and none of {Y, Z} regress
  by >3%; measure 3× and use the median for close calls") — otherwise the
  agent's judgment calls on "is this better" are inconsistent.
- If a sandboxed agent needs to bench the actual app: headless Chrome
  (`--headless=new`) *does* expose WebGL compressed-texture extensions on
  this machine (verified: ASTC/BC7/etc. all present under ANGLE Metal on
  M1) — no need for a visible window. A **visible-but-unfocused** tab is
  the trap: Chrome suspends `requestAnimationFrame` for any tab that isn't
  the visible/focused one, which silently freezes anything driven by rAF
  (the app's render loop, a benchmark script, a profiler). Drive benches
  over the Chrome DevTools Protocol instead of relying on tab visibility.

### `ps`/`pgrep` are hard-blocked in the sandbox — don't design safety rules around them

Codex's `workspace-write` sandbox denies process-table introspection
entirely: `ps aux`, `pgrep -f ...` — anything that lists other processes —
fails with `operation not permitted` / `sysmon request failed: sysmond
service not found`. This is a syscall-level seatbelt restriction, not a
permissions/flag issue, and no `--add-dir`-style override exists for it
(verified by direct reproduction).

Consequence: a brief that tells an agent "check `pgrep` before launching
Chrome to make sure nothing stale is still running" is asking for something
impossible inside its own sandbox. (This happened: an agent correctly
refused to bench at all rather than violate that rule, which was the right
call given what it had — but the rule itself needed fixing, not the
agent.) Design process-hygiene rules that don't require introspection:

- **Structural single-instance discipline**: never `Popen()` a new instance
  until the previous subprocess handle's `.wait()` has actually returned.
  This guarantees single-flight without needing to see the system process
  table at all.
- **Proper per-launch teardown**: `try/finally` with `terminate()` → `kill()`
  fallback → `wait()`, unique `--user-data-dir` per launch, `rm -rf` it in
  the `finally` block.
- **An external tripwire the orchestrator (not the sandboxed agent) runs**,
  since only something outside the sandbox can actually see the process
  table: a background loop summing a target process name's RSS
  (`ps -axo rss,comm | grep ... | awk '{sum+=$1}...'`) and force-killing
  past a threshold. This is the real backstop — treat it as required
  whenever a sandboxed agent repeatedly launches heavy subprocesses
  (headless browsers especially), not optional. Confirmed effective in
  practice: it killed a runaway Chrome accumulation at ~6.5GB and ~7GB RSS
  before either became a full OOM.

### Known-safe example

`scripts/run_bench.py` in this repo is a working reference for a
CDP-driven headless bench runner (launches Chrome, polls a page-side
`localStorage` report key, saves JSON + a screenshot, tears down cleanly).
Point new bench-writing briefs at it instead of having each agent reinvent
one from scratch.
