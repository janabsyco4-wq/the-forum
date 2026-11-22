import type { Ambassador, Initiative, Report, ResearchItem } from "@/types/domain";
import { ago, ahead } from "./_time";

export const initiatives: Initiative[] = [
  {
    id: "i1", slug: "read-pakistan-100-libraries", kind: "initiative",
    title: "Read Pakistan: 100 Community Libraries",
    summary: "Members collect, catalogue and place donated books in community libraries in government schools across twelve districts.",
    body: "<p>Since launching last year, volunteers have opened 38 small libraries in government schools. Each library starts with 300 books in Urdu, English and a regional language, and is run by a student committee.</p>",
    status: "ongoing", city: "Nationwide", partner: "Local school councils", organizerId: "u7",
    startsAt: ago(200), goal: "100 libraries by next June", participants: 412, tags: ["literacy", "schools"],
  },
  {
    id: "i2", slug: "flood-resilience-mapping", kind: "research-challenge",
    title: "Indus Flood-Resilience Mapping Challenge",
    summary: "Teams map early-warning coverage and evacuation routes for villages along the Indus, producing open data for district authorities.",
    body: "<p>Teams of three to five students combine satellite data, district reports and phone surveys to map early-warning coverage. All outputs are published under an open licence.</p>",
    status: "open", city: "Sindh & South Punjab", partner: "University GIS labs", organizerId: "u3",
    startsAt: ago(10), endsAt: ahead(45), goal: "Map 500 villages", prize: "PKR 300,000 in research grants", participants: 86, tags: ["climate", "GIS", "open data"],
  },
  {
    id: "i3", slug: "civic-fridays", kind: "initiative",
    title: "Civic Fridays",
    summary: "Weekly campus sessions where students learn to file right-to-information requests, read budgets and attend local council meetings.",
    body: "<p>A practical companion to this week’s debate. Each session takes one civic skill and practises it together.</p>",
    status: "open", city: "Lahore, Karachi, Islamabad", organizerId: "u2",
    startsAt: ago(30), participants: 230, tags: ["civics", "RTI"],
  },
  {
    id: "i4", slug: "policy-brief-challenge-water", kind: "research-challenge",
    title: "Policy Brief Challenge: Urban Water",
    summary: "Write a 1,500-word policy brief on a water problem in your city. Finalists present to a panel of practitioners.",
    body: "<p>Briefs are judged on evidence, feasibility and clarity. Mentors are available for the first round.</p>",
    status: "upcoming", city: "Online", partner: "Policy mentors network", organizerId: "u8",
    startsAt: ahead(14), endsAt: ahead(60), prize: "Publication + mentorship", participants: 0, tags: ["water", "policy"],
  },
  {
    id: "i5", slug: "urdu-wikipedia-sprint", kind: "initiative",
    title: "Urdu Wikipedia Sprint",
    summary: "A month-long effort to write and improve 1,000 Urdu Wikipedia articles on science, history and Pakistani institutions.",
    body: "<p>Training sessions cover sourcing, neutrality and Urdu technical terminology.</p>",
    status: "completed", city: "Online", organizerId: "u5",
    startsAt: ago(90), endsAt: ago(60), goal: "1,000 articles", participants: 175, tags: ["Urdu", "open knowledge"],
  },
  {
    id: "i6", slug: "oral-history-partition", kind: "research-challenge",
    title: "Partition Oral History Project",
    summary: "Record, transcribe and archive testimonies from the last generation to remember 1947.",
    body: "<p>Volunteers receive a recording kit guide, consent forms and transcription support.</p>",
    status: "open", city: "Punjab & Sindh", organizerId: "u4",
    startsAt: ago(20), endsAt: ahead(90), goal: "200 testimonies", participants: 64, tags: ["history", "archives"],
  },
];

export const ambassadors: Ambassador[] = [
  { userId: "u6", university: "FAST-NUCES Peshawar", city: "Peshawar", since: ago(180), chapterSize: 64 },
  { userId: "u7", university: "Quaid-i-Azam University", city: "Islamabad", since: ago(200), chapterSize: 112 },
  { userId: "u9", university: "University of Sindh", city: "Jamshoro", since: ago(90), chapterSize: 41 },
  { userId: "u4", university: "GC University", city: "Lahore", since: ago(150), chapterSize: 88 },
  { userId: "u13", university: "Aga Khan University", city: "Karachi", since: ago(40), chapterSize: 23 },
  { userId: "u3", university: "NUST", city: "Islamabad", since: ago(160), chapterSize: 97 },
];

export const research: ResearchItem[] = [
  {
    id: "r1", slug: "groundwater-depletion-quetta-valley", type: "paper", field: "climate",
    title: "Groundwater Depletion in the Quetta Valley, 2000–2024",
    abstract: "Using well-level records and satellite gravimetry, we estimate the rate of aquifer decline in the Quetta Valley and assess implications for urban water supply. Results indicate sustained decline, with the steepest losses near peri-urban tube-well clusters.",
    authorIds: ["u3"], supervisor: "Dr. S. Kakar", institution: "NUST", publishedAt: ago(40),
    keywords: ["groundwater", "Balochistan", "remote sensing"], stats: { reads: 3120, citations: 7, downloads: 840 }, peerReviewed: true,
  },
  {
    id: "r2", slug: "home-based-workers-lahore", type: "dataset", field: "economy",
    title: "Home-Based Garment Workers in Lahore: Pilot Survey Dataset",
    abstract: "Household-level survey data (n=312) on home-based piece-rate work, earnings and social protection, with questionnaire and codebook.",
    authorIds: ["u7", "u1"], institution: "Quaid-i-Azam University / LUMS", publishedAt: ago(25),
    keywords: ["informal labour", "survey", "textiles"], stats: { reads: 1450, citations: 2, downloads: 610 }, peerReviewed: false,
  },
  {
    id: "r3", slug: "rti-requests-response-rates", type: "policy-brief", field: "law",
    title: "Do Right-to-Information Requests Work? Response Rates Across Four Provinces",
    abstract: "Student volunteers filed 160 identical information requests with public bodies. We report response rates, delays and the quality of responses, and recommend changes to provincial RTI commissions.",
    authorIds: ["u2", "u12"], institution: "University of Karachi", publishedAt: ago(55),
    keywords: ["RTI", "transparency", "governance"], stats: { reads: 2780, citations: 4, downloads: 920 }, peerReviewed: true,
  },
  {
    id: "r4", slug: "exam-culture-literature-review", type: "review", field: "education",
    title: "Examination Culture in South Asian Higher Education: A Literature Review",
    abstract: "We review 64 studies on assessment practice in Pakistan, India and Bangladesh, identifying recurring patterns of rote learning, grade inflation and reform attempts.",
    authorIds: ["u1"], supervisor: "Dr. F. Malik", institution: "LUMS", publishedAt: ago(70),
    keywords: ["assessment", "higher education", "South Asia"], stats: { reads: 1980, citations: 5, downloads: 540 }, peerReviewed: true,
  },
  {
    id: "r5", slug: "karachi-water-tankers", type: "paper", field: "economy",
    title: "The Political Economy of Karachi’s Water Tankers",
    abstract: "Drawing on interviews with operators and residents, this paper maps the informal water market in three Karachi neighbourhoods and estimates the price premium paid by households without piped supply.",
    authorIds: ["u8"], institution: "IBA Karachi", publishedAt: ago(35),
    keywords: ["water", "informal markets", "Karachi"], stats: { reads: 2210, citations: 3, downloads: 700 }, peerReviewed: false,
  },
  {
    id: "r6", slug: "urdu-medium-comprehension", type: "challenge-entry", field: "education",
    title: "اردو ذریعۂ تعلیم اور سائنسی تصورات کا فہم",
    abstract: "جماعت نہم کے ۲۰۰ طلبہ پر کیے گئے تجربے میں اردو اور انگریزی میں پڑھائے گئے ایک ہی سبق کے فہم کا موازنہ کیا گیا۔",
    authorIds: ["u5", "u10"], institution: "جامعہ پنجاب", publishedAt: ago(12),
    keywords: ["زبان", "تعلیم", "فہم"], stats: { reads: 980, citations: 0, downloads: 310 }, peerReviewed: false,
  },
];

export const reports: Report[] = [
  { id: "p1", targetType: "comment", targetId: "c99", targetPreview: "You clearly know nothing about economics, go back to school…", reason: "harassment", details: "Personal attack on the author.", reporterId: "u1", createdAt: ago(0, 4), status: "open" },
  { id: "p2", targetType: "article", targetId: "a17", targetPreview: "Cricket and National Identity", reason: "plagiarism", details: "Second paragraph appears to be copied from a 2019 newspaper column.", reporterId: "u10", createdAt: ago(0, 9), status: "reviewing" },
  { id: "p3", targetType: "discussion", targetId: "t99", targetPreview: "Earn PKR 50,000 a week from home!!! DM me", reason: "spam", reporterId: "u12", createdAt: ago(1), status: "open" },
  { id: "p4", targetType: "argument", targetId: "g99", targetPreview: "People from that province can’t be trusted with…", reason: "hate-speech", reporterId: "u7", createdAt: ago(1, 3), status: "open" },
  { id: "p5", targetType: "user", targetId: "u14", targetPreview: "@kamran-yousaf", reason: "spam", details: "Posting the same link in every thread.", reporterId: "u12", createdAt: ago(3), status: "resolved", resolvedBy: "u12", resolution: "Account suspended for 14 days." },
  { id: "p6", targetType: "comment", targetId: "c98", targetPreview: "The 2022 floods were caused by cloud seeding experiments", reason: "misinformation", reporterId: "u3", createdAt: ago(4), status: "dismissed", resolvedBy: "u11", resolution: "Reply added with sources; comment left visible." },
];
