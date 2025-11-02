import { handlers } from '@/lib/auth';

// Export the handlers directly
// Auth event logging is handled in the auth.ts callbacks and events
export const { GET, POST } = handlers;
