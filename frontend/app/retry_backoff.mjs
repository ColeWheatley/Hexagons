export function retryDelayMs(failures, initialMs, maximumMs) {
    return Math.min(maximumMs, initialMs * 2 ** Math.max(0, failures - 1));
}
