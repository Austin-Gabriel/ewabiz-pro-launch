/**
 * In-memory hand-off between the two signup screens.
 * Step 1 collects account fields; step 2 ("/signup/services") collects the
 * craft selection and studio name, then performs the actual Supabase signup.
 * Lives in memory only — refreshing /signup/services bounces back to step 1.
 */
export interface PendingSignup {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

let pending: PendingSignup | null = null;

export function setPendingSignup(p: PendingSignup) {
  pending = p;
}

export function getPendingSignup(): PendingSignup | null {
  return pending;
}

export function clearPendingSignup() {
  pending = null;
}