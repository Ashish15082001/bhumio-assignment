import type { Submission } from "../types";
import "./SubmissionStatus.css";

interface SubmissionStatusProps {
  submission: Submission | null;
  error: string | null;
  onClearError: () => void;
}

export function SubmissionStatus({
  submission,
  error,
  onClearError,
}: SubmissionStatusProps) {
  if (!submission && !error) {
    return null;
  }

  return (
    <div className="submission-status">
      {error && (
        <div className="status-alert alert-error">
          <span className="alert-icon">✕</span>
          <div className="alert-content">
            <p className="alert-title">Error</p>
            <p className="alert-message">{error}</p>
          </div>
          <button
            className="alert-close"
            onClick={onClearError}
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
      )}

      {submission && !error && (
        <div className={`status-alert alert-${submission.status}`}>
          <span className="alert-icon">
            {submission.status === "pending" && "⏳"}
            {submission.status === "retry" && "↻"}
            {submission.status === "success" && "✓"}
            {submission.status === "error" && "✕"}
          </span>
          <div className="alert-content">
            <p className="alert-title">
              {submission.status === "pending" && "Submitting..."}
              {submission.status === "retry" &&
                `Retrying... (Attempt ${submission.retryCount})`}
              {submission.status === "success" && "Success!"}
              {submission.status === "error" && "Error"}
            </p>
            <p className="alert-message">
              {submission.status === "success" && (
                <>
                  Your submission for <strong>{submission.email}</strong> with
                  amount <strong>${submission.amount.toFixed(2)}</strong> has
                  been recorded.
                  {submission.retryCount > 0 &&
                    ` (Succeeded after ${submission.retryCount} retry attempt${submission.retryCount > 1 ? "s" : ""}.)`}
                </>
              )}
              {submission.status === "pending" && (
                <>
                  Submitting <strong>{submission.email}</strong> for{" "}
                  <strong>${submission.amount.toFixed(2)}</strong>...
                </>
              )}
              {submission.status === "retry" && (
                <>{submission.errorMessage || "Retrying submission..."}</>
              )}
              {submission.status === "error" && (
                <>
                  {submission.errorMessage ||
                    "An error occurred. Please try again."}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
