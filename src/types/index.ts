export interface FormData {
  email: string;
  amount: number;
}

export interface Submission extends FormData {
  id: string;
  timestamp: number;
  status: "pending" | "success" | "error" | "retry";
  retryCount: number;
  errorMessage?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: Submission;
  error?: string;
}

export interface MockApiConfig {
  successRate: number; // 0-1
  failureRate: number; // 0-1 (503 errors)
  delayedRate: number; // 0-1 (5-10s delay)
  minDelay: number; // ms
  maxDelay: number; // ms
}
