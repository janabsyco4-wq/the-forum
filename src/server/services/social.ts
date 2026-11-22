/** Following people and the newsletter list. */
import "server-only";
import { ObjectId } from "mongodb";
import type { Locale } from "@/types/domain";
import { cols, toObjectId, type UserDoc } from "../db";
import { invalid, notFound } from "../http/errors";

/**
 * Toggles "me follows :id". Keeps users.stats.followers (on the followed user)
 * and users.stats.following (on me) in step with the follows collection.
 */
export async function toggleFollow(me: UserDoc, id: string): Promise<{ followers: number; following: boolean }> {
  const targetId = toObjectId(id);
  if (!targetId) throw notFound("User not found.");
  if (targetId.equals(me._id)) throw invalid("You cannot follow yourself.");
  const { users, follows } = await cols();
  const target = await users.findOne({ _id: targetId, status: { $ne: "suspended" } }, { projection: { _id: 1 } });
  if (!target) throw notFound("User not found.");

  let following: boolean;
  const removed = await follows.deleteOne({ followerId: me._id, followeeId: targetId });
  if (removed.deletedCount) {
    following = false;
    await Promise.all([
      users.updateOne({ _id: targetId }, { $inc: { "stats.followers": -1 } }),
      users.updateOne({ _id: me._id }, { $inc: { "stats.following": -1 } }),
    ]);
  } else {
    following = true;
    try {
      await follows.insertOne({ _id: new ObjectId(), followerId: me._id, followeeId: targetId, createdAt: new Date() });
      await Promise.all([
        users.updateOne({ _id: targetId }, { $inc: { "stats.followers": 1 } }),
        users.updateOne({ _id: me._id }, { $inc: { "stats.following": 1 } }),
      ]);
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e; // double-click race: already following, counters untouched
    }
  }
  const fresh = await users.findOne({ _id: targetId }, { projection: { "stats.followers": 1 } });
  return { followers: Math.max(0, fresh?.stats.followers ?? 0), following };
}

export async function isFollowing(followerId: ObjectId, followeeId: string): Promise<boolean> {
  const target = toObjectId(followeeId);
  if (!target) return false;
  const { follows } = await cols();
  return !!(await follows.findOne({ followerId, followeeId: target }, { projection: { _id: 1 } }));
}

/** Idempotent: subscribing the same address twice is still `{ subscribed: true }`. */
export async function subscribeNewsletter(email: string, opts: { locale?: Locale; userId?: ObjectId }): Promise<{ subscribed: true }> {
  const { newsletter } = await cols();
  try {
    await newsletter.updateOne(
      { email },
      {
        $setOnInsert: {
          _id: new ObjectId(),
          email,
          createdAt: new Date(),
          ...(opts.locale ? { locale: opts.locale } : {}),
          ...(opts.userId ? { userId: opts.userId } : {}),
        },
      },
      { upsert: true },
    );
  } catch (e) {
    if ((e as { code?: number }).code !== 11000) throw e; // concurrent upsert of the same email: already subscribed
  }
  return { subscribed: true };
}
