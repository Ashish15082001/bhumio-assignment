import { useState } from "react";
import type { FormData } from "../types";
import "./SubmissionForm.css";

interface SubmissionFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export function SubmissionForm({ onSubmit, isLoading }: SubmissionFormProps) {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (!email.trim()) {
      setValidationError("Email is required");
      return;
    }

    if (!email.includes("@")) {
      setValidationError("Please enter a valid email");
      return;
    }

    if (!amount.trim()) {
      setValidationError("Amount is required");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Amount must be a positive number");
      return;
    }

    // Submit
    onSubmit({
      email: email.trim(),
      amount: parsedAmount,
    });

    // Clear form
    setEmail("");
    setAmount("");
  };

  return (
    <form onSubmit={handleSubmit} className="submission-form">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={isLoading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          disabled={isLoading}
          required
        />
      </div>

      {validationError && (
        <div className="error-message">{validationError}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`submit-button ${isLoading ? "loading" : ""}`}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            Submitting...
          </>
        ) : (
          "Submit"
        )}
      </button>
    </form>
  );
}
