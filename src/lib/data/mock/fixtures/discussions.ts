import type { Comment, Discussion } from "@/types/domain";
import { ago } from "./_time";

const d = (x: Omit<Discussion, "status" | "pinned" | "locked"> & Partial<Pick<Discussion, "pinned" | "locked">>): Discussion => ({
  pinned: false,
  locked: false,
  status: "visible",
  ...x,
});

export const discussions: Discussion[] = [
  d({
    id: "t1", slug: "community-guidelines-read-first", topic: "other", language: "en", authorId: "u12", pinned: true,
    title: "Welcome — how discussions work here (read first)",
    body: "Discussions are for open questions, not announcements. Ask something you genuinely want to think through, cite sources where you can, and critique ideas rather than people. Moderators may lock threads that turn into personal attacks.",
    createdAt: ago(120), lastActivityAt: ago(2), stats: { replies: 34, views: 5200, participants: 30 },
  }),
  d({
    id: "t2", slug: "imf-programme-who-bears-the-cost", topic: "economy", language: "en", authorId: "u1",
    title: "Who actually bears the cost of an IMF programme?",
    body: "Every programme comes with tax measures and energy price rises. I want to understand distribution: which households lose most, and is there any version of stabilisation that protects the bottom 40%? Looking for data, not slogans.",
    createdAt: ago(3), lastActivityAt: ago(0, 2), stats: { replies: 58, views: 3410, participants: 27 },
  }),
  d({
    id: "t3", slug: "should-history-textbooks-include-1971", topic: "history", language: "en", authorId: "u4",
    title: "How should our textbooks teach 1971?",
    body: "Most of us learned almost nothing about the separation of East Pakistan at school. What would an honest, age-appropriate account look like — and who should write it?",
    createdAt: ago(5), lastActivityAt: ago(0, 5), stats: { replies: 41, views: 2980, participants: 22 },
  }),
  d({
    id: "t4", slug: "is-hostel-curfew-for-women-justified", topic: "society", language: "en", authorId: "u7",
    title: "Are separate hostel curfews for women ever justified?",
    body: "Many universities set earlier curfews for women’s hostels, citing safety and parental expectations. Is that a reasonable accommodation or institutionalised discrimination? What do other countries’ universities do?",
    createdAt: ago(2), lastActivityAt: ago(0, 8), stats: { replies: 77, views: 4620, participants: 39 },
  }),
  d({
    id: "t5", slug: "local-government-elections", topic: "politics", language: "en", authorId: "u2",
    title: "Why do provinces keep delaying local government elections?",
    body: "Article 140A requires devolved local government, yet elections are repeatedly postponed. Is this about capacity, or about provincial politicians not wanting to share power?",
    createdAt: ago(6), lastActivityAt: ago(1), stats: { replies: 29, views: 1880, participants: 18 },
  }),
  d({
    id: "t6", slug: "matric-intermediate-board-reform", topic: "education", language: "en", authorId: "u9",
    title: "Would a single national exam board be better than provincial boards?",
    body: "Grade inflation varies wildly between boards, which makes university admissions unfair. Would a national board fix this or just centralise the problem?",
    createdAt: ago(4), lastActivityAt: ago(1, 4), stats: { replies: 36, views: 2240, participants: 25 },
  }),
  d({
    id: "t7", slug: "heatwaves-and-working-hours", topic: "current-affairs", language: "en", authorId: "u3",
    title: "Should heatwave working-hour limits be legally enforced?",
    body: "Outdoor workers in Sindh and Punjab work through 48°C days. Some countries ban outdoor work during peak hours. Could that work here, given how many people are informally employed?",
    createdAt: ago(8), lastActivityAt: ago(2), stats: { replies: 24, views: 1510, participants: 17 },
  }),
  d({
    id: "t8", slug: "mobile-phones-in-classrooms", topic: "education", language: "en", authorId: "u6",
    title: "Ban phones in lectures, or design lectures worth paying attention to?",
    body: "Several faculties are considering phone bans. I think the problem is passive lectures, not phones. Change my mind.",
    createdAt: ago(1), lastActivityAt: ago(0, 1), stats: { replies: 19, views: 980, participants: 14 },
  }),
  d({
    id: "t9", slug: "kya-sheher-dehaat-ko-kha-rahe-hain", topic: "society", language: "ur", authorId: "u5",
    title: "کیا شہر دیہات کو نگل رہے ہیں؟",
    body: "لاہور اور کراچی کے گرد زرعی زمینیں ہاؤسنگ سوسائٹیوں میں بدل رہی ہیں۔ کیا یہ ترقی ہے یا خوراک کے تحفظ کے لیے خطرہ؟",
    createdAt: ago(3), lastActivityAt: ago(0, 6), stats: { replies: 32, views: 2050, participants: 21 },
  }),
  d({
    id: "t10", slug: "free-will-and-determinism", topic: "philosophy", language: "en", authorId: "u10",
    title: "If neuroscience explains every decision, what is left of moral responsibility?",
    body: "A friend in the neuroscience lab argues that free will is an illusion. If so, what happens to praise, blame and punishment? Compatibilists welcome.",
    createdAt: ago(9), lastActivityAt: ago(3), stats: { replies: 45, views: 2700, participants: 23 },
  }),
];

export const comments: Comment[] = [
  // On article a1
  { id: "c1", targetType: "article", targetId: "a1", authorId: "u10", body: "The point about rubrics is crucial. I’ve seen examiners mark down a better argument because it didn’t list the ‘expected’ five points. Publishing marking schemes would change behaviour overnight.", createdAt: ago(1, 10), likes: 48, status: "visible" },
  { id: "c2", targetType: "article", targetId: "a1", parentId: "c1", authorId: "u1", body: "Exactly — and it costs nothing. The resistance is mostly about examiners not wanting their judgement questioned.", createdAt: ago(1, 6), likes: 21, status: "visible" },
  { id: "c3", targetType: "article", targetId: "a1", authorId: "u7", body: "I’d add one caveat: open-book exams favour students who can afford good notes and reference books. We need library access to go with it.", createdAt: ago(1, 2), likes: 33, status: "visible" },
  { id: "c4", targetType: "article", targetId: "a1", authorId: "u6", body: "Shared this with our faculty’s curriculum committee. Thank you for writing it so clearly.", createdAt: ago(0, 9), likes: 12, status: "visible" },
  // On article a6
  { id: "c5", targetType: "article", targetId: "a6", authorId: "u10", body: "بہت عمدہ تحریر۔ ”تشکیلِ جدید“ کو نصاب میں شامل کرنے کی تجویز پر مکمل اتفاق ہے۔", createdAt: ago(2), likes: 40, status: "visible" },
  { id: "c6", targetType: "article", targetId: "a6", authorId: "u4", body: "اقبال سے اختلاف کی ہمت والی بات دل کو لگی۔ ہم نے شخصیات کو بت بنا دیا ہے۔", createdAt: ago(1), likes: 25, status: "visible" },
  // On article a3
  { id: "c7", targetType: "article", targetId: "a3", authorId: "u8", body: "The loans-versus-grants point deserves its own essay. Do you have figures on how much of the post-2022 pledges arrived as debt?", createdAt: ago(5), likes: 19, status: "visible" },
  // Discussion replies
  { id: "c8", targetType: "discussion", targetId: "t2", authorId: "u8", body: "The distributional evidence suggests energy price increases hit lower-middle-income urban households hardest, since the very poor often consume little grid electricity. Targeted transfers through BISP are the usual answer, but coverage gaps are large.", createdAt: ago(2), likes: 31, status: "visible" },
  { id: "c9", targetType: "discussion", targetId: "t2", authorId: "u7", body: "Worth separating the programme from the crisis that made it necessary. Without a programme, the adjustment happens anyway — through inflation, which is the most regressive tax of all.", createdAt: ago(1, 12), likes: 44, status: "visible" },
  { id: "c10", targetType: "discussion", targetId: "t2", parentId: "c9", authorId: "u1", body: "Fair, but that’s an argument for a programme, not for this particular mix of measures. The sequencing of tax measures is still a choice.", createdAt: ago(1, 4), likes: 18, status: "visible" },
  { id: "c11", targetType: "discussion", targetId: "t4", authorId: "u13", body: "At my university the curfew difference is justified as ‘safety’, but the actual safety measures — lighting, transport, security — are the same for both hostels. If safety were the reason, we’d invest in those.", createdAt: ago(1), likes: 52, status: "visible" },
  { id: "c12", targetType: "discussion", targetId: "t4", authorId: "u12", body: "Reminder to keep this one focused on policy rather than individual experiences of specific staff. Great thread so far.", createdAt: ago(0, 20), likes: 9, status: "visible" },
  { id: "c13", targetType: "discussion", targetId: "t3", authorId: "u2", body: "Start with primary sources and multiple perspectives, including Bengali accounts. Students can handle complexity; what they can’t handle is discovering later that they were told half a story.", createdAt: ago(3), likes: 37, status: "visible" },
  { id: "c14", targetType: "discussion", targetId: "t9", authorId: "u9", body: "سندھ میں بھی یہی ہو رہا ہے۔ مسئلہ ترقی نہیں، منصوبہ بندی کا فقدان ہے۔", createdAt: ago(1), likes: 14, status: "visible" },
];
