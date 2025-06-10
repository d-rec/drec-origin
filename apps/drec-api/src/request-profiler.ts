import { AsyncLocalStorage } from 'async_hooks';
import { performance } from 'perf_hooks';

const asyncStorage = new AsyncLocalStorage<{ name: string; start: number }[]>();

export class RequestProfiler {
  static track(name: string): { end: () => void } {
    const context = asyncStorage.getStore();
    if (!context) {
      return {
        end: () => {
          /* no-op */
        },
      };
    }

    const start = performance.now();
    context.push({ name, start });

    return {
      end: () => {
        const duration = performance.now() - start;
        console.log(`⏱️ ${name} took ${duration.toFixed(2)}ms`);
      },
    };
  }

  static run<T>(name: string, fn: () => T): T {
    const context: { name: string; start: number }[] = [];
    return asyncStorage.run(context, () => {
      const tracker = this.track(name);
      try {
        return fn();
      } finally {
        tracker.end();
        this.logSlowFunctions(context);
      }
    });
  }

  private static logSlowFunctions(context: { name: string; start: number }[]) {
    const SLOW_THRESHOLD_MS = 100;
    const slowFunctions = context
      .map(({ name, start }) => ({
        name,
        duration: performance.now() - start,
      }))
      .filter(({ duration }) => duration > SLOW_THRESHOLD_MS);

    if (slowFunctions.length) {
      console.log('\n🚨 **Performance Bottlenecks Detected:**');
      console.table(slowFunctions);
    }
  }
}
