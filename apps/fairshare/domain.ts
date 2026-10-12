import { z } from "zod";
import {
  c,
  text,
  note,
  money,
  date,
  option,
  metric,
  cash,
  isoDay,
  fail,
  type Entry,
  type Project,
} from "../../src/contracts";
import { splitCents, balances, settlements } from "../../src/settlements";
export { splitCents, balances, settlements };
export const fairshare: Project = {
  id: "fairshare",
  name: "FairShare",
  arabic: "بالحساب",
  kind: "desktop",
  color: "#6e5990",
  mark: "09",
  tagline: c("Shared living. Settled fairly.", "معيشة مشتركة، وحساب عادل."),
  problem: c(
    "Split household expenses exactly to the cent and see who should pay whom, all without accounts or internet on Windows.",
    "تقسيم مصاريف السكن بدقة للقرش ومعرفة مين يدفع لمين، دون حسابات أو إنترنت على Windows.",
  ),
  entity: c("entries", "عمليات"),
  createLabel: c("Add an expense", "إضافة مصروف"),
  fields: [
    { key: "title", label: c("Description", "الوصف"), required: true },
    {
      key: "amount",
      label: c("Amount · EGP", "المبلغ · جنيه"),
      type: "money",
      required: true,
    },
    { key: "paidBy", label: c("Paid by", "دفع بواسطة"), required: true },
    {
      key: "participants",
      label: c("Split between, comma separated", "المشاركون، مفصولون بفاصلة"),
      required: true,
      hint: c(
        "Use the same name spelling on every expense.",
        "استخدم نفس كتابة الاسم في كل مصروف.",
      ),
    },
    {
      key: "date",
      label: c("Expense date", "تاريخ المصروف"),
      type: "date",
      required: true,
    },
    {
      key: "category",
      label: c("Category", "التصنيف"),
      type: "select",
      options: [
        option("groceries", "Groceries", "مشتريات"),
        option("rent", "Rent", "إيجار"),
        option("utilities", "Utilities", "مرافق"),
        option("other", "Other", "أخرى"),
      ],
    },
    { key: "notes", label: c("Notes", "ملاحظات"), type: "textarea" },
  ],
  schema: z
    .object({
      title: text,
      amount: money,
      paidBy: text,
      participants: text,
      date: date,
      category: z.enum(["groceries", "rent", "utilities", "other"]),
      notes: note,
    })
    .strict(),
  create: (d) => {
    const people = d.participants
      .split(/[,،]/)
      .map((x: string) => x.trim().normalize("NFC"))
      .filter(Boolean);
    if (
      people.length < 1 ||
      people.length > 30 ||
      new Set(people.map((x: string) => x.toLowerCase())).size !== people.length
    )
      fail("invalid_split");
    return { ...d, paidBy: d.paidBy.normalize("NFC"), kind: "expense", people };
  },
  act: () => fail("invalid_transition"),
  actions: [],
  title: (d) => d.title,
  subtitle: (d) =>
    d.kind === "settlement"
      ? `${d.paidBy} → ${d.people[0]}`
      : `${d.paidBy} · ${d.people.join(", ")}`,
  status: (d) => d.kind,
  statuses: {
    expense: c("Expense", "مصروف"),
    settlement: c("Settlement", "تسوية"),
  },
  metrics: (r, _n, lang = "en") => [
    metric(
      "Shared expenses",
      "مصاريف مشتركة",
      cash(
        r
          .filter((x) => x.data.kind === "expense")
          .reduce((s, x) => s + x.data.amount, 0),
        lang,
      ),
      "EGP · equal splits",
      "جنيه · تقسيم متساوٍ",
    ),
    metric(
      "Housemates",
      "شركاء السكن",
      Object.keys(balances(r)).length,
      "From recorded transactions",
      "من العمليات المسجلة",
    ),
    metric(
      "Suggested transfers",
      "تحويلات مقترحة",
      settlements(r).length,
      "Simplified from net balances",
      "محسوبة من صافي الأرصدة",
    ),
  ],
  seed: (n) => [
    {
      title: "Weekly groceries",
      amount: 125050,
      paidBy: "Nour",
      participants: "Nour,Omar,Salma",
      people: ["Nour", "Omar", "Salma"],
      date: isoDay(n),
      category: "groceries",
      notes: "",
      kind: "expense",
    },
    {
      title: "Internet bill",
      amount: 60000,
      paidBy: "Omar",
      participants: "Nour,Omar,Salma",
      people: ["Nour", "Omar", "Salma"],
      date: isoDay(n),
      category: "utilities",
      notes: "",
      kind: "expense",
    },
  ],
};
