import type { Role } from '@/lib/auth/types';

// The session callback in auth.ts adds our database user id and role to session.user.
declare module '@auth/core/types' {
  interface User {
    role?: Role;
  }
}
