import type { Debate, DebateArgument } from "@/types/domain";
import { ago, ahead } from "./_time";

export const debates: Debate[] = [
  {
    id: "d1", slug: "civic-education-compulsory",
    title: "This House believes civic education should be a compulsory university subject",
    question: "Should every Pakistani undergraduate — engineer, doctor or artist — be required to study how the state, constitution and citizenship work?",
    context: `<p>Most Pakistani graduates leave university without ever having studied the constitution, local government or how a bill becomes law. Pakistan Studies is compulsory, but critics argue it teaches national narrative rather than civic skill.</p><p>Proponents say a short, practical civics course — rights, institutions, budgets, elections — would strengthen democracy and reduce misinformation. Opponents worry about overloaded curricula, ideological capture and whether a compulsory course can teach anything at all.</p><p>Consider: what should such a course contain, who should design it, and how would we know it worked?</p>`,
    category: "education", language: "en", weekNumber: 46,
    opensAt: ago(2), closesAt: ahead(4, 6), status: "open",
    sides: { for: "Make it compulsory", against: "Keep it optional" },
    readings: [
      { title: "Constitution of Pakistan, Articles 25A, 19A and 140A", url: "https://na.gov.pk" },
      { title: "HEC undergraduate education policy", url: "https://hec.gov.pk" },
      { title: "THE FORUM: What the 1973 Constitution Still Asks of Us", url: "/en/articles/what-the-1973-constitution-still-asks" },
    ],
    createdBy: "u11",
    stats: { arguments: 48, participants: 31, votesFor: 214, votesAgainst: 139 },
  },
  {
    id: "d2", slug: "replace-css-with-skills-based-entry",
    title: "This House would replace the CSS exam with skills-based civil service recruitment",
    question: "Does the competitive exam select Pakistan’s best administrators, or simply its best exam-takers?",
    context: `<p>The CSS exam has long been seen as the gateway to the elite civil service. Pass rates are very low, and critics argue the format rewards memorisation and English-language privilege over administrative ability.</p>`,
    category: "politics", language: "en", weekNumber: 47,
    opensAt: ahead(5), closesAt: ahead(12), status: "upcoming",
    sides: { for: "Replace the exam", against: "Reform, don’t replace" },
    readings: [],
    createdBy: "u11",
    stats: { arguments: 0, participants: 0, votesFor: 0, votesAgainst: 0 },
  },
  {
    id: "d3", slug: "urdu-zariya-taleem",
    title: "یہ ایوان سمجھتا ہے کہ اعلیٰ تعلیم کا ذریعہ اردو ہونا چاہیے",
    question: "کیا جامعات میں تدریس اردو میں ہونے سے علم عام ہوگا، یا عالمی تحقیق سے فاصلہ بڑھے گا؟",
    context: `<p>پاکستان کی بیشتر جامعات میں تدریس انگریزی میں ہوتی ہے، جبکہ اکثر طلبہ کی پہلی یا دوسری زبان اردو یا کوئی علاقائی زبان ہے۔ حامیوں کے مطابق مادری یا قومی زبان میں تعلیم فہم کو گہرا کرتی ہے۔ مخالفین کا کہنا ہے کہ اس سے عالمی تحقیق اور روزگار کے مواقع تک رسائی متاثر ہوگی۔</p>`,
    category: "education", language: "ur", weekNumber: 45,
    opensAt: ago(9), closesAt: ago(2), status: "concluded",
    sides: { for: "اردو ذریعۂ تعلیم", against: "انگریزی برقرار رہے" },
    readings: [],
    createdBy: "u11",
    conclusion: {
      summary: "ایوان نے دو لسانی ماڈل کی حمایت کی: بنیادی تصورات اردو میں، تحقیق اور اصطلاحات انگریزی میں۔",
      body: `<p>اس ہفتے کے مباحثے میں ۶۳ دلائل پیش کیے گئے۔ دونوں جانب سے مضبوط نکات سامنے آئے۔ حق میں دلائل نے ثابت کیا کہ زبان کی رکاوٹ ذہین طلبہ کو پیچھے دھکیل دیتی ہے۔ مخالفت میں دلائل نے بجا طور پر نشاندہی کی کہ اردو میں جدید تحقیقی مواد کی کمی ایک حقیقی مسئلہ ہے۔</p><p>سب سے مقبول حل یہ تھا کہ ابتدائی دو سال دو لسانی تدریس ہو، اور جامعات ترجمے کے مراکز قائم کریں۔ ایوان اسی متوازن موقف کو قبول کرتا ہے۔</p>`,
      authorId: "u11", publishedAt: ago(1), verdict: "for",
    },
    stats: { arguments: 63, participants: 44, votesFor: 301, votesAgainst: 188 },
  },
  {
    id: "d4", slug: "remote-work-best-opportunity",
    title: "This House believes remote work is Pakistan’s best economic opportunity of the decade",
    question: "Can freelancing and remote employment do what manufacturing did for East Asia?",
    context: `<p>Pakistan ranks among the largest sources of online freelancers globally. Advocates see remote work as a path to foreign exchange and a way to keep talent in the country. Sceptics point to unreliable internet, payment barriers and the risk of a low-wage digital ceiling.</p>`,
    category: "economy", language: "en", weekNumber: 44,
    opensAt: ago(16), closesAt: ago(9), status: "concluded",
    sides: { for: "Remote work first", against: "Build industry first" },
    readings: [],
    createdBy: "u11",
    conclusion: {
      summary: "The house was narrowly persuaded against: remote work is a valuable bridge, but not a substitute for productive domestic industry.",
      body: `<p>The strongest case for the motion was speed: remote work requires little capital and pays in dollars today. The strongest case against was depth — few freelancers progress to higher-value work, and the sector creates little employment for those without English and a laptop.</p><p>The most persuasive solutions came from both sides: reliable internet as basic infrastructure, a simple regime for receiving foreign payments, and treating freelancing hubs as on-ramps to firms that can export services at scale.</p>`,
      authorId: "u11", publishedAt: ago(8), verdict: "against",
    },
    stats: { arguments: 71, participants: 52, votesFor: 240, votesAgainst: 262 },
  },
  {
    id: "d5", slug: "ban-party-wings-on-campus",
    title: "This House would ban political party student wings on campus",
    question: "Do party-affiliated student groups politicise campuses, or teach democratic participation?",
    context: `<p>Party-affiliated student organisations are active on many campuses despite the union ban. Their critics cite violence and patronage; their defenders say they are the only political training available to students.</p>`,
    category: "politics", language: "en", weekNumber: 43,
    opensAt: ago(23), closesAt: ago(16), status: "closed",
    sides: { for: "Ban party wings", against: "Allow them" },
    readings: [],
    createdBy: "u11",
    stats: { arguments: 55, participants: 40, votesFor: 190, votesAgainst: 176 },
  },
];

export const debateArguments: DebateArgument[] = [
  // Week 46 — civic education
  {
    id: "g1", debateId: "d1", authorId: "u2", kind: "argument", side: "for",
    title: "Citizens cannot defend what they do not understand",
    body: "Most graduates I know cannot name the three tiers of government or explain what a provincial assembly does with its budget. That ignorance is not neutral: it makes misinformation easy and accountability impossible. A one-semester course on rights, institutions and public money is a small price for a citizenry that can actually hold power to account.",
    createdAt: ago(1, 20), votes: 86, status: "visible", highlighted: true,
  },
  {
    id: "g2", debateId: "d1", authorId: "u10", kind: "argument", side: "against",
    title: "Compulsion breeds box-ticking",
    body: "We already have a compulsory course on the nation — Pakistan Studies — and it is widely experienced as memorisation of an official story. Making civics compulsory risks producing the same thing: another exam to pass, another set of notes to repeat. Civic virtue is learned through participation, not lectures.",
    createdAt: ago(1, 18), votes: 64, status: "visible", highlighted: true,
  },
  {
    id: "g3", debateId: "d1", authorId: "u1", kind: "counterargument", side: "for", parentId: "g2",
    body: "The failure of Pakistan Studies is an argument about design, not compulsion. If the course is assessed through a project — filing a right-to-information request, analysing a district budget, observing a court session — it cannot be memorised. Compulsion simply guarantees that the engineering student gets the same chance as the political science student.",
    createdAt: ago(1, 10), votes: 51, status: "visible",
  },
  {
    id: "g4", debateId: "d1", authorId: "u7", kind: "reply", side: "against", parentId: "g3",
    body: "Project-based assessment is lovely in theory. In a public university with 120 students per section and one overworked lecturer, who supervises 120 RTI requests? We should be honest about capacity before adding mandates.",
    createdAt: ago(1, 6), votes: 29, status: "visible",
  },
  {
    id: "g5", debateId: "d1", authorId: "u6", kind: "argument", side: "for",
    title: "The digital public square needs literate citizens",
    body: "Students today get their politics from short videos. A civics course that teaches how to check a claim, read a bill or find a budget document is the cheapest anti-misinformation programme we could run.",
    createdAt: ago(1, 2), votes: 38, status: "visible",
  },
  {
    id: "g6", debateId: "d1", authorId: "u12", kind: "argument", side: "against",
    title: "Who writes the syllabus?",
    body: "Any compulsory course becomes a prize for whoever controls the curriculum. Civics is especially vulnerable: definitions of ‘good citizenship’ change with governments. I would rather protect universities’ freedom to design their own offerings.",
    createdAt: ago(0, 20), votes: 33, status: "visible",
  },
  {
    id: "g7", debateId: "d1", authorId: "u3", kind: "counterargument", side: "for", parentId: "g6",
    body: "That risk is real, which is why the syllabus should be set by universities themselves under a broad HEC framework — learning outcomes, not content. Requiring a subject is not the same as dictating its content; we require mathematics without telling every department which textbook to use.",
    createdAt: ago(0, 14), votes: 27, status: "visible",
  },
  {
    id: "g8", debateId: "d1", authorId: "u8", kind: "solution", side: "neutral",
    title: "A two-credit ‘civic lab’ with local partners",
    body: "Make it a two-credit, pass/fail lab rather than a graded lecture. Students complete three practical tasks — attend a local council or court session, analyse one public budget line, and file one information request — with reflections reviewed by peers. Partner with bar associations and local governments to host visits. Evaluate it after two years before scaling.",
    createdAt: ago(0, 9), votes: 72, status: "visible", highlighted: true,
  },
  {
    id: "g9", debateId: "d1", authorId: "u9", kind: "solution", side: "neutral",
    title: "Teach it in the language students think in",
    body: "Whatever we decide, offer the course in Urdu and regional languages as well as English. Civic knowledge locked behind English recreates the very exclusion it is meant to fix.",
    createdAt: ago(0, 5), votes: 41, status: "visible",
  },
  {
    id: "g10", debateId: "d1", authorId: "u13", kind: "argument", side: "against",
    title: "Professional degrees are already overloaded",
    body: "MBBS students have almost no elective space. Adding another compulsory subject means removing something clinical. Civic education matters, but it should be integrated into existing courses rather than bolted on.",
    createdAt: ago(0, 3), votes: 22, status: "visible",
  },
  // Week 45 (Urdu)
  {
    id: "g11", debateId: "d3", authorId: "u5", kind: "argument", side: "for",
    title: "فہم زبان سے جڑا ہے",
    body: "جو طالب علم انگریزی کے جملے سمجھنے میں الجھا رہتا ہے وہ تصور تک کیسے پہنچے گا؟ اپنی زبان میں تعلیم رٹے کا خاتمہ کر سکتی ہے۔",
    createdAt: ago(6), votes: 92, status: "visible", highlighted: true,
  },
  {
    id: "g12", debateId: "d3", authorId: "u2", kind: "argument", side: "against",
    title: "تحقیق کی زبان انگریزی ہے",
    body: "دنیا کی بیشتر جدید تحقیق انگریزی میں شائع ہوتی ہے۔ اگر ہمارے طلبہ اس زبان سے دور ہوئے تو عالمی علمی برادری سے کٹ جائیں گے۔",
    createdAt: ago(5), votes: 70, status: "visible",
  },
  {
    id: "g13", debateId: "d3", authorId: "u10", kind: "solution", side: "neutral",
    title: "دو لسانی ماڈل",
    body: "ابتدائی سالوں میں دو لسانی تدریس، اور جامعات میں ترجمے کے مراکز جو بنیادی نصابی کتب اردو میں دستیاب کریں۔",
    createdAt: ago(4), votes: 110, status: "visible", highlighted: true,
  },
];
