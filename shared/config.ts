/**
 * App-wide settings shared by the Worker and the React app.
 * Change these first when you start a new project.
 */
export const appConfig = {
  name: "Arzan",
  /** Block sign-in until the email address is verified. */
  requireEmailVerification: false,
  /** Minimum password length for sign-up, reset and change. */
  minPasswordLength: 8,
} as const;
