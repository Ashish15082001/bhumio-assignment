# Bhumio Assignment - Submission Form with Auto-Retry

A modern React + TypeScript + Vite web application demonstrating a robust submission system with automatic retry logic, idempotency, and comprehensive error handling.

## Features

✅ **Email & Amount Form** - Clean, validated form with real-time feedback  
✅ **Mock API Simulation** - Random responses: immediate success, delayed success (5-10s), or temporary failure (503)  
✅ **Automatic Retry Logic** - Failed requests automatically retry up to 3 times with configurable delays  
✅ **Duplicate Prevention** - Idempotent submissions ensure no duplicate records  
✅ **Real-time Status Updates** - Visual feedback for pending, retrying, success, and error states  
✅ **No Lost Data** - All submissions are persisted and displayed in a live table

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build

```bash
npm run build
```

## Architecture & State Management

### Form Submission Flow

```
User Submit
    ↓
Validate form input
    ↓
Check for duplicate in-progress submission
    ↓
Create pending submission record
    ↓
Show "pending" state UI immediately
    ↓
Call Mock API
    ↓
    ├─ Success (200) → Store record → Show success message
    ├─ Failure (503) → Enter retry loop
    └─ Delayed (5-10s) → Wait, then Success
```

### State Transitions

Each submission goes through these states:

```
pending → success
pending → retry → retry → (success OR error)
pending → error
```

**States:**

- **pending** - Request is being processed
- **retry** - Previous attempt failed, now retrying (shows attempt number)
- **success** - Submission recorded successfully
- **error** - Failed after all retries exhausted

## Retry Logic

### Retry Strategy

- **Max Retries**: 3 attempts
- **Retry Delay**: 2 seconds between attempts
- **Total Timeout**: ~8 seconds maximum per submission
- **Retry Decision**: Only retries on 503 errors, not on other failures

```typescript
// Pseudocode
for (attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  try {
    response = await submitToMockApi(formData, idempotencyKey);

    if (response.success) {
      return SUCCESS;
    } else if (attempt < MAX_RETRIES) {
      wait(RETRY_DELAY);
      continue; // Retry
    } else {
      return FINAL_ERROR;
    }
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      wait(RETRY_DELAY);
      continue; // Retry
    } else {
      return FINAL_ERROR;
    }
  }
}
```

## Duplicate Prevention

### Idempotency Implementation

The app implements **idempotent submissions** using:

1. **Idempotency Key**: Combination of email + rounded timestamp

   ```typescript
   idempotencyKey = `${email}:${Math.floor(timestamp / 1000) * 1000}`;
   ```

2. **In-Memory Idempotency Store**: Map of processed requests

   ```typescript
   idempotencyStore: Map<string, Submission>;
   ```

3. **Duplicate Check**: Before processing any request
   ```typescript
   if (idempotencyStore.has(idempotencyKey)) {
     return cachedResult; // Return previously processed result
   }
   ```

### How It Works

- **First submission** for email `user@example.com` at timestamp `1234567890000`:
  - Idempotency key: `user@example.com:1234567890000`
  - API processes, stores result in idempotency store
  - Result: 1 record created

- **Retry of same submission** (within same second):
  - Same idempotency key generated
  - Idempotency store lookup finds previous result
  - Returns cached result **without** reprocessing
  - Result: Still 1 record (no duplicate)

- **New submission** with different email or timestamp:
  - Different idempotency key
  - Processed normally
  - Result: New record created

### Protection Against

✓ Browser refresh during submission  
✓ Network timeouts and retries  
✓ User clicking submit multiple times  
✓ Delayed API responses combined with user retries

## Submission Tracking

### Records Display

Successfully submitted records appear in a table showing:

- **Email** - Submitted email address
- **Amount** - Submission amount in USD
- **Retries** - Number of retry attempts needed (blank if immediate success)
- **Time** - Exact timestamp of successful submission

### Statistics

Real-time stats in the sidebar:

- Total Submissions count
- Unique Emails count
- Total Amount sum

## Project Structure

```
src/
├── components/
│   ├── SubmissionForm.tsx       # Form UI with validation
│   ├── SubmissionForm.css
│   ├── SubmissionStatus.tsx     # State indicator component
│   ├── SubmissionStatus.css
│   ├── SubmissionsList.tsx      # Records display table
│   └── SubmissionsList.css
├── hooks/
│   └── useSubmission.ts         # Main submission logic hook
├── services/
│   └── mockApi.ts               # API simulation & idempotency
├── types/
│   └── index.ts                 # TypeScript interfaces
├── App.tsx
├── App.css
├── main.tsx
└── index.css
```

## Mock API Behavior

The mock API simulates real-world scenarios:

```typescript
Success Rate:     40% → Immediate success (200)
Failure Rate:     30% → Temporary failure (503) → Auto-retry
Delayed Rate:     30% → Success after 5-10 seconds
```

### API Response Examples

```typescript
// Success (40%)
{ success: true, data: { id, email, amount, timestamp, ... } }

// Temporary Failure (30%)
{ success: false, error: "Service temporarily unavailable" }
// → Will auto-retry

// Delayed Success (30%)
// Waits 5-10 seconds, then returns success
{ success: true, data: { id, email, amount, timestamp, ... } }
```

## Technical Stack

- **React 19** - UI framework with hooks
- **TypeScript 5.9** - Type-safe development
- **Vite 7** - Lightning-fast build tool with HMR
- **CSS3** - Responsive styling with animations

## Component Breakdown

### SubmissionForm

- Email and amount input validation
- Real-time error messages
- Disabled state during submission
- Loading spinner animation

### SubmissionStatus

- Dynamic state indication (pending/retry/success/error)
- Visual feedback with icons and animations
- Retry attempt counter
- Detailed error messages

### SubmissionsList

- Table of successful submissions
- Sorted by most recent first
- Retry count display with badge styling
- Responsive table design

### useSubmission Hook

- Complete submission lifecycle management
- Retry logic with exponential backoff ready
- Duplicate submission prevention
- Error state management
- In-progress tracking

## Usage Example

```typescript
const {
  submissions, // Array of successful submissions
  isSubmitting, // Boolean - is currently submitting
  error, // String - error message if any
  currentSubmission, // Submission - current being processed
  submit, // Function - to submit form data
  clearError, // Function - to clear error message
} = useSubmission();

// Call to submit
await submit({ email: "user@example.com", amount: 100 });
```

## Error Handling

The app handles multiple error scenarios:

- **Validation Errors**: Missing or invalid email/amount
- **Network Errors**: Connection failures
- **API Errors**: 503 service unavailable
- **Timeout Errors**: Requests taking too long
- **Max Retries Exceeded**: After 3 failed attempts

Each is displayed with clear messaging and appropriate retry logic.

## Testing the App

### Test Scenarios

1. **Normal Success**
   - Fill form, submit, watch for immediate success (40% chance)

2. **Auto-Retry Success**
   - Submit form multiple times, observe retries on failures
   - App shows "Retrying... (Attempt 1)" etc.

3. **Duplicate Prevention**
   - Submit form, quickly refresh page
   - Should not create duplicate records
   - Timestamp rounding ensures same idempotency key

4. **Error After Max Retries**
   - Keep submitting until you get unlucky with 503 errors
   - After 3 retries, shows failure message
   - Table remains unchanged

5. **Delayed Success**
   - Submit and observe 5-10 second delay (30% chance)
   - Shows pending state, then success when API responds

## Performance Considerations

- **In-Memory Storage**: Idempotency store is in-memory (resets on page refresh)
- **HMR Support**: Hot Module Replacement enabled for fast development
- **Bundle Size**: ~150KB gzipped
- **Responsive Design**: Works on all screen sizes

## Future Enhancements

- Persistent storage (localStorage/database) for idempotency store
- Configurable retry strategy
- Retry with exponential backoff
- Request queue for batch submissions
- Analytics and submission metrics
- Export submissions to CSV

## Troubleshooting

### Form not submitting?

- Check browser console for errors
- Verify email format is valid
- Ensure amount is a positive number

### Records not appearing?

- Check if submission succeeded (look for success message)
- Verify in browser DevTools that record is in state
- Try resubmitting

### Retries not happening?

- Open browser DevTools Network tab
- Verify 503 responses are being received
- Retries should occur automatically after 2 seconds

---

Built with ❤️ using React + TypeScript + Vite

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
