export interface PerfResult {
  averageMs: number;
  maxMs: number;
  samples: number[];
}

interface MeasureOptions {
  iterations: number;
  warmup?: number;
  run: () => void;
}

export function measurePerformance({
  iterations,
  warmup = 3,
  run,
}: MeasureOptions): PerfResult {
  for (let index = 0; index < warmup; index += 1) {
    run();
  }

  const samples: number[] = [];

  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    run();
    samples.push(performance.now() - start);
  }

  const total = samples.reduce((sum, sample) => sum + sample, 0);

  return {
    averageMs: total / samples.length,
    maxMs: Math.max(...samples),
    samples,
  };
}

export function expectWithinBudget(
  result: PerfResult,
  averageBudgetMs: number,
  maxBudgetMs?: number
): void {
  expect(result.averageMs).withContext(`Average time: ${result.averageMs.toFixed(2)}ms`).toBeLessThan(
    averageBudgetMs
  );

  if (maxBudgetMs !== undefined) {
    expect(result.maxMs).withContext(`Max time: ${result.maxMs.toFixed(2)}ms`).toBeLessThan(
      maxBudgetMs
    );
  }
}
