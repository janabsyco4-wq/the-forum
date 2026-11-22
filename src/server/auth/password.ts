/**
 * Password hashing with argon2id (64 MiB memory, 3 iterations, 1 lane —
 * see PARAMS). @node-rs/argon2 ships prebuilt binaries, so no
 * node-gyp toolchain is needed on Windows/Vercel, and Next.js keeps it external
 * to the server bundle by default.
 */
import { hash, verify } from "@node-rs/argon2";

const ARGON2ID = 2; // Algorithm.Argon2id (const enum, not importable under isolatedModules)

// RFC 9106 "second recommended" profile: 64 MiB, 3 passes, 1 lane (well above the OWASP minimum of 19 MiB / t=2).
// verify() reads the parameters from each stored hash, so these can be raised later without breaking old hashes.
const PARAMS = { algorithm: ARGON2ID, memoryCost: 65536, timeCost: 3, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, PARAMS);
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

/**
 * A real hash of a random string, used to spend the same time verifying when
 * the email does not exist (prevents account enumeration by timing).
 */
let dummy: Promise<string> | undefined;
export function dummyHash(): Promise<string> {
  return (dummy ??= hashPassword("not-a-real-password-" + Math.random()));
}
