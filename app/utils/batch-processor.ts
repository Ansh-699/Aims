/**
 * Advanced batch processing utility for optimizing API requests
 */

export interface BatchConfig {
    maxConcurrency: number;
    batchSize: number;
    delayBetweenBatches: number;
    retryAttempts: number;
    timeoutMs: number;
}

export interface BatchResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    duration: number;
    retries: number;
}

export class BatchProcessor<T, R> {
    private config: BatchConfig;
    private activeRequests = 0;
    private queue: Array<() => Promise<void>> = [];
    private results: Map<string, BatchResult<R>> = new Map();

    constructor(config: Partial<BatchConfig> = {}) {
        this.config = {
            maxConcurrency: 6,
            batchSize: 4,
            delayBetweenBatches: 100,
            retryAttempts: 2,
            timeoutMs: 10000,
            ...config
        };
    }

    async processBatch<K extends string>(
        items: Array<{ key: K; data: T }>,
        processor: (item: T) => Promise<R>
    ): Promise<Record<K, BatchResult<R>>> {
        console.log(`[BatchProcessor] Processing ${items.length} items with max concurrency ${this.config.maxConcurrency}`);

        const startTime = Date.now();
        this.results.clear();

        // Create processing promises for all items
        const processingPromises = items.map(({ key, data }) =>
            this.processItem(key, data, processor)
        );

        // Execute with controlled concurrency
        await this.executeWithConcurrencyLimit(processingPromises);

        const totalTime = Date.now() - startTime;
        const successCount = Array.from(this.results.values()).filter(r => r.success).length;

        console.log(`[BatchProcessor] Completed in ${totalTime}ms. Success rate: ${Math.round((successCount / items.length) * 100)}%`);

        return Object.fromEntries(this.results) as Record<K, BatchResult<R>>;
    }

    private async processItem<K extends string>(
        key: K,
        data: T,
        processor: (item: T) => Promise<R>
    ): Promise<void> {
        const startTime = Date.now();
        let retries = 0;
        let lastError: string | undefined;

        while (retries <= this.config.retryAttempts) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

                const result = await Promise.race([
                    processor(data),
                    new Promise<never>((_, reject) => {
                        controller.signal.addEventListener('abort', () => {
                            reject(new Error('Request timeout'));
                        });
                    })
                ]);

                clearTimeout(timeoutId);

                this.results.set(key, {
                    success: true,
                    data: result,
                    duration: Date.now() - startTime,
                    retries
                });
                return;

            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                retries++;

                if (retries <= this.config.retryAttempts) {
                    // Exponential backoff for retries
                    const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // All retries failed
        this.results.set(key, {
            success: false,
            error: lastError,
            duration: Date.now() - startTime,
            retries: retries - 1
        });
    }

    private async executeWithConcurrencyLimit(promises: Promise<void>[]): Promise<void> {
        const executing: Promise<void>[] = [];

        for (const promise of promises) {
            const wrappedPromise = promise.finally(() => {
                executing.splice(executing.indexOf(wrappedPromise), 1);
            });

            executing.push(wrappedPromise);

            if (executing.length >= this.config.maxConcurrency) {
                await Promise.race(executing);
            }
        }

        await Promise.all(executing);
    }
}

/**
 * Utility function for simple batch processing
 */
export async function processBatch<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: Partial<BatchConfig> = {}
): Promise<Array<BatchResult<R>>> {
    const batchProcessor = new BatchProcessor<{ item: T; index: number }, R>(options);

    const itemsWithKeys = items.map((item, index) => ({
        key: index.toString(),
        data: { item, index }
    }));

    const results = await batchProcessor.processBatch(
        itemsWithKeys,
        ({ item, index }) => processor(item, index)
    );

    return Object.values(results);
}

/**
 * Smart batch size calculator based on response times
 */
export class AdaptiveBatchSizer {
    private responseTimes: number[] = [];
    private currentBatchSize: number;
    private readonly minBatchSize: number;
    private readonly maxBatchSize: number;

    constructor(
        initialBatchSize = 4,
        minBatchSize = 2,
        maxBatchSize = 8
    ) {
        this.currentBatchSize = initialBatchSize;
        this.minBatchSize = minBatchSize;
        this.maxBatchSize = maxBatchSize;
    }

    recordBatchTime(batchSize: number, responseTime: number): void {
        this.responseTimes.push(responseTime);

        // Keep only last 10 measurements
        if (this.responseTimes.length > 10) {
            this.responseTimes.shift();
        }

        this.adjustBatchSize(responseTime);
    }

    getCurrentBatchSize(): number {
        return this.currentBatchSize;
    }

    private adjustBatchSize(lastResponseTime: number): void {
        const avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

        // If responses are fast, increase batch size
        if (avgResponseTime < 2000 && this.currentBatchSize < this.maxBatchSize) {
            this.currentBatchSize = Math.min(this.maxBatchSize, this.currentBatchSize + 1);
        }
        // If responses are slow, decrease batch size
        else if (avgResponseTime > 5000 && this.currentBatchSize > this.minBatchSize) {
            this.currentBatchSize = Math.max(this.minBatchSize, this.currentBatchSize - 1);
        }
    }
}