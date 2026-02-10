import { useState, useCallback, useRef } from "react";
import type { FormData, Submission } from "../types";
import { submitToMockApi, generateIdempotencyKey } from "../services/mockApi";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

interface UseSubmissionReturn {
  submissions: Submission[];
  isSubmitting: boolean;
  error: string | null;
  currentSubmission: Submission | null;
  submit: (formData: FormData) => Promise<void>;
  clearError: () => void;
}

export function useSubmission(): UseSubmissionReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(
    null,
  );

  // Track to prevent duplicate simultaneous submissions
  const submissionInProgressRef = useRef<string | null>(null);

  const submit = useCallback(async (formData: FormData) => {
    // Prevent duplicate submissions while one is in progress
    const currentKey = `${formData.email}:${formData.amount}`;
    if (submissionInProgressRef.current === currentKey) {
      setError("Request already in progress. Please wait.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    submissionInProgressRef.current = currentKey;

    // Create initial pending submission
    const submissionTimestamp = Date.now();
    const idempotencyKey = generateIdempotencyKey(
      formData.email,
      submissionTimestamp,
    );

    const pendingSubmission: Submission = {
      ...formData,
      id: `${submissionTimestamp}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: submissionTimestamp,
      status: "pending",
      retryCount: 0,
    };

    setCurrentSubmission(pendingSubmission);

    let retryCount = 0;
    let lastError: string | null = null;

    while (retryCount <= MAX_RETRIES) {
      try {
        const response = await submitToMockApi(formData, idempotencyKey);

        if (response.success && response.data) {
          // Success!
          const successSubmission: Submission = {
            ...response.data,
            retryCount,
            status: "success",
          };
          setSubmissions((prev) => [successSubmission, ...prev]);
          setCurrentSubmission(successSubmission);
          submissionInProgressRef.current = null;
          setIsSubmitting(false);
          return;
        } else {
          // API returned an error
          lastError = response.error || "Unknown error occurred";

          if (retryCount < MAX_RETRIES) {
            // Update submission to show retry
            const retrySubmission: Submission = {
              ...pendingSubmission,
              status: "retry",
              retryCount: retryCount + 1,
              errorMessage: `Failed: ${lastError}. Retrying...`,
            };
            setCurrentSubmission(retrySubmission);

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            retryCount++;
          } else {
            // Max retries exceeded
            const failedSubmission: Submission = {
              ...pendingSubmission,
              status: "error",
              retryCount,
              errorMessage: `Failed after ${MAX_RETRIES} retries: ${lastError}`,
            };
            setCurrentSubmission(failedSubmission);
            setError(`Submission failed: ${lastError}`);
            submissionInProgressRef.current = null;
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Network error";
        lastError = errorMsg;

        if (retryCount < MAX_RETRIES) {
          const retrySubmission: Submission = {
            ...pendingSubmission,
            status: "retry",
            retryCount: retryCount + 1,
            errorMessage: `Error: ${errorMsg}. Retrying...`,
          };
          setCurrentSubmission(retrySubmission);

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          retryCount++;
        } else {
          const failedSubmission: Submission = {
            ...pendingSubmission,
            status: "error",
            retryCount,
            errorMessage: `Error after ${MAX_RETRIES} retries: ${errorMsg}`,
          };
          setCurrentSubmission(failedSubmission);
          setError(`Submission failed: ${errorMsg}`);
          submissionInProgressRef.current = null;
          setIsSubmitting(false);
          return;
        }
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submissions,
    isSubmitting,
    error,
    currentSubmission,
    submit,
    clearError,
  };
}
