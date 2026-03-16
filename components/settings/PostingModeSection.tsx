export function PostingModeSection({
  mode,
  onToggle,
  t,
}: {
  mode: "auto" | "manual";
  onToggle: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("modeTitle")}</h2>
        <p className="text-sm text-text-secondary whitespace-pre-line">
          {t("modeDesc")}
        </p>
      </div>
      <button onClick={onToggle} className={`w-full flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${mode === "auto" ? "border-accent bg-accent/5" : "border-border-subtle hover:border-border-strong"}`}>
        <div className={`w-12 h-6 rounded-full relative transition-all ${mode === "auto" ? "bg-accent" : "bg-elevated"}`}>
          <div className={`w-5 h-5 rounded-full absolute top-0.5 transition-all ${mode === "auto" ? "left-6.5 bg-black" : "left-0.5 bg-text-secondary"}`} />
        </div>
        <div className="text-left">
          <div className={`font-semibold text-sm ${mode === "auto" ? "text-accent" : ""}`}>
            {mode === "auto" ? t("modeAuto") : t("modeManual")}
          </div>
          <div className="text-xs text-text-secondary whitespace-pre-line">
            {mode === "auto" ? t("modeAutoDesc") : t("modeManualDesc")}
          </div>
        </div>
      </button>
      {mode === "auto" && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 text-sm space-y-1">
          <p className="font-semibold text-yellow-500">{t("autoNoticeTitle")}</p>
          <p className="text-text-secondary leading-relaxed whitespace-pre-line">
            {t("autoNoticeDesc")}
          </p>
        </div>
      )}
    </div>
  );
}