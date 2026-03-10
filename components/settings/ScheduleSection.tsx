export function ScheduleSection({
  schedule,
  onChange,
  t,
}: {
  schedule: "daily" | "weekly";
  onChange: (val: "daily" | "weekly") => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">{t("scheduleTitle")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {(["daily", "weekly"] as const).map((s) => (
          <label key={s} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${schedule === s ? "border-text-primary bg-elevated" : "border-border-subtle hover:border-border-strong"}`}>
            <input type="radio" name="schedule" value={s} checked={schedule === s} onChange={() => onChange(s)} className="hidden" />
            <span className="text-2xl">{s === "daily" ? "📅" : "📆"}</span>
            <div>
              <div className={`font-semibold text-sm ${schedule === s ? "text-text-primary" : "text-text-secondary"}`}>{s === "daily" ? t("scheduleDaily") : t("scheduleWeekly")}</div>
              <div className="text-xs text-text-tertiary">{s === "daily" ? t("scheduleDailyDesc") : t("scheduleWeeklyDesc")}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}