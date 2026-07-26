// @atlas: In-app benchmark launcher. Scenario buttons reload the page with
// `?bench=<name>&dev=1[&benchDuration=<n>]` — a fresh load is the
// deterministic starting point `benchmark.js` expects. Also surfaces the
// current profiler's live report and the last persisted run
// (`localStorage['hexagons:perfProfiler:lastRun']`), including a crash
// recovery notice when that run never finished.

const LAST_RUN_KEY = 'hexagons:perfProfiler:lastRun';

const SCENARIOS = [
    { name: 'coldload', label: 'Cold Load', duration: 45 },
    { name: 'orbit', label: 'Orbit', duration: 60 },
    { name: 'traverse', label: 'Traverse', duration: 90 },
    { name: 'stress', label: 'Stress', duration: 120 },
    { name: 'capability', label: 'Capability', duration: 20 },
];

function readLastRun() {
    try {
        const raw = localStorage.getItem(LAST_RUN_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function downloadJson(data, filenamePrefix) {
    try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const scenario = data?.meta?.scenario || 'manual';
        const pipeline = data?.meta?.texturePipeline || 'unknown';
        a.href = url;
        a.download = `${filenamePrefix}_${pipeline}_${scenario}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
        console.warn('[DEV] Failed to download report:', e);
    }
}

export function buildBenchSection(viewer) {
    const section = document.createElement('div');
    section.className = 'collapsible-section collapsed';
    section.dataset.section = 'bench';

    const header = document.createElement('button');
    header.className = 'collapsible-header';
    header.type = 'button';
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', 'bench-content');
    header.innerHTML = '<span class="title">BENCHMARKS</span><span class="arrow" aria-hidden="true">▼</span>';

    const content = document.createElement('div');
    content.className = 'collapsible-content';
    content.id = 'bench-content';
    content.hidden = true;
    content.setAttribute('aria-hidden', 'true');

    const btnRow = document.createElement('div');
    btnRow.className = 'dev-bench-btn-row';

    const durationRow = document.createElement('div');
    durationRow.className = 'hud-item dev-bench-duration-row';
    const durationLabel = document.createElement('label');
    durationLabel.htmlFor = 'bench-duration';
    durationLabel.textContent = 'DURATION OVERRIDE';
    const durationInput = document.createElement('input');
    durationInput.type = 'number';
    durationInput.id = 'bench-duration';
    durationInput.placeholder = 'default s';
    durationInput.min = '10';
    durationInput.className = 'dev-bench-duration';
    durationRow.append(durationLabel, durationInput);

    for (const scenario of SCENARIOS) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bench-btn';
        btn.dataset.scenario = scenario.name;
        btn.textContent = `${scenario.label} (${scenario.duration}s)`;
        btn.addEventListener('click', () => {
            const url = new URL(location.href);
            url.searchParams.set('bench', scenario.name);
            const override = durationInput.value.trim();
            if (override) url.searchParams.set('benchDuration', String(parseInt(override, 10)));
            else url.searchParams.delete('benchDuration');
            url.searchParams.set('dev', '1');
            location.assign(url);
        });
        btnRow.appendChild(btn);
    }

    const note = document.createElement('div');
    note.className = 'dev-bench-note';
    note.textContent =
        'Launching a scenario reloads the page with dev mode on. The run is scripted and deterministic; ' +
        'its report is captured automatically and can be downloaded below once finished.';

    const actionsRow = document.createElement('div');
    actionsRow.className = 'dev-bench-actions-row';

    const downloadCurrentBtn = document.createElement('button');
    downloadCurrentBtn.type = 'button';
    downloadCurrentBtn.id = 'bench-download-current';
    downloadCurrentBtn.className = 'bench-action-btn';
    downloadCurrentBtn.textContent = 'Download Current Report';
    downloadCurrentBtn.addEventListener('click', () => {
        viewer.profiler?.downloadReport();
    });

    const downloadLastBtn = document.createElement('button');
    downloadLastBtn.type = 'button';
    downloadLastBtn.id = 'bench-download-last';
    downloadLastBtn.className = 'bench-action-btn';
    downloadLastBtn.textContent = 'Download Last Report';
    downloadLastBtn.addEventListener('click', () => {
        const report = readLastRun();
        if (!report) return;
        downloadJson(report, 'perf');
    });

    actionsRow.append(downloadCurrentBtn, downloadLastBtn);

    const summary = document.createElement('div');
    summary.id = 'bench-last-summary';
    summary.className = 'dev-bench-summary';

    const crashNotice = document.createElement('div');
    crashNotice.id = 'bench-crash-notice';
    crashNotice.className = 'dev-bench-crash-notice';
    crashNotice.hidden = true;

    content.append(btnRow, durationRow, note, actionsRow, summary, crashNotice);
    section.append(header, content);

    function refreshSummary() {
        downloadCurrentBtn.disabled = !viewer.profiler;
        downloadCurrentBtn.title = viewer.profiler ? '' : 'profiler off';

        const report = readLastRun();
        if (!report?.meta) {
            summary.textContent = 'no stored run';
            crashNotice.hidden = true;
            return;
        }

        const meta = report.meta;
        const fpsAvg = report.frames?.fps_avg_active;
        const p95 = report.frames?.p95_ms;
        const ageMs = Date.now() - new Date(meta.timestamp).getTime();
        const ageMin = Number.isFinite(ageMs) ? Math.max(0, Math.round(ageMs / 60000)) : '?';
        const status = meta.finished ? 'finished' : 'CRASHED';
        summary.textContent =
            `${meta.scenario || 'manual'} · ${Number.isFinite(fpsAvg) ? fpsAvg.toFixed(1) : '--'} fps · ` +
            `p95 ${Number.isFinite(p95) ? p95.toFixed(1) : '--'}ms · ${status} · ${ageMin}min ago`;

        crashNotice.hidden = meta.finished !== false;
        if (meta.finished === false) {
            crashNotice.textContent =
                `Recovered an unfinished run (scenario=${meta.scenario || 'unknown'}, runId=${meta.runId || 'unknown'}). ` +
                'The profiler or the tab likely crashed mid-run; the report above reflects its last persisted snapshot.';
        }
    }

    refreshSummary();

    return { root: section, refreshSummary };
}
