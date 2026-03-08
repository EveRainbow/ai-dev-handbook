/**
 * Use Case: RegisterUser
 *
 * WHAT: A use case encapsulates a single user-facing action end-to-end.
 * WHEN: Create a new use case file for every distinct thing a user can do
 *       (register, place an order, cancel a subscription, reset a password).
 * WHERE: Called by route handlers in src/app/ — never called by other use cases
 *        or services directly.
 *
 * Rule: no HTTP logic, no raw SQL, no vendor SDK imports inside this file.
 * Delegate those to src/services/ and src/lib/.
 */

import { authService } from '@/services/auth';
import { emailService } from '@/services/email';
import { userRepo } from '@/lib/db';

export async function registerUser(email: string, password: string) {
  // Step 1: validate using a cross-cutting service (not inline logic)
  await authService.validatePassword(password);

  // Step 2: persist via a database adapter (not a raw ORM call here)
  const user = await userRepo.create({ email });

  // Step 3: trigger a side effect via another adapter
  await emailService.sendWelcome(user.email);

  return user;
}
