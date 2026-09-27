export function retryDelayMs(failures, initialMs, maximumMs) {
    return Math.min(maximumMs, initialMs * 2 ** Math.max(0, failures - 1));
}

export function nextRetry(previous, now, initialMs, maximumMs) {
    const failures = (previous?.failures || 0) + 1;
    return { failures, retryAt: now + retryDelayMs(failures, initialMs, maximumMs) };
}

export function retryReady(record, now) {
    return !record || record.retryAt <= now;
}
