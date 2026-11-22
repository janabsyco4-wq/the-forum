import "server-only";
import { ObjectId } from "mongodb";
import type { z } from "zod";
import type { Debate, DebateArgument } from "@/types/domain";
import {
  cols,
  effectiveDebateStatus,
  toArgument,
  toDebate,
  toObjectId,
  type ArgumentDoc,
  type DebateDoc,
  type UserDoc,
} from "../db";
import { forbidden, invalid, notFound } from "../http/errors";
import { sanitizePlainText, sanitizeRichText } from "../security/sanitize";
import { makeSlug } from "../lib/text";
import type { argumentSchema, conclusionSchema, debatePatchSchema, debateSchema } from "../validation/schemas";

function dates(opensAt: string | Date, closesAt: string | Date) {
  const o = new Date(opensAt);
  const c = new Date(closesAt);
  if (Number.isNaN(o.getTime()) || Number.isNaN(c.getTime())) throw invalid("Invalid dates.");
  if (c <= o) throw invalid("The deadline must be after the opening time.", { closesAt: "Must be after opensAt" });
  return { opensAt: o, closesAt: c };
}

async function loadDebate(id: string): Promise<DebateDoc> {
  const _id = toObjectId(id);
  if (!_id) throw notFound("Debate not found.");
  const { debates } = await cols();
  const d = await debates.findOne({ _id });
  if (!d) throw notFound("Debate not found.");
  return d;
}

export async function createDebate(me: UserDoc, input: z.infer<typeof debateSchema>): Promise<Debate> {
  const { opensAt, closesAt } = dates(input.opensAt, input.closesAt);
  const { debates } = await cols();
  const last = await debates.find({}, { projection: { weekNumber: 1 } }).sort({ weekNumber: -1 }).limit(1).next();
  const now = new Date();
  const base = {
    _id: new ObjectId(),
    slug: makeSlug(input.title, "debate"),
    title: sanitizePlainText(input.title),
    question: sanitizePlainText(input.question),
    context: sanitizeRichText(input.context),
    category: input.category,
    language: input.language,
    ...(input.coverImage ? { coverImage: input.coverImage } : {}),
    weekNumber: (last?.weekNumber ?? 0) + 1,
    opensAt,
    closesAt,
    sides: { for: sanitizePlainText(input.sides.for), against: sanitizePlainText(input.sides.against) },
    readings: input.readings.map((r) => ({ title: sanitizePlainText(r.title), url: r.url })),
    createdBy: me._id,
    stats: { arguments: 0, participants: 0, votesFor: 0, votesAgainst: 0 },
    createdAt: now,
    updatedAt: now,
  };
  const doc: DebateDoc = { ...base, status: effectiveDebateStatus(base) };
  await debates.insertOne(doc);
  return toDebate(doc);
}

export async function updateDebate(id: string, input: z.infer<typeof debatePatchSchema>): Promise<Debate> {
  const d = await loadDebate(id);
  const set: Partial<DebateDoc> = { updatedAt: new Date() };
  if (input.title !== undefined) set.title = sanitizePlainText(input.title);
  if (input.question !== undefined) set.question = sanitizePlainText(input.question);
  if (input.context !== undefined) set.context = sanitizeRichText(input.context);
  if (input.category !== undefined) set.category = input.category;
  if (input.language !== undefined) set.language = input.language;
  if (input.coverImage !== undefined) set.coverImage = input.coverImage;
  if (input.sides) set.sides = { for: sanitizePlainText(input.sides.for), against: sanitizePlainText(input.sides.against) };
  if (input.readings) set.readings = input.readings.map((r) => ({ title: sanitizePlainText(r.title), url: r.url }));
  if (input.opensAt !== undefined || input.closesAt !== undefined) {
    Object.assign(set, dates(input.opensAt ?? d.opensAt, input.closesAt ?? d.closesAt));
  }
  set.status = effectiveDebateStatus({ ...d, ...set });
  const { debates } = await cols();
  const updated = await debates.findOneAndUpdate({ _id: d._id }, { $set: set }, { returnDocument: "after" });
  return toDebate(updated!);
}

export async function submitArgument(me: UserDoc, debateId: string, input: z.infer<typeof argumentSchema>): Promise<DebateArgument> {
  const d = await loadDebate(debateId);
  const now = new Date();
  if (d.conclusion) throw forbidden("This debate has been concluded.");
  if (now < d.opensAt) throw forbidden("This debate is not open for submissions yet.");
  if (now >= d.closesAt) throw forbidden(`Submissions closed on ${d.closesAt.toISOString()}.`);

  const c = await cols();
  let parentId: ObjectId | undefined;
  if (input.kind === "counterargument" || input.kind === "reply") {
    if (!input.parentId) throw invalid("Counterarguments and replies must answer an existing argument.", { parentId: "Required" });
    parentId = new ObjectId(input.parentId);
    const parent = await c.arguments.findOne({ _id: parentId }, { projection: { debateId: 1, status: 1 } });
    if (!parent || !parent.debateId.equals(d._id) || parent.status === "removed") {
      throw invalid("The argument you are answering does not exist in this debate.", { parentId: "Not found" });
    }
  } else if (input.parentId) {
    throw invalid("Top-level arguments and solutions cannot have a parent.", { parentId: "Not allowed" });
  }

  const doc: ArgumentDoc = {
    _id: new ObjectId(),
    debateId: d._id,
    authorId: me._id,
    kind: input.kind,
    side: input.side,
    ...(parentId ? { parentId } : {}),
    ...(input.title ? { title: sanitizePlainText(input.title) } : {}),
    body: sanitizePlainText(input.body),
    createdAt: now,
    votes: 0,
    status: "visible",
  };
  await c.arguments.insertOne(doc);
  const participants = (await c.arguments.distinct("authorId", { debateId: d._id })).length;
  await Promise.all([
    c.debates.updateOne({ _id: d._id }, { $inc: { "stats.arguments": 1 }, $set: { "stats.participants": participants } }),
    c.users.updateOne({ _id: me._id }, { $inc: { "stats.arguments": 1 } }),
  ]);
  return toArgument(doc);
}

export async function concludeDebate(me: UserDoc, id: string, input: z.infer<typeof conclusionSchema>): Promise<Debate> {
  const d = await loadDebate(id);
  if (new Date() < d.closesAt) throw forbidden("A debate can only be concluded after its submission deadline.");
  const conclusion = {
    summary: sanitizePlainText(input.summary),
    body: sanitizeRichText(input.body),
    authorId: me._id,
    publishedAt: d.conclusion?.publishedAt ?? new Date(),
    ...(input.verdict ? { verdict: input.verdict } : {}),
  };
  const { debates } = await cols();
  const updated = await debates.findOneAndUpdate(
    { _id: d._id },
    { $set: { conclusion, status: "concluded", updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return toDebate(updated!);
}

/**
 * Up/down vote on an argument. Sending the same value again removes the vote;
 * sending the opposite value switches it. Returns the argument's net votes.
 */
export async function voteArgument(me: UserDoc, argumentId: string, value: 1 | -1): Promise<{ votes: number }> {
  const _id = toObjectId(argumentId);
  if (!_id) throw notFound("Argument not found.");
  const c = await cols();
  const arg = await c.arguments.findOne({ _id, status: "visible" });
  if (!arg) throw notFound("Argument not found.");
  if (arg.authorId.equals(me._id)) throw forbidden("You cannot vote on your own argument.");

  const existing = await c.votes.findOne({ userId: me._id, argumentId: _id });
  let delta = 0;
  if (!existing) {
    try {
      await c.votes.insertOne({ _id: new ObjectId(), userId: me._id, argumentId: _id, value, createdAt: new Date() });
      delta = value;
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  } else if (existing.value === value) {
    const r = await c.votes.deleteOne({ _id: existing._id });
    if (r.deletedCount) delta = -value;
  } else {
    const r = await c.votes.updateOne({ _id: existing._id, value: existing.value }, { $set: { value } });
    if (r.modifiedCount) delta = value * 2;
  }
  if (delta) await c.arguments.updateOne({ _id }, { $inc: { votes: delta } });
  const fresh = await c.arguments.findOne({ _id }, { projection: { votes: 1 } });
  return { votes: fresh?.votes ?? 0 };
}
