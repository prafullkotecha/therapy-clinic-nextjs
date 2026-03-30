const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;

export type PasswordValidationResult = {
  isValid: boolean;
  errors: string[];
};

export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must include at least one number');
  }

  if (!/[^A-Za-z\d]/.test(password)) {
    errors.push('Password must include at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function isPasswordPolicyCompliant(password: string): boolean {
  return PASSWORD_POLICY_REGEX.test(password);
}

export function verifyCsrfToken(submittedToken: string | undefined, expectedToken: string | undefined): boolean {
  if (!submittedToken || !expectedToken) {
    return false;
  }

  return submittedToken === expectedToken;
}
