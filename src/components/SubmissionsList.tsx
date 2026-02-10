import type { Submission } from "../types";
import "./SubmissionsList.css";

interface SubmissionsListProps {
  submissions: Submission[];
}

export function SubmissionsList({ submissions }: SubmissionsListProps) {
  if (submissions.length === 0) {
    return (
      <div className="submissions-list empty">
        <p className="empty-message">No successful submissions yet</p>
      </div>
    );
  }

  return (
    <div className="submissions-list">
      <h2 className="list-title">
        Successfully Recorded Submissions ({submissions.length})
      </h2>
      <div className="submissions-table-wrapper">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Amount</th>
              <th>Retries</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="submission-row">
                <td className="email-cell">{submission.email}</td>
                <td className="amount-cell">${submission.amount.toFixed(2)}</td>
                <td className="retries-cell">
                  {submission.retryCount > 0 ? (
                    <span className="retry-badge">{submission.retryCount}</span>
                  ) : (
                    <span className="no-retry">—</span>
                  )}
                </td>
                <td className="time-cell">
                  {new Date(submission.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
