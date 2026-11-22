import "server-only";
import { ObjectId } from "mongodb";
import type { z } from "zod";
import type { PrivateUser, User } from "@/types/domain";
import { cols, toObjectId, toPrivateUser, toUser, type UserDoc } from "../db";
import { hashPassword, revokeAllSessions, verifyPassword } from "../auth";
import { dummyHash } from "../auth/password";
import { forbidden, invalid, notFound, unauthenticated } from "../http/errors";
import { sanitizePlainText } from "../security/sanitize";
import type { adminUserSchema, profileSchema, registerSchema } from "../validation/schemas";

export const RESERVED_USERNAMES = new Set(["admin", "administrator", "moderator", "root", "support", "theforum", "forum", "api", "me", "en", "ur"]);

export async function registerUser(input: z.infer<typeof registerSchema>): Promise<UserDoc> {
  const { users } = await cols();
  const usernameLower = input.username.toLowerCase();
  if (RESERVED_USERNAMES.has(usernameLower)) throw invalid("That username is reserved.", { username: "Reserved" });

  // Friendly field errors first; the unique indexes are the real guarantee (route() maps E11000 → CONFLICT).
  const clash = await users.findOne(
    { $or: [{ usernameLower }, { email: input.email }] },
    { projection: { usernameLower: 1, email: 1 } },
  );
  if (clash) {
    const fields: Record<string, string> = {};
    if (clash.usernameLower === usernameLower) fields.username = "Already taken";
    if (clash.email === input.email) fields.email = "An account with this email already exists";
    throw invalid("Some details are already in use.", fields);
  }

  const now = new Date();
  const doc: UserDoc = {
    _id: new ObjectId(),
    username: input.username,
    usernameLower,
    name: sanitizePlainText(input.name),
    email: input.email,
    emailVerified: false,
    passwordHash: await hashPassword(input.password),
    preferredLocale: input.preferredLocale,
    ...(input.university ? { university: sanitizePlainText(input.university) } : {}),
    role: "member",
    status: "active",
    badges: [],
    interests: [],
    joinedAt: now,
    updatedAt: now,
    stats: { articles: 0, arguments: 0, discussions: 0, followers: 0, following: 0 },
  };
  await users.insertOne(doc);
  return doc;
}

/** Verifies credentials in constant-ish time. Same error for unknown email and wrong password. */
export async function authenticate(email: string, password: string): Promise<UserDoc> {
  const { users } = await cols();
  const user = await users.findOne({ email });
  const ok = await verifyPassword(user?.passwordHash ?? (await dummyHash()), password);
  if (!user || !ok) throw unauthenticated("Email or password is incorrect.");
  if (user.status === "suspended") throw forbidden("This account is suspended. Contact the moderators.");
  return user;
}

export async function updateProfile(me: UserDoc, input: z.infer<typeof profileSchema>): Promise<PrivateUser> {
  const set: Partial<UserDoc> = { updatedAt: new Date() };
  const unset: Record<string, ""> = {};
  for (const key of ["name", "headline", "bio", "university", "city", "country"] as const) {
    const v = input[key];
    if (v === undefined) continue;
    const clean = sanitizePlainText(v);
    if (clean) set[key] = clean;
    else if (key === "name") throw invalid("Name is required.", { name: "Required" });
    else unset[key] = "";
  }
  for (const key of ["website", "avatarUrl"] as const) {
    const v = input[key];
    if (v === undefined) continue;
    if (v) set[key] = v;
    else unset[key] = "";
  }
  if (input.interests) {
    const { categories } = await cols();
    const known = new Set((await categories.find({}, { projection: { _id: 1 } }).toArray()).map((c) => c._id));
    const bad = input.interests.filter((i) => !known.has(i));
    if (bad.length) throw invalid("Unknown interests.", { interests: `Unknown: ${bad.join(", ")}` });
    set.interests = [...new Set(input.interests)];
  }
  const { users } = await cols();
  const updated = await users.findOneAndUpdate(
    { _id: me._id },
    { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { returnDocument: "after" },
  );
  return toPrivateUser(updated!);
}

export async function adminUpdateUser(actor: UserDoc, id: string, input: z.infer<typeof adminUserSchema>): Promise<User> {
  const _id = toObjectId(id);
  if (!_id) throw notFound("User not found.");
  const { users } = await cols();
  const target = await users.findOne({ _id });
  if (!target) throw notFound("User not found.");

  const actorIsAdmin = actor.role === "admin";
  if (input.role !== undefined && !actorIsAdmin) throw forbidden("Only admins can change roles.");
  if (!actorIsAdmin && (target.role === "admin" || target.role === "moderator")) {
    throw forbidden("Moderators cannot change other staff accounts.");
  }
  if (target._id.equals(actor._id) && (input.status === "suspended" || (input.role && input.role !== actor.role))) {
    throw forbidden("You cannot suspend or demote yourself.");
  }
  if (target.role === "admin" && input.role && input.role !== "admin") {
    const admins = await users.countDocuments({ role: "admin", status: "active" });
    if (admins <= 1) throw forbidden("Cannot demote the last admin.");
  }

  const set: Partial<UserDoc> = { updatedAt: new Date() };
  if (input.role) set.role = input.role;
  if (input.status) set.status = input.status;
  const updated = await users.findOneAndUpdate({ _id }, { $set: set }, { returnDocument: "after" });
  // Suspension takes effect immediately: every session of that user is revoked.
  if (input.status === "suspended") await revokeAllSessions(_id);
  return toUser(updated!);
}
