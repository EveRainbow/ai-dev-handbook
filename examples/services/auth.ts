/**
 * Service: auth
 *
 * WHAT: A service handles logic that is needed by multiple use cases —
 *       authentication, validation, logging, rate-limiting, and similar concerns.
 * WHEN: Extract logic to a service when two or more use cases need the same thing.
 *       Never duplicate token validation or password rules inside individual use cases.
 * WHERE: Imported by use cases (src/use-cases/) and route handlers (src/app/).
 *        A service never imports from src/use-cases/.
 */

import jwt from 'jsonwebtoken';

export const authService = {
  /**
   * Parse and verify a JWT from an incoming request.
   * Call this at the start of any use case that requires a logged-in user.
   * Throws UnauthorizedError if the token is missing or expired.
   */
  requireAuth(req: Request): { userId: string } {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new UnauthorizedError('Missing token');
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  },

  /**
   * Enforce password strength rules before persisting a new user
   * or accepting a password change.
   */
  validatePassword(password: string): void {
    if (password.length < 8) throw new ValidationError('Password too short');
  },
};
