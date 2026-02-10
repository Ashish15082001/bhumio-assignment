import type {
  FormData,
  ApiResponse,
  Submission,
  MockApiConfig,
} from "../types";

const DEFAULT_CONFIG: MockApiConfig = {
  successRate: 0.4, // 40% success
  failureRate: 0.3, // 30% 503 errors
  delayedRate: 0.3, // 30% delayed success
  minDelay: 5000, // 5 seconds
  maxDelay: 10000, // 10 seconds
};

// Idempotency store: prevents duplicate processing
const idempotencyStore = new Map<string, Submission>();

/**
 * Generates a unique idempotency key for each submission
 * Using email + timestamp (rounded to nearest second) to group retries
 */
export function generateIdempotencyKey(
  email: string,
  timestamp: number,
): string {
  // Round timestamp to nearest second to ensure retries with same key
  const roundedTimestamp = Math.floor(timestamp / 1000) * 1000;
  return `${email}:${roundedTimestamp}`;
}

/**
 * Mock API call that simulates random responses:
 * 1. Success (200) - 40% chance
 * 2. Temporary failure (503) - 30% chance
 * 3. Delayed success (5-10s) - 30% chance
 */
export async function submitToMockApi(
  formData: FormData,
  idempotencyKey: string,
  config: Partial<MockApiConfig> = {},
): Promise<ApiResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check if this request was already processed (idempotency)
  if (idempotencyStore.has(idempotencyKey)) {
    const cached = idempotencyStore.get(idempotencyKey)!;
    // Return cached result without processing again
    return {
      success: cached.status === "success",
      data: cached,
      error: cached.status === "error" ? cached.errorMessage : undefined,
    };
  }

  // Generate response type
  const random = Math.random();
  const isSuccess = random < finalConfig.successRate;
  const isFailure = random < finalConfig.successRate + finalConfig.failureRate;
  const isDelayed = !isSuccess && !isFailure;

  // Create submission record
  const submission: Submission = {
    ...formData,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    status: "pending",
    retryCount: 0,
  };

  // Handle delayed response
  if (isDelayed) {
    const delay =
      Math.random() * (finalConfig.maxDelay - finalConfig.minDelay) +
      finalConfig.minDelay;
    await new Promise((resolve) => setTimeout(resolve, delay));

    submission.status = "success";
    idempotencyStore.set(idempotencyKey, submission);
    return { success: true, data: submission };
  }

  // Handle temporary failure
  if (isFailure) {
    submission.status = "error";
    submission.errorMessage = "Temporary service failure (503)";
    // Don't cache failure - allow retries
    return {
      success: false,
      error: "Service temporarily unavailable",
    };
  }

  // Handle success
  submission.status = "success";
  idempotencyStore.set(idempotencyKey, submission);
  return { success: true, data: submission };
}

/**
 * Clear the idempotency store (useful for testing)
 */
export function clearIdempotencyStore(): void {
  idempotencyStore.clear();
}

/**
 * Get all submissions from the idempotency store
 */
export function getAllSubmissions(): Submission[] {
  return Array.from(idempotencyStore.values());
}
