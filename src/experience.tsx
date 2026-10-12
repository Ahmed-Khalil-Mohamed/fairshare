import { useState, type ReactNode } from "react";
import {
  Plus,
  Scales,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  FolderOpen,
  FileText,
  Wrench,
  ShieldCheck,
  Package,
  Receipt,
  Cards,
  MapPin,
  Clock,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import {
  type Project,
  type Entry,
  type Lang,
  type Action,
  cash,
} from "./contracts";
import { Status, fmtDate } from "./components";
type Slots = {
  p: Project;
  now: Date;
  create: () => void;
  notices: ReactNode;
  metrics: ReactNode;
  features: ReactNode;
  records: ReactNode;
  lang: Lang;
};
type Props = {
  p: Project;
  rows: Entry[];
  lang: Lang;
  now: Date;
  busy: boolean;
  open: (e: Entry) => void;
  action: (e: Entry, a: Action) => void;
};
const words = (lang: Lang) => (en: string, ar: string) =>
  lang === "ar" ? ar : en;
function Title({ e, p, open }: Pick<Props, "p" | "open"> & { e: Entry }) {
  return (
    <button className="record-title" dir="auto" onClick={() => open(e)}>
      {p.title(e.data)}
      <ArrowUpRight size={17} />
    </button>
  );
}
function Next({ e, p, lang, busy, action }: Props & { e: Entry }) {
  const a = p.actions.find((a) => a.when(e.data));
  return a ? (
    <button
      className="secondary compact"
      disabled={busy}
      onClick={() => action(e, a)}
    >
      {a.label[lang]}
      <ArrowRight size={14} />
    </button>
  ) : null;
}
function Scene({ label }: { label: string }) {
  return (
    <figure className="brand-scene">
      <img src="/brand-scene.png" alt="" />
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export function ProductComposition({
  p,
  now,
  create,
  notices,
  metrics,
  features,
  records,
  lang,
}: Slots) {
  const t = words(lang);
  return (
    <div className="experience">
      <div className="share-intro" id="overview">
        <span className="overline">
          {t("LIFE TOGETHER, MONEY SORTED", "عيشة مشتركة، حساب واضح")}
        </span>
        <h1>{t("All fair. All shared.", "متشاركين. ومتعادلين.")}</h1>
        <button className="primary" onClick={create}>
          <Plus />
          {p.createLabel[lang]}
        </button>
      </div>
      <div className="share-balance">{features}</div>
      <div className="share-journal">
        <div>{records}</div>
        <aside>
          {metrics}
          <div className="share-note">
            <Scales size={36} />
            <p>
              {t("Good company. Clear accounts.", "صحبة حلوة. وحساب واضح.")}
            </p>
          </div>
        </aside>
      </div>
      <div className="workspace-notes">{notices}</div>
    </div>
  );
}
export function ProductRecords(props: Props) {
  const { p, rows, lang, now, busy, open, action } = props;
  const t = words(lang);
  return (
    <div className="receipt-feed">
      {rows.map((e) => (
        <article className="record-card expense-receipt" key={e.id}>
          <div className="receipt-top">
            <span className="receipt-icon">
              <Receipt size={23} />
            </span>
            <span>{fmtDate(e.data.date || e.createdAt, lang)}</span>
            <Status project={p} entry={e} lang={lang} now={now} />
          </div>
          <Title {...props} e={e} />
          <div className="receipt-total">
            <span>
              {e.data.kind === "settlement"
                ? t("Settlement", "تسوية")
                : t("Total expense", "إجمالي المصروف")}
            </span>
            <strong>{cash(e.data.amount, lang)}</strong>
          </div>
          <div className="receipt-paid">
            <span>{t("Paid by", "دفع بواسطة")}</span>
            <strong>{e.data.paidBy || e.data.from}</strong>
          </div>
          <div className="receipt-people">
            {(e.data.people || [e.data.to])
              .filter(Boolean)
              .map((person: string) => (
                <span key={person}>
                  <i>{person.slice(0, 1)}</i>
                  {person}
                </span>
              ))}
          </div>
          <footer>
            <span>{p.subtitle(e.data, lang)}</span>
            <button className="text-button" onClick={() => open(e)}>
              {t("View receipt", "عرض الإيصال")}
              <ArrowUpRight size={16} />
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
}
