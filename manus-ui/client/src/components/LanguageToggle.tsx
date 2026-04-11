import { useLanguage, type AmcLanguage } from "../contexts/LanguageContext";

const LANG_OPTIONS: Array<{ value: AmcLanguage; label: string }> = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Language</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as AmcLanguage)}
        className="bg-transparent text-xs font-medium outline-none"
        aria-label="Select language"
      >
        {LANG_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

