import type { Category } from "@/types/domain";

export const categories: Category[] = [
  { slug: "politics", name: { en: "Politics", ur: "سیاست" }, description: { en: "Power, institutions and the state.", ur: "اقتدار، ادارے اور ریاست۔" } },
  { slug: "economy", name: { en: "Economy", ur: "معیشت" }, description: { en: "Markets, labour, development and money.", ur: "منڈیاں، محنت، ترقی اور زر۔" } },
  { slug: "education", name: { en: "Education", ur: "تعلیم" }, description: { en: "Schools, universities and how we learn.", ur: "اسکول، جامعات اور ہم کیسے سیکھتے ہیں۔" } },
  { slug: "history", name: { en: "History", ur: "تاریخ" }, description: { en: "The past, and the arguments we still have about it.", ur: "ماضی، اور اس پر ہماری جاری بحثیں۔" } },
  { slug: "society", name: { en: "Society", ur: "معاشرہ" }, description: { en: "Family, gender, cities and community.", ur: "خاندان، صنف، شہر اور برادری۔" } },
  { slug: "philosophy", name: { en: "Philosophy", ur: "فلسفہ" }, description: { en: "Ethics, knowledge and meaning.", ur: "اخلاقیات، علم اور معنی۔" } },
  { slug: "technology", name: { en: "Technology", ur: "ٹیکنالوجی" }, description: { en: "AI, the internet and the tools that shape us.", ur: "مصنوعی ذہانت، انٹرنیٹ اور ہمیں بدلنے والے اوزار۔" } },
  { slug: "climate", name: { en: "Climate", ur: "ماحولیات" }, description: { en: "Water, heat, floods and adaptation.", ur: "پانی، گرمی، سیلاب اور مطابقت۔" } },
  { slug: "culture", name: { en: "Literature & Culture", ur: "ادب و ثقافت" }, description: { en: "Language, art, poetry and media.", ur: "زبان، فن، شاعری اور ذرائع ابلاغ۔" } },
  { slug: "law", name: { en: "Law & Rights", ur: "قانون و حقوق" }, description: { en: "The constitution, courts and civil liberties.", ur: "آئین، عدالتیں اور شہری آزادیاں۔" } },
];
