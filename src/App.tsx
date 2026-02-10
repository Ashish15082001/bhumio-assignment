import { SubmissionForm } from "./components/SubmissionForm";
import { SubmissionStatus } from "./components/SubmissionStatus";
import { SubmissionsList } from "./components/SubmissionsList";
import { useSubmission } from "./hooks/useSubmission";
import "./App.css";

function App() {
  const {
    submissions,
    isSubmitting,
    error,
    currentSubmission,
    submit,
    clearError,
  } = useSubmission();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Submission Form</h1>
          <p className="subtitle">
            Submit your email and amount with automatic retry on failure
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="content-wrapper">
            <section className="form-section">
              <SubmissionForm onSubmit={submit} isLoading={isSubmitting} />
            </section>

            {(currentSubmission || error) && (
              <section className="status-section">
                <SubmissionStatus
                  submission={currentSubmission}
                  error={error}
                  onClearError={clearError}
                />
              </section>
            )}

            {submissions.length > 0 && (
              <section className="results-section">
                <SubmissionsList submissions={submissions} />
              </section>
            )}
          </div>

          <aside className="info-sidebar">
            <div className="info-card">
              <h3>How It Works</h3>
              <ul>
                <li>Fill in your email and amount</li>
                <li>Submit the form</li>
                <li>The app will show pending state immediately</li>
                <li>
                  API randomly returns immediate success, delay, or failure
                </li>
                <li>Failed requests auto-retry up to 3 times</li>
                <li>No duplicate records are created</li>
              </ul>
            </div>

            <div className="info-card stats">
              <h3>Statistics</h3>
              <div className="stat-row">
                <span className="stat-label">Total Submissions:</span>
                <span className="stat-value">{submissions.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Unique Emails:</span>
                <span className="stat-value">
                  {new Set(submissions.map((s) => s.email)).size}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Amount:</span>
                <span className="stat-value">
                  $
                  {submissions.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
