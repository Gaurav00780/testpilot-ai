// ─── Global Rate Limiter for AI API ──────────────────────────────────────────
// Tracks RPM (requests per minute) and daily usage to stay within API limits.

class RateLimiter {
  constructor({ rpm = 14, dailyLimit = 1500 } = {}) {
    this.rpm = rpm;
    this.dailyLimit = dailyLimit;
    this.requestsThisMinute = 0;
    this.requestsToday = 0;
    this._queue = [];
    this._processing = false;

    // Auto-reset RPM counter every 60 seconds
    this._rpmTimer = setInterval(() => {
      this.requestsThisMinute = 0;
      this._drain();
    }, 60_000);

    // Auto-reset daily counter at midnight
    this._scheduleMidnightReset();
  }

  _scheduleMidnightReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    this._dailyTimer = setTimeout(() => {
      this.requestsToday = 0;
      console.log('[RateLimiter] Daily counter reset at midnight');
      // Re-schedule for the next midnight
      this._scheduleMidnightReset();
      this._drain();
    }, msUntilMidnight);
  }

  get status() {
    return {
      queueLength: this._queue.length,
      requestsThisMinute: this.requestsThisMinute,
      requestsToday: this.requestsToday,
      rpm: this.rpm,
      dailyLimit: this.dailyLimit,
    };
  }

  /**
   * Enqueue a function to be executed when a rate limit slot is available.
   * Returns a promise that resolves/rejects with the function's result.
   */
  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  async _drain() {
    if (this._processing) return;
    this._processing = true;

    while (this._queue.length > 0) {
      // Check if we can send a request
      if (this.requestsThisMinute >= this.rpm) {
        console.log(`[RateLimiter] RPM limit reached (${this.requestsThisMinute}/${this.rpm}). Waiting for reset...`);
        break; // Will resume when the 60s timer resets requestsThisMinute
      }
      if (this.requestsToday >= this.dailyLimit) {
        console.error(`[RateLimiter] Daily limit reached (${this.requestsToday}/${this.dailyLimit}). Rejecting queued requests.`);
        // Reject all queued requests
        while (this._queue.length > 0) {
          const { reject } = this._queue.shift();
          reject(new Error(`Daily API limit reached (${this.dailyLimit} requests). Try again tomorrow.`));
        }
        break;
      }

      const { fn, resolve, reject } = this._queue.shift();
      this.requestsThisMinute++;
      this.requestsToday++;
      console.log(`[RateLimiter] Dispatching request (${this.requestsThisMinute}/${this.rpm} RPM, ${this.requestsToday}/${this.dailyLimit} daily, ${this._queue.length} queued)`);

      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }

    this._processing = false;
  }

  destroy() {
    clearInterval(this._rpmTimer);
    clearTimeout(this._dailyTimer);
  }
}

// Singleton instance — shared across AI client modules
const limiter = new RateLimiter();

module.exports = { RateLimiter, limiter };
