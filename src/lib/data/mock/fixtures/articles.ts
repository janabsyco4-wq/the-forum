import type { Article } from "@/types/domain";
import { ago } from "./_time";

type Seed = Omit<Article, "createdAt" | "updatedAt" | "publishedAt" | "featured" | "editorsPick" | "status" | "tags" | "readingMinutes"> &
  Partial<Pick<Article, "featured" | "editorsPick" | "status" | "tags">> & { daysAgo: number };

function words(html: string) {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

function make(s: Seed): Article {
  const { daysAgo, ...rest } = s;
  const status = s.status ?? "published";
  const date = ago(daysAgo, 3);
  return {
    featured: false,
    editorsPick: false,
    tags: [],
    ...rest,
    status,
    // Long-form reading speed; Urdu readers are a little slower on screen.
    readingMinutes: Math.max(3, Math.round(words(s.body) / (s.language === "ur" ? 160 : 210)) + 4),
    createdAt: ago(daysAgo + 2),
    updatedAt: date,
    publishedAt: status === "published" ? date : undefined,
  };
}

export const articles: Article[] = [
  make({
    id: "a1", slug: "classrooms-that-reward-memory",
    title: "The Quiet Crisis in Our Classrooms",
    subtitle: "Pakistan’s universities reward memory over thought. Fixing that starts with how we examine students.",
    excerpt: "We built an education system that measures recall with precision and judgement not at all. Students learned the lesson perfectly.",
    type: "essay", category: "education", language: "en", authorId: "u1",
    featured: true, editorsPick: true, tags: ["higher education", "assessment", "reform"],
    stats: { views: 18420, likes: 1240, comments: 86, bookmarks: 640 }, daysAgo: 2,
    body: `<p>Every June, a familiar ritual plays out across Pakistan. Students who have spent the year in lectures they rarely question sit down to answer questions they have seen before. The best of them reproduce, word for word, the notes of a teacher who reproduced, word for word, the notes of a textbook. The grades are excellent. Almost nothing has been learned.</p>
<p>This is not a complaint about students. They are behaving rationally. When an examination rewards recall and penalises originality, memorisation is not laziness — it is strategy. The quiet crisis in our classrooms is that we have designed an incentive system with great precision and then blamed young people for responding to it.</p>
<h2>What gets measured gets taught</h2>
<p>Consider a typical second-year paper in economics. Of its five questions, four ask candidates to “describe” or “explain” a concept that appears, in near-identical form, in the prescribed text. The fifth may ask for a “critical evaluation”, but the marking scheme rewards the listing of points rather than the weighing of them. A student who disagrees with the textbook, carefully and with evidence, risks a lower mark than one who repeats it confidently.</p>
<blockquote>We do not lack curious students. We lack examinations that are curious about them.</blockquote>
<p>Teachers know this. Many of the lecturers I interviewed for this essay described the same bind: they would like to teach argument, but their students will be examined on content, and their own evaluations depend on results. The syllabus becomes a contract, and the contract is about coverage.</p>
<h2>Three changes that would matter</h2>
<p>Reform does not require a new curriculum, an expensive technology programme or a commission. It requires changing what we ask students to do when we test them.</p>
<ul><li><strong>Open-book, unseen questions.</strong> If students may bring their notes, memorisation stops being an advantage and reasoning becomes one.</li><li><strong>Marking schemes that reward judgement.</strong> Publish rubrics that give explicit credit for weighing evidence and reaching a defensible conclusion.</li><li><strong>A written argument in every course.</strong> One sustained essay, with feedback, teaches more than three recall tests.</li></ul>
<p>None of this is radical. Each is standard practice in universities we like to cite as models. What is missing is not knowledge of the alternative but the willingness to accept a few years of messier grades while teachers and students adjust.</p>
<h3>The objection from scale</h3>
<p>The strongest objection is practical: with hundreds of students per course and examiners paid per script, essay-style assessment is impossible to mark well. This is a real constraint, but it is an argument for better-designed questions, not for abandoning judgement altogether. Short, structured arguments — two hundred words defending a claim — are quick to mark and impossible to memorise.</p>
<p>The students now filling our lecture halls will, within a decade, be running our ministries, courts and companies. If the habit we teach them is to find the expected answer and repeat it, we should not be surprised when our institutions do the same.</p>`,
  }),
  make({
    id: "a2", slug: "what-the-1973-constitution-still-asks",
    title: "What the 1973 Constitution Still Asks of Us",
    subtitle: "Half a century on, the document is less a settlement than an unfinished argument.",
    excerpt: "We talk about the constitution as something that is done to us — suspended, amended, restored. We rarely talk about what it asks of citizens.",
    type: "essay", category: "law", language: "en", authorId: "u2",
    featured: true, tags: ["constitution", "federalism", "rights"],
    stats: { views: 9310, likes: 702, comments: 54, bookmarks: 310 }, daysAgo: 5,
    body: `<p>Ask a law student what the 1973 Constitution is and you will hear about its history: the consensus after 1971, the suspensions, the Eighth and Eighteenth Amendments. Ask what it requires of an ordinary citizen and you are likely to get silence.</p>
<p>That silence is telling. We have learned to see the constitution as something that happens to us — a document that governments suspend and courts restore — rather than a set of commitments we hold one another to.</p>
<h2>A document of compromises</h2>
<p>The 1973 text was a compromise between provinces, between parties and between competing ideas of what Pakistan should be. Compromises are not weaknesses. They are a record of what people were willing to give up in order to live together. Reading the constitution this way makes it less a legal code and more a set of promises.</p>
<blockquote>A constitution is not self-executing. It survives only as long as enough people expect it to be obeyed.</blockquote>
<h2>Three promises worth re-reading</h2>
<ul><li><strong>Article 25A</strong> — free and compulsory education for children aged five to sixteen. Millions remain out of school.</li><li><strong>Article 19A</strong> — the right to information. Few citizens have ever filed a request.</li><li><strong>Article 140A</strong> — devolved local government. Local elections remain the exception rather than the rule.</li></ul>
<p>Each of these is enforceable in principle and neglected in practice. The constitution is not only betrayed in dramatic moments; it is also eroded by our indifference to its ordinary clauses.</p>`,
  }),
  make({
    id: "a3", slug: "climate-debt-and-the-indus",
    title: "Climate Debt and the Indus: Who Pays for the Floods?",
    subtitle: "Pakistan contributes under one percent of global emissions and absorbs a disproportionate share of the damage.",
    excerpt: "The language of ‘loss and damage’ is moving from negotiation rooms into our villages. The question is whether the money will follow.",
    type: "article", category: "climate", language: "en", authorId: "u3",
    editorsPick: true, tags: ["floods", "climate finance", "Indus"],
    stats: { views: 12700, likes: 980, comments: 71, bookmarks: 455 }, daysAgo: 7,
    body: `<p>When the water came in 2022, it did not read the negotiating texts. It covered a third of the country, displaced millions and erased harvests that families had borrowed against. The phrase “loss and damage” — once diplomatic shorthand — became a description of what people saw from their roofs.</p>
<h2>The arithmetic of responsibility</h2>
<p>Pakistan contributes less than one percent of global greenhouse emissions. It sits, nonetheless, among the countries most exposed to climate harm. That gap is the moral core of the climate-finance argument: those who caused the problem should help pay for its consequences.</p>
<p>But justice in the abstract does not rebuild an embankment. Pledges have been slow, conditional and frequently delivered as loans — which means a country recovering from climate disaster takes on debt to do so.</p>
<h2>What we control</h2>
<p>Waiting for international money is not a strategy. There is a domestic agenda too: zoning that keeps homes off floodplains, restoring wetlands that absorb water, and publishing district-level risk maps that communities can actually read.</p>
<blockquote>Adaptation is not a single project. It is ten thousand small decisions made before the rain.</blockquote>
<p>Our research challenge this term is mapping exactly that: which villages along the Indus have early-warning access, and which do not. The results will be public.</p>`,
  }),
  make({
    id: "a4", slug: "karachi-is-not-a-problem",
    title: "Karachi Is Not a Problem to Be Solved",
    excerpt: "Every few years someone announces a plan to ‘fix’ Karachi. The city keeps outliving the plans.",
    type: "opinion", category: "society", language: "en", authorId: "u8",
    tags: ["Karachi", "cities", "urban policy"],
    stats: { views: 7650, likes: 512, comments: 63, bookmarks: 190 }, daysAgo: 9,
    body: `<p>Every few years, someone announces a master plan for Karachi. The renderings are glossy, the targets ambitious, and the city — twenty million people improvising their lives every day — carries on largely untouched.</p>
<p>The mistake is in the framing. Karachi is not a problem to be solved; it is a system to be understood. Its informal transport, water tankers and street markets are not failures of planning so much as plans made by people the official process ignored.</p>
<h2>Start from what works</h2>
<p>Before the next grand scheme, we should study the arrangements that already move people and water around the city — and ask how to make them safer, fairer and cheaper rather than how to replace them.</p>
<p>Municipal power without municipal money is theatre. If Karachi’s local government cannot raise and spend its own revenue, no plan will survive its first budget cycle.</p>`,
  }),
  make({
    id: "a5", slug: "economics-of-brain-drain",
    title: "Leaving Isn’t Betrayal, but Staying Needs a Reason",
    subtitle: "On the economics of Pakistan’s brain drain.",
    excerpt: "Nearly a million Pakistanis left for work abroad last year. Moralising about patriotism won’t change the numbers; changing incentives might.",
    type: "essay", category: "economy", language: "en", authorId: "u1",
    tags: ["migration", "labour", "remittances"],
    stats: { views: 15230, likes: 1102, comments: 120, bookmarks: 520 }, daysAgo: 12,
    body: `<p>Every graduating class has the same conversation. Who is applying abroad? Who already has an offer? The ones staying are asked, half-joking, what went wrong.</p>
<p>It is tempting to treat emigration as a moral failure — as if the young doctor leaving for Manchester has betrayed the hospital in Multan. But migration is a response to incentives, and incentives can be changed.</p>
<h2>Remittances are not a strategy</h2>
<p>Remittances keep the external account afloat and families fed. They are also a sign that the economy exports its most productive people rather than employing them. A country cannot remit its way to development.</p>
<h2>What would make staying rational</h2>
<ul><li>Research funding that is predictable, competitive and not tied to seniority.</li><li>Professional pay scales that reward skill rather than years served.</li><li>A credible path for the diaspora to return — or to contribute without returning.</li></ul>
<p>Patriotism is a fine reason to stay. It should not have to be the only one.</p>`,
  }),
  make({
    id: "a6", slug: "iqbal-nisab-se-aage",
    title: "اقبال: نصاب سے آگے",
    subtitle: "ہم نے اقبال کو یاد تو کیا، پڑھا نہیں۔",
    excerpt: "اسکول کی کتابوں میں اقبال قومی شاعر ہیں، مگر ان کا فلسفۂ خودی، سوال کرنے کی جرأت اور جمود کے خلاف بغاوت نصاب سے غائب ہے۔",
    type: "essay", category: "philosophy", language: "ur", authorId: "u5",
    featured: true, editorsPick: true, tags: ["اقبال", "فلسفہ", "نصاب"],
    stats: { views: 11040, likes: 1310, comments: 92, bookmarks: 610 }, daysAgo: 4,
    body: `<p>ہر سال نو نومبر کو ہم اقبال کو یاد کرتے ہیں۔ تقاریر ہوتی ہیں، ترانے گائے جاتے ہیں، اور بچے ”لب پہ آتی ہے دعا“ پڑھتے ہیں۔ مگر سوال یہ ہے کہ کیا ہم نے کبھی اقبال کو پڑھا بھی ہے، یا صرف یاد کیا ہے؟</p>
<p>اسکول کی کتابوں میں اقبال ایک قومی علامت ہیں — ایک ایسا مجسمہ جس کے آگے احترام سے سر جھکایا جاتا ہے۔ مگر وہ اقبال جو سوال اٹھاتا تھا، جو جمود کو موت کہتا تھا، جو تقلید کے بجائے اجتہاد کی دعوت دیتا تھا، وہ نصاب سے تقریباً غائب ہے۔</p>
<h2>خودی کا اصل مطلب</h2>
<p>خودی کو اکثر غرور یا انانیت سمجھ لیا جاتا ہے۔ حالانکہ اقبال کے ہاں خودی اپنی صلاحیتوں کی پہچان، ذمہ داری کا احساس اور مسلسل جدوجہد کا نام ہے۔ یہ وہ فرد ہے جو حالات کا شکار نہیں بنتا بلکہ انہیں بدلنے کی کوشش کرتا ہے۔</p>
<blockquote>اقبال کو سمجھنے کا مطلب ان سے اختلاف کرنے کی ہمت بھی ہے۔</blockquote>
<h2>نصاب میں کیا بدلا جائے</h2>
<ul><li>اشعار رٹوانے کے بجائے ان پر بحث کروائی جائے۔</li><li>”تشکیلِ جدید الٰہیاتِ اسلامیہ“ کے منتخب حصے جامعات کے نصاب میں شامل ہوں۔</li><li>طلبہ کو اقبال سے اختلاف کرنے اور اپنی رائے مدلل انداز میں لکھنے کی ترغیب دی جائے۔</li></ul>
<p>اقبال کو خراجِ تحسین پیش کرنے کا بہترین طریقہ یہ ہے کہ ہم ان کی طرح سوچنا سیکھیں — آزادانہ، جرأت مندانہ اور دیانت داری سے۔</p>`,
  }),
  make({
    id: "a7", slug: "urdu-sahafat-ka-mustaqbil",
    title: "اردو صحافت کا مستقبل",
    excerpt: "اخبار کم بک رہے ہیں، یوٹیوب چینل بڑھ رہے ہیں۔ کیا اردو صحافت کا معیار بھی اسی رفتار سے بدل رہا ہے؟",
    type: "article", category: "culture", language: "ur", authorId: "u5",
    tags: ["صحافت", "اردو", "میڈیا"],
    stats: { views: 6420, likes: 540, comments: 38, bookmarks: 170 }, daysAgo: 15,
    body: `<p>ایک زمانہ تھا جب صبح کی چائے اخبار کے بغیر ادھوری سمجھی جاتی تھی۔ آج وہی خبریں موبائل کی اسکرین پر سرخیوں کی صورت میں ملتی ہیں — تیز، مختصر اور اکثر نامکمل۔</p>
<p>اردو صحافت کے سامنے دوہرا چیلنج ہے: ایک طرف قارئین کا ڈیجیٹل پلیٹ فارمز کی طرف منتقل ہونا، اور دوسری طرف معیار اور تحقیق کی جگہ سنسنی خیزی کا بڑھتا ہوا رجحان۔</p>
<h2>امکانات</h2>
<p>مگر یہ صرف زوال کی کہانی نہیں۔ ڈیجیٹل میڈیا نے چھوٹے شہروں کے صحافیوں کو آواز دی ہے، اور مقامی زبانوں میں تحقیقی رپورٹنگ کے نئے دروازے کھولے ہیں۔ ضرورت اس امر کی ہے کہ نوجوان صحافی تصدیق، توازن اور زبان کی شائستگی کو اپنا شعار بنائیں۔</p>`,
  }),
  make({
    id: "a8", slug: "dehi-khawateen-aur-digital-maeeshat",
    title: "دیہی خواتین اور ڈیجیٹل معیشت",
    excerpt: "موبائل فون نے سندھ کے دیہات میں کڑھائی کرنے والی خواتین کو براہِ راست خریداروں سے جوڑ دیا ہے۔ مگر کیا یہ آزادی ہے یا ایک نیا انحصار؟",
    type: "article", category: "economy", language: "ur", authorId: "u9",
    tags: ["خواتین", "ڈیجیٹل معیشت", "سندھ"],
    stats: { views: 4310, likes: 390, comments: 27, bookmarks: 120 }, daysAgo: 18,
    body: `<p>تھرپارکر کے ایک گاؤں میں رضیہ بی بی اپنے موبائل فون پر کڑھائی شدہ چادروں کی تصاویر بھیجتی ہیں۔ پہلے یہی چادریں ایک بیوپاری اونے پونے داموں خرید لیتا تھا۔ اب کراچی اور لاہور کے خریدار براہِ راست رابطہ کرتے ہیں۔</p>
<p>یہ کہانی امید افزا ہے، مگر مکمل نہیں۔ انٹرنیٹ کی کمزور رسائی، ڈیجیٹل ادائیگی کے مسائل اور خاندانی پابندیاں اب بھی راستے کی رکاوٹ ہیں۔</p>
<h2>پالیسی کیا کر سکتی ہے</h2>
<ul><li>دیہی علاقوں میں سستا اور قابلِ اعتماد انٹرنیٹ۔</li><li>خواتین کے نام پر موبائل اکاؤنٹس کھولنے کا آسان طریقہ۔</li><li>ڈیجیٹل خواندگی کی مقامی زبانوں میں تربیت۔</li></ul>`,
  }),
  make({
    id: "a9", slug: "ai-will-expose-our-teachers",
    title: "AI Will Not Replace Our Teachers — But It Might Expose Them",
    excerpt: "If a chatbot can answer your exam, the problem isn’t the chatbot.",
    type: "opinion", category: "technology", language: "en", authorId: "u6",
    tags: ["AI", "education", "assessment"],
    stats: { views: 9980, likes: 810, comments: 104, bookmarks: 300 }, daysAgo: 3,
    body: `<p>The panic about students using AI to write assignments has arrived in Pakistani universities, a little later than elsewhere and with the same mix of bans and denial.</p>
<p>Here is an uncomfortable thought: if a chatbot can complete your assignment, the assignment was probably testing the wrong thing. Generative AI is very good at producing the average answer. Much of our assessment rewards exactly that.</p>
<h2>What good teaching looks like now</h2>
<p>The teachers who are not worried are the ones who already ask students to argue, apply ideas to local cases, and defend their work in conversation. AI makes their classes better, not obsolete.</p>
<p>For students outside the big cities, AI tools could be a great equaliser — a tutor available at midnight in Urdu or Pashto. Whether that happens depends on access, not on bans.</p>`,
  }),
  make({
    id: "a10", slug: "notes-from-a-thar-field-visit",
    title: "Notes from a Field Visit to Thar",
    excerpt: "Three days, four villages, and the gap between how we talk about drought and how people live with it.",
    type: "blog", category: "society", language: "en", authorId: "u9",
    tags: ["Thar", "fieldwork", "water"],
    stats: { views: 3120, likes: 280, comments: 19, bookmarks: 95 }, daysAgo: 21,
    body: `<p>We left Mithi before sunrise. By the time the road ran out, the sand had turned from grey to gold and our driver had told us three different stories about the year the rains failed.</p>
<p>In the first village, the women had walked four kilometres for water that morning. In the second, a new solar-powered RO plant stood idle for want of a replacement filter that cost less than our lunch.</p>
<p>What I took home was not a statistic but a question: why do we design interventions that work on launch day and fail on day ninety?</p>`,
  }),
  make({
    id: "a11", slug: "informal-labour-lahore-textiles",
    title: "Measuring Informal Labour in Lahore’s Textile Belt",
    subtitle: "A pilot survey of home-based workers in three neighbourhoods.",
    excerpt: "Official statistics undercount home-based garment workers. We surveyed 312 households to estimate how many — and what they earn.",
    type: "research", category: "economy", language: "en", authorId: "u7",
    tags: ["informal economy", "labour", "survey"],
    stats: { views: 2890, likes: 210, comments: 14, bookmarks: 160 }, daysAgo: 25,
    body: `<p>This piece summarises a pilot survey conducted with student volunteers in three neighbourhoods of Lahore. We set out to estimate how many households perform home-based piece-rate work for the textile industry, and at what rates.</p>
<h2>Method</h2>
<p>We used a two-stage cluster sample of 312 households, with interviews conducted by trained volunteers in Punjabi and Urdu. Respondents were asked about work in the previous thirty days.</p>
<h2>Findings</h2>
<ul><li>41% of sampled households reported home-based garment work in the past month.</li><li>Median piece-rate earnings were well below the provincial minimum wage on an hourly basis.</li><li>Almost none were registered with any social-security scheme.</li></ul>
<p>The full dataset and questionnaire are available in the Research Hub.</p>`,
  }),
  make({
    id: "a12", slug: "bring-back-student-unions",
    title: "Why Student Unions Should Return",
    excerpt: "Banned in 1984, still absent four decades later. The argument for restoring them is stronger than the fear of their excesses.",
    type: "opinion", category: "politics", language: "en", authorId: "u2",
    tags: ["student unions", "campus", "democracy"],
    stats: { views: 8870, likes: 760, comments: 140, bookmarks: 210 }, daysAgo: 6,
    body: `<p>In 1984, student unions were banned across Pakistan. The stated reason was campus violence. The effect was to remove the one institution where young people learned to campaign, negotiate and lose elections gracefully.</p>
<p>Critics are right that unions in the 1970s and 80s were often violent and captured by parties. But the answer to bad institutions is better rules, not none at all: independent electoral oversight, spending caps and a clear separation from national party structures.</p>
<p>A generation that never practises democracy on campus should not be expected to defend it later.</p>`,
  }),
  make({
    id: "a13", slug: "the-partition-archive-we-never-built",
    title: "The Partition Archive We Never Built",
    excerpt: "The generation that remembers 1947 is almost gone. Their stories are disappearing in WhatsApp voice notes and unlabelled shoeboxes.",
    type: "blog", category: "history", language: "en", authorId: "u4",
    tags: ["Partition", "oral history", "archives"],
    stats: { views: 6900, likes: 690, comments: 48, bookmarks: 330 }, daysAgo: 10,
    body: `<p>My grandmother crossed at Wagah in October 1947. She told the story often, but always differently, and I never recorded it. She died in 2019.</p>
<p>Almost every Pakistani family has a version of this regret. The generation that remembers Partition is nearly gone, and with them goes a history that was never written down because it was never asked for.</p>
<h2>A modest proposal</h2>
<p>Students could do what institutions have not: record, transcribe and archive. A phone, a consent form and an afternoon are enough to start. THE FORUM’s history circle is piloting exactly this — volunteers welcome.</p>`,
  }),
  make({
    id: "a14", slug: "pricing-water-in-pakistan",
    title: "Pricing Water in Pakistan: A Policy Proposal",
    excerpt: "Water that is free to waste is expensive to everyone. A tiered tariff could protect the poor and fund maintenance.",
    type: "research", category: "climate", language: "en", authorId: "u8",
    tags: ["water", "policy", "tariffs"],
    stats: { views: 4020, likes: 330, comments: 22, bookmarks: 180 }, daysAgo: 30,
    body: `<p>Pakistan’s agricultural water charges, known as abiana, recover only a fraction of the cost of maintaining canals. Urban tariffs are similarly low and poorly collected. The result is underfunded infrastructure and little incentive to conserve.</p>
<h2>Proposal</h2>
<p>We propose a tiered tariff: a free lifeline allowance per household, a moderate charge above it, and a steep charge for heavy commercial users. Revenue would be ring-fenced for local maintenance.</p>`,
  }),
  make({
    id: "a15", slug: "why-philosophy-belongs-in-every-degree",
    title: "Why Philosophy Belongs in Every Degree",
    excerpt: "Engineers, doctors and accountants all make ethical decisions. Few are ever taught how.",
    type: "essay", category: "philosophy", language: "en", authorId: "u10",
    tags: ["philosophy", "ethics", "curriculum"],
    stats: { views: 5410, likes: 470, comments: 41, bookmarks: 205 }, daysAgo: 14,
    body: `<p>A civil engineer decides how much margin of safety a bridge deserves. A doctor decides who gets the last ICU bed. An accountant decides whether a number is “material”. These are ethical decisions dressed in technical language.</p>
<p>A single compulsory course in ethics and reasoning — taught well, with cases from Pakistani practice — would do more for our professions than another semester of rote technical content.</p>`,
  }),
  // ── Not published: used by the admin review queue and the author's drafts ──
  make({
    id: "a16", slug: "the-case-for-a-four-day-school-week",
    title: "The Case for a Four-Day School Week",
    excerpt: "Energy costs and teacher burnout suggest it is time to experiment.",
    type: "opinion", category: "education", language: "en", authorId: "u13", status: "pending",
    stats: { views: 0, likes: 0, comments: 0, bookmarks: 0 }, daysAgo: 1,
    body: `<p>Several provinces already close schools on Saturdays to save electricity. A structured four-day week, with a longer school day, deserves a proper trial.</p>`,
  }),
  make({
    id: "a17", slug: "cricket-and-national-identity",
    title: "Cricket and National Identity",
    excerpt: "What a sport tells us about who we think we are.",
    type: "essay", category: "culture", language: "en", authorId: "u6", status: "pending",
    stats: { views: 0, likes: 0, comments: 0, bookmarks: 0 }, daysAgo: 1,
    body: `<p>Few things unite Pakistan like a cricket match. Few things reveal our anxieties so clearly either.</p>`,
  }),
  make({
    id: "a18", slug: "rethinking-the-css-exam",
    title: "Rethinking the CSS Exam",
    excerpt: "Draft — notes on civil service recruitment.",
    type: "essay", category: "politics", language: "en", authorId: "u1", status: "draft",
    stats: { views: 0, likes: 0, comments: 0, bookmarks: 0 }, daysAgo: 0,
    body: `<p>Draft notes…</p>`,
  }),
];
