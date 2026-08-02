export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  message: string;
}

export const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    return {
      isValid: false,
      missing,
      message: `Missing required environment variables: ${missing.join(', ')}. Please check your .env file.`,
    };
  }

  return {
    isValid: true,
    missing: [],
    message: 'All required environment variables are configured.',
  };
}
