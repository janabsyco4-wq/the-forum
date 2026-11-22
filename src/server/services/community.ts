/** Comments, discussions and reports. */
import "server-only";
import { ObjectId } from "mongodb";
import type { z } from "zod";
import type { Comment, Discussion, Report } from "@/types/domain";
import { cols, toComment, toDiscussion, toObjectId, toReport, type CommentDoc, type DiscussionDoc, type UserDoc } from "../db";
import { conflict, forbidden, invalid, notFound } from "../http/errors";
import { htmlToText, sanitizePlainText } from "../security/sanitize";
import { makeExcerpt, makeSlug } from "../lib/text";
import type { commentSchema, discussionSchema, reportSchema } from "../validation/schemas";

export async function createComment(me: UserDoc, input: z.infer<typeof commentSchema>): Promise<Comment> {
  const c = await cols();
  const targetId = new ObjectId(input.targetId);

  if (input.targetType === "article") {
    const a = await c.articles.findOne({ _id: targetId, status: "published" }, { projection: { _id: 1 } });
    if (!a) throw notFound("Article not found.");
  } else {
    const d = await c.discussions.findOne({ _id: targetId, status: "visible" }, { projection: { locked: 1 } });
    if (!d) throw notFound("Discussion not found.");
    if (d.locked) throw forbidden("This discussion is locked.");
  }

  let parentId: ObjectId | undefined;
  if (input.parentId) {
    parentId = new ObjectId(input.parentId);
    const parent = await c.comments.findOne({ _id: parentId }, { projection: { targetId: 1, targetType: 1, status: 1 } });
    if (!parent || !parent.targetId.equals(targetId) || parent.targetType !== input.targetType || parent.status === "removed") {
      throw invalid("The comment you are replying to does not exist.", { parentId: "Not found" });
    }
  }

  const body = sanitizePlainText(input.body);
  if (!body) throw invalid("Comment cannot be empty.", { body: "Required" });

  const now = new Date();
  const doc: CommentDoc = {
    _id: new ObjectId(),
    targetType: input.targetType,
    targetId,
    ...(parentId ? { parentId } : {}),
    authorId: me._id,
    body,
    createdAt: now,
    likes: 0,
    status: "visible",
  };
  await c.comments.insertOne(doc);

  if (input.targetType === "article") {
    await c.articles.updateOne({ _id: targetId }, { $inc: { "stats.comments": 1 } });
  } else {
    const participants = (await c.comments.distinct("authorId", { targetType: "discussion", targetId })).length;
    await c.discussions.updateOne(
      { _id: targetId },
      { $inc: { "stats.replies": 1 }, $set: { lastActivityAt: now, "stats.participants": participants } },
    );
  }
  return toComment(doc);
}

export async function createDiscussion(me: UserDoc, input: z.infer<typeof discussionSchema>): Promise<Discussion> {
  const now = new Date();
  const doc: DiscussionDoc = {
    _id: new ObjectId(),
    slug: makeSlug(input.title, "discussion"),
    title: sanitizePlainText(input.title),
    body: sanitizePlainText(input.body),
    topic: input.topic,
    language: input.language,
    authorId: me._id,
    createdAt: now,
    lastActivityAt: now,
    pinned: false,
    locked: false,
    status: "visible",
    stats: { replies: 0, views: 0, participants: 1 },
  };
  const c = await cols();
  await c.discussions.insertOne(doc);
  await c.users.updateOne({ _id: me._id }, { $inc: { "stats.discussions": 1 } });
  return toDiscussion(doc);
}

/** Snapshot text of whatever is being reported, so moderators see it even if it is edited later. */
async function preview(targetType: z.infer<typeof reportSchema>["targetType"], id: ObjectId): Promise<string | null> {
  const c = await cols();
  switch (targetType) {
    case "article": {
      const d = await c.articles.findOne({ _id: id }, { projection: { title: 1, excerpt: 1 } });
      return d ? `${d.title} — ${d.excerpt}` : null;
    }
    case "comment": {
      const d = await c.comments.findOne({ _id: id }, { projection: { body: 1 } });
      return d?.body ?? null;
    }
    case "discussion": {
      const d = await c.discussions.findOne({ _id: id }, { projection: { title: 1, body: 1 } });
      return d ? `${d.title} — ${d.body}` : null;
    }
    case "argument": {
      const d = await c.arguments.findOne({ _id: id }, { projection: { title: 1, body: 1 } });
      return d ? [d.title, d.body].filter(Boolean).join(" — ") : null;
    }
    case "user": {
      const d = await c.users.findOne({ _id: id }, { projection: { name: 1, username: 1, bio: 1 } });
      return d ? `${d.name} (@${d.username})${d.bio ? " — " + d.bio : ""}` : null;
    }
  }
}

export async function createReport(me: UserDoc, input: z.infer<typeof reportSchema>): Promise<Report> {
  const targetId = new ObjectId(input.targetId);
  const snap = await preview(input.targetType, targetId);
  if (snap === null) throw notFound("The content you are reporting no longer exists.");
  if (input.targetType === "user" && targetId.equals(me._id)) throw invalid("You cannot report yourself.");

  const { reports } = await cols();
  const dup = await reports.findOne({
    reporterId: me._id,
    targetType: input.targetType,
    targetId,
    status: { $in: ["open", "reviewing"] },
  });
  if (dup) throw conflict("You have already reported this. Our moderators are on it.");

  const doc = {
    _id: new ObjectId(),
    targetType: input.targetType,
    targetId,
    targetPreview: makeExcerpt(htmlToText(snap), 300),
    reason: input.reason,
    ...(input.details ? { details: sanitizePlainText(input.details) } : {}),
    reporterId: me._id,
    createdAt: new Date(),
    status: "open" as const,
  };
  await reports.insertOne(doc);
  return toReport(doc);
}

export async function resolveReport(me: UserDoc, id: string, status: Report["status"], resolution?: string): Promise<Report> {
  const _id = toObjectId(id);
  if (!_id) throw notFound("Report not found.");
  const { reports } = await cols();
  const closing = status === "resolved" || status === "dismissed";
  const updated = await reports.findOneAndUpdate(
    { _id },
    {
      $set: {
        status,
        ...(resolution !== undefined ? { resolution: sanitizePlainText(resolution) } : {}),
        ...(closing ? { resolvedBy: me._id, resolvedAt: new Date() } : {}),
      },
      ...(closing ? {} : { $unset: { resolvedBy: "", resolvedAt: "" } }),
    },
    { returnDocument: "after" },
  );
  if (!updated) throw notFound("Report not found.");
  return toReport(updated);
}

export async function setContentStatus(type: string, id: string, status: "visible" | "hidden" | "removed"): Promise<null> {
  const _id = toObjectId(id);
  if (!_id) throw notFound("Content not found.");
  const c = await cols();
  const coll =
    type === "comment" || type === "comments"
      ? c.comments
      : type === "argument" || type === "arguments"
        ? c.arguments
        : type === "discussion" || type === "discussions"
          ? c.discussions
          : null;
  if (!coll) throw invalid("Type must be comment, argument or discussion.", { type: "Unsupported" });
  const r = await (coll as typeof c.comments).updateOne({ _id }, { $set: { status } });
  if (!r.matchedCount) throw notFound("Content not found.");
  return null;
}
