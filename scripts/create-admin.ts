/**
 * Creates an admin account, or promotes an existing account to admin.
 *
 *   npm run db:create-admin -- --email you@uni.edu.pk --username you --name "Your Name"
 *   npm run db:create-admin -- --email you@uni.edu.pk --set-password   # change an existing admin's password
 *
 * The password is read from the ADMIN_PASSWORD environment variable, or typed
 * at a prompt (input hidden). It is hashed with argon2id; it is never printed
 * or logged. If the email already exists, the account is promoted to admin
 * (and its password is only changed when one is supplied). All of that user's
 * sessions are revoked so the new role/password takes effect immediately.
 */
import { ObjectId } from "mongodb";
import { closeDb, getDb } from "../src/server/db/client";
import { collections, type UserDoc } from "../src/server/db/collections";
import { hashPassword } from "../src/server/auth/password";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) return reject(new Error("No TTY for a password prompt; set ADMIN_PASSWORD instead."));
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch: string) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      } else if (ch === "\u007f" || ch === "\b") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run db:create-admin -- --email you@example.com [--username you] [--name "Your Name"]');
  }
  const db = await getDb();
  const { users, sessions } = collections(db);
  const existing = await users.findOne({ email });

  let password = process.env.ADMIN_PASSWORD;
  const wantsNewPassword = process.argv.includes("--set-password");
  if (!password && (!existing || wantsNewPassword)) {
    password = await promptHidden(existing ? "New password (min 12 chars): " : "Password for the new admin (min 12 chars): ");
    if (password.length >= 12 && (await promptHidden("Type it again: ")) !== password) throw new Error("The two passwords do not match. Nothing was changed.");
  }
  if (password !== undefined && password.length < 12) throw new Error("Admin passwords must be at least 12 characters.");

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          role: "admin",
          status: "active",
          updatedAt: new Date(),
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
        },
      },
    );
    await sessions.deleteMany({ userId: existing._id });
    console.log(`Promoted @${existing.username} to admin${password ? " and set a new password" : ""}. Their sessions were revoked.`);
    return;
  }

  const username = arg("username") ?? email.split("@")[0]!.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30);
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(username) || username.length < 3) {
    throw new Error("Pass a valid --username (3–30 letters, numbers, - or _).");
  }
  const now = new Date();
  const doc: UserDoc = {
    _id: new ObjectId(),
    username,
    usernameLower: username.toLowerCase(),
    name: arg("name") ?? username,
    email,
    emailVerified: true,
    passwordHash: await hashPassword(password!),
    preferredLocale: "en",
    role: "admin",
    status: "active",
    badges: [],
    interests: [],
    joinedAt: now,
    updatedAt: now,
    stats: { articles: 0, arguments: 0, discussions: 0, followers: 0, following: 0 },
  };
  await users.insertOne(doc);
  console.log(`Created admin @${username} <${email}>.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
