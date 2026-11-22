import "server-only";
import { ObjectId } from "mongodb";
import type { z } from "zod";
import type { Article } from "@/types/domain";
import { cols, toArticle, toObjectId, type ArticleDoc, type UserDoc } from "../db";
import { hasRole, isTrustedWriter } from "../auth";
import { forbidden, invalid, notFound } from "../http/errors";
import { htmlToText, sanitizePlainText, sanitizeRichText } from "../security/sanitize";
import { makeExcerpt, makeSlug, readingMinutes } from "../lib/text";
import type { adminArticleSchema, articlePatchSchema, articleSchema } from "../validation/schemas";

async function assertCategory(slug: string) {
  const { categories } = await cols();
  if (!(await categories.findOne({ _id: slug }, { projection: { _id: 1 } }))) {
    throw invalid("Unknown category.", { category: "Choose one of the listed categories" });
  }
}

function derive(body: string, excerpt?: string) {
  const text = htmlToText(body);
  return {
    excerpt: excerpt ? sanitizePlainText(excerpt) : makeExcerpt(text),
    readingMinutes: readingMinutes(text),
  };
}

async function loadOwned(id: string, me: UserDoc): Promise<ArticleDoc> {
  const _id = toObjectId(id);
  if (!_id) throw notFound("Article not found.");
  const { articles } = await cols();
  const doc = await articles.findOne({ _id });
  if (!doc) throw notFound("Article not found.");
  if (!doc.authorId.equals(me._id)) throw forbidden("Only the author can change this article.");
  return doc;
}

export async function createArticle(me: UserDoc, input: z.infer<typeof articleSchema>): Promise<Article> {
  await assertCategory(input.category);
  const body = sanitizeRichText(input.body);
  const now = new Date();
  const doc: ArticleDoc = {
    _id: new ObjectId(),
    slug: makeSlug(input.title, "article"),
    title: sanitizePlainText(input.title),
    subtitle: input.subtitle ? sanitizePlainText(input.subtitle) : undefined,
    body,
    ...derive(body, input.excerpt),
    type: input.type,
    category: input.category,
    tags: [...new Set(input.tags.map((t) => sanitizePlainText(t)).filter(Boolean))],
    language: input.language,
    coverImage: input.coverImage,
    coverAlt: input.coverAlt ? sanitizePlainText(input.coverAlt) : undefined,
    authorId: me._id,
    status: "draft",
    featured: false,
    editorsPick: false,
    createdAt: now,
    updatedAt: now,
    stats: { views: 0, likes: 0, comments: 0, bookmarks: 0 },
  };
  for (const k of Object.keys(doc) as (keyof ArticleDoc)[]) if (doc[k] === undefined) delete doc[k];
  const { articles } = await cols();
  await articles.insertOne(doc);
  return toArticle(doc);
}

export async function updateArticle(me: UserDoc, id: string, input: z.infer<typeof articlePatchSchema>): Promise<Article> {
  const doc = await loadOwned(id, me);
  if (doc.status === "archived") throw forbidden("Archived articles cannot be edited.");
  if (input.category) await assertCategory(input.category);

  const set: Partial<ArticleDoc> = { updatedAt: new Date() };
  if (input.title !== undefined) set.title = sanitizePlainText(input.title);
  if (input.subtitle !== undefined) set.subtitle = sanitizePlainText(input.subtitle);
  if (input.type) set.type = input.type;
  if (input.category) set.category = input.category;
  if (input.tags) set.tags = [...new Set(input.tags.map((t) => sanitizePlainText(t)).filter(Boolean))];
  if (input.language) set.language = input.language;
  if (input.coverImage !== undefined) set.coverImage = input.coverImage;
  if (input.coverAlt !== undefined) set.coverAlt = sanitizePlainText(input.coverAlt);
  if (input.body !== undefined) {
    set.body = sanitizeRichText(input.body);
    Object.assign(set, derive(set.body, input.excerpt ?? undefined));
  } else if (input.excerpt !== undefined) {
    set.excerpt = sanitizePlainText(input.excerpt);
  }
  // An untrusted author editing a live article sends it back to review, so
  // moderation cannot be bypassed by publishing something benign and editing it later.
  if (doc.status === "published" && !isTrustedWriter(me)) set.status = "pending";

  const { articles } = await cols();
  const updated = await articles.findOneAndUpdate({ _id: doc._id }, { $set: set }, { returnDocument: "after" });
  if (!updated) throw notFound("Article not found.");
  return toArticle(updated);
}

export async function submitArticle(me: UserDoc, id: string): Promise<Article> {
  const doc = await loadOwned(id, me);
  if (!["draft", "rejected"].includes(doc.status)) {
    throw invalid(`Only drafts can be submitted (this article is ${doc.status}).`);
  }
  if (htmlToText(doc.body).length < 200) {
    throw invalid("Your article is too short to submit (at least 200 characters).", { body: "Too short" });
  }
  const now = new Date();
  const publish = isTrustedWriter(me);
  const { articles, users } = await cols();
  const updated = await articles.findOneAndUpdate(
    { _id: doc._id },
    {
      $set: {
        status: publish ? "published" : "pending",
        updatedAt: now,
        ...(publish ? { publishedAt: doc.publishedAt ?? now } : {}),
      },
    },
    { returnDocument: "after" },
  );
  if (publish && !doc.publishedAt) await users.updateOne({ _id: me._id }, { $inc: { "stats.articles": 1 } });
  return toArticle(updated!);
}

export async function deleteArticle(me: UserDoc, id: string): Promise<null> {
  const _id = toObjectId(id);
  if (!_id) throw notFound("Article not found.");
  const c = await cols();
  const doc = await c.articles.findOne({ _id });
  if (!doc) throw notFound("Article not found.");
  if (!doc.authorId.equals(me._id) && !hasRole(me, "admin")) throw forbidden("Only the author can delete this article.");

  const commentIds = (await c.comments.find({ targetType: "article", targetId: _id }, { projection: { _id: 1 } }).toArray()).map(
    (x) => x._id,
  );
  await Promise.all([
    c.articles.deleteOne({ _id }),
    c.comments.deleteMany({ targetType: "article", targetId: _id }),
    c.likes.deleteMany({ targetType: "article", targetId: _id }),
    commentIds.length ? c.likes.deleteMany({ targetType: "comment", targetId: { $in: commentIds } }) : null,
    c.bookmarks.deleteMany({ articleId: _id }),
    doc.publishedAt ? c.users.updateOne({ _id: doc.authorId }, { $inc: { "stats.articles": -1 } }) : null,
  ]);
  return null;
}

async function loadPublished(id: string): Promise<ArticleDoc> {
  const _id = toObjectId(id);
  if (!_id) throw notFound("Article not found.");
  const { articles } = await cols();
  const doc = await articles.findOne({ _id, status: "published" });
  if (!doc) throw notFound("Article not found.");
  return doc;
}

export async function toggleLike(me: UserDoc, id: string): Promise<{ likes: number; liked: boolean }> {
  const doc = await loadPublished(id);
  const { likes, articles } = await cols();
  const removed = await likes.deleteOne({ userId: me._id, targetType: "article", targetId: doc._id });
  let liked: boolean;
  if (removed.deletedCount) {
    liked = false;
    await articles.updateOne({ _id: doc._id }, { $inc: { "stats.likes": -1 } });
  } else {
    try {
      await likes.insertOne({ _id: new ObjectId(), userId: me._id, targetType: "article", targetId: doc._id, createdAt: new Date() });
      await articles.updateOne({ _id: doc._id }, { $inc: { "stats.likes": 1 } });
    } catch (e) {
      if (!(e instanceof Error && "code" in e && (e as { code: number }).code === 11000)) throw e; // double-click race: already liked
    }
    liked = true;
  }
  const fresh = await articles.findOne({ _id: doc._id }, { projection: { "stats.likes": 1 } });
  return { likes: Math.max(0, fresh?.stats.likes ?? 0), liked };
}

export async function toggleBookmark(me: UserDoc, id: string): Promise<{ bookmarks: number; bookmarked: boolean }> {
  const doc = await loadPublished(id);
  const { bookmarks, articles } = await cols();
  const removed = await bookmarks.deleteOne({ userId: me._id, articleId: doc._id });
  let bookmarked: boolean;
  if (removed.deletedCount) {
    bookmarked = false;
    await articles.updateOne({ _id: doc._id }, { $inc: { "stats.bookmarks": -1 } });
  } else {
    try {
      await bookmarks.insertOne({ _id: new ObjectId(), userId: me._id, articleId: doc._id, createdAt: new Date() });
      await articles.updateOne({ _id: doc._id }, { $inc: { "stats.bookmarks": 1 } });
    } catch (e) {
      if (!(e instanceof Error && "code" in e && (e as { code: number }).code === 11000)) throw e;
    }
    bookmarked = true;
  }
  const fresh = await articles.findOne({ _id: doc._id }, { projection: { "stats.bookmarks": 1 } });
  return { bookmarks: Math.max(0, fresh?.stats.bookmarks ?? 0), bookmarked };
}

export async function moderateArticle(id: string, input: z.infer<typeof adminArticleSchema>): Promise<Article> {
  const _id = toObjectId(id);
  if (!_id) throw notFound("Article not found.");
  const { articles, users } = await cols();
  const doc = await articles.findOne({ _id });
  if (!doc) throw notFound("Article not found.");
  const now = new Date();
  const set: Partial<ArticleDoc> = { updatedAt: now };
  if (input.featured !== undefined) set.featured = input.featured;
  if (input.editorsPick !== undefined) set.editorsPick = input.editorsPick;
  if (input.moderationNote !== undefined) set.moderationNote = sanitizePlainText(input.moderationNote);
  if (input.status) {
    set.status = input.status;
    if (input.status === "published" && !doc.publishedAt) set.publishedAt = now;
  }
  const updated = await articles.findOneAndUpdate({ _id }, { $set: set }, { returnDocument: "after" });
  if (input.status === "published" && !doc.publishedAt) {
    await users.updateOne({ _id: doc.authorId }, { $inc: { "stats.articles": 1 } });
  }
  return toArticle(updated!);
}
