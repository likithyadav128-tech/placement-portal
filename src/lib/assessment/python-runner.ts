/**
 * Python WebAssembly Execution Service (Pyodide Worker Bridge)
 *
 * Runs Python code safely inside an isolated client-side Web Worker.
 * Enforces timeout constraints (5000ms default) via worker termination.
 */

export interface TestCaseItem {
  input: string;
  expectedOutput?: string;
  hidden?: boolean;
}

export interface TestCaseResult {
  testCaseIndex: number;
  input: string;
  expectedOutput?: string;
  actualOutput: string;
  passed: boolean;
  stdout: string;
  executionTimeMs: number;
  error?: string | null;
  traceback?: string | null;
  hidden?: boolean;
}

export interface RunExecutionResult {
  results: TestCaseResult[];
  allPassed: boolean;
  totalTimeMs: number;
}

class PythonRunnerService {
  private worker: Worker | null = null;
  private isReady = false;
  private initPromise: Promise<void> | null = null;

  public async preload(): Promise<void> {
    if (typeof window === "undefined") return;
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      try {
        this.ensureWorker();
        const initId = "init-" + Math.random().toString(36).substring(2, 9);

        const handleMsg = (e: MessageEvent) => {
          if (e.data.id === initId) {
            this.worker?.removeEventListener("message", handleMsg);
            if (e.data.type === "INIT_SUCCESS") {
              this.isReady = true;
              resolve();
            } else {
              reject(new Error(e.data.error || "Failed to initialize Pyodide worker"));
            }
          }
        };

        this.worker?.addEventListener("message", handleMsg);
        this.worker?.postMessage({ id: initId, type: "INIT" });
      } catch (err) {
        reject(err);
      }
    });

    return this.initPromise;
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker("/workers/python-worker.js");
      this.isReady = false;
    }
    return this.worker;
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.initPromise = null;
    }
  }

  public async runCode(options: {
    code: string;
    testCases: TestCaseItem[];
    problemTitle?: string;
    isLinkedList?: boolean;
    timeoutMs?: number;
  }): Promise<RunExecutionResult> {
    if (typeof window === "undefined") {
      throw new Error("Python code runner is only available in browser environments.");
    }

    const {
      code,
      testCases,
      problemTitle = "",
      isLinkedList = false,
      timeoutMs = 7000,
    } = options;
    const worker = this.ensureWorker();
    const runId = "run-" + Math.random().toString(36).substring(2, 9);
    const startOverall = performance.now();

    return new Promise((resolve, reject) => {
      let timeoutTimer: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        worker.removeEventListener("message", messageHandler);
        worker.removeEventListener("error", errorHandler);
      };

      const messageHandler = (e: MessageEvent) => {
        if (e.data && e.data.id === runId) {
          cleanup();
          if (e.data.type === "RUN_COMPLETE") {
            const results: TestCaseResult[] = e.data.results || [];
            const allPassed =
              results.length > 0 &&
              results.every((r) => r.passed || (r.hidden && !r.error));
            const totalTimeMs =
              Math.round((performance.now() - startOverall) * 10) / 10;
            resolve({
              results,
              allPassed,
              totalTimeMs,
            });
          } else if (e.data.type === "RUN_ERROR") {
            reject(new Error(e.data.error || "Python execution failed."));
          }
        }
      };

      const errorHandler = (err: ErrorEvent) => {
        cleanup();
        reject(new Error(err.message || "Worker runtime error occurred."));
      };

      worker.addEventListener("message", messageHandler);
      worker.addEventListener("error", errorHandler);

      // Timeout watchdog
      timeoutTimer = setTimeout(() => {
        cleanup();
        this.terminate(); // Forcefully kill the hung worker to halt infinite loops
        reject(
          new Error(
            `Execution timed out (${timeoutMs}ms limit exceeded). Please check for infinite loops or high-complexity recursion.`
          )
        );
      }, timeoutMs);

      // Post execution request
      worker.postMessage({
        id: runId,
        type: "RUN_TESTS",
        code,
        testCases,
        problemTitle,
        isLinkedList,
      });
    });
  }
}

export const pythonRunner = new PythonRunnerService();
