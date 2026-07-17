// On-demand rAF coordinator.  It deliberately has no Three/browser globals so
// fake clocks and visibility documents can exercise the sleep contract.
export class IdleRenderScheduler {
    constructor({ requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout, document, now, frame }) {
        this.raf = requestAnimationFrame;
        this.cancelRaf = cancelAnimationFrame;
        this.setTimer = setTimeout;
        this.clearTimer = clearTimeout;
        this.document = document;
        this.now = now;
        this.frame = frame;
        this.rafId = null;
        this.wakeTimer = null;
        this.running = false;
        this._onVisibilityChange = () => {
            if (!this.hidden) this.wake('visibility');
            else this._cancelRaf();
        };
        document?.addEventListener?.('visibilitychange', this._onVisibilityChange);
    }

    get hidden() { return this.document?.visibilityState === 'hidden'; }

    start() { this.running = true; this.wake('start'); }

    wake(_reason = 'event') {
        if (!this.running || this.hidden || this.rafId !== null) return;
        this.rafId = this.raf(timestamp => this._tick(timestamp));
    }

    // Timers only re-enter rAF when there is a real deadline (the motion latch
    // settling edge, retry, or watchdog), never as an idle polling loop.
    wakeAfter(delayMs, reason = 'timer') {
        if (!this.running || this.hidden) return;
        if (this.wakeTimer !== null) this.clearTimer(this.wakeTimer);
        this.wakeTimer = this.setTimer(() => {
            this.wakeTimer = null;
            this.wake(reason);
        }, Math.max(0, delayMs));
    }

    _tick(timestamp) {
        this.rafId = null;
        if (!this.running || this.hidden) return;
        const result = this.frame(timestamp ?? this.now()) || {};
        if (result.active) this.wake('active');
        else if (Number.isFinite(result.wakeAfterMs)) this.wakeAfter(result.wakeAfterMs, 'deadline');
    }

    _cancelRaf() {
        if (this.rafId !== null) this.cancelRaf?.(this.rafId);
        this.rafId = null;
    }

    stop() {
        this.running = false;
        this._cancelRaf();
        if (this.wakeTimer !== null) this.clearTimer(this.wakeTimer);
        this.wakeTimer = null;
        this.document?.removeEventListener?.('visibilitychange', this._onVisibilityChange);
    }
}
