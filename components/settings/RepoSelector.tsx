import { Repo } from "@/lib/types";
import { Checkbox } from "@/components/ui/Checkbox";

export function RepoSelector({
  repos,
  selectedRepos,
  onToggle,
  t,
}: {
  repos: Repo[];
  selectedRepos: string[];
  onToggle: (fullName: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("repoTitle")}</h2>
        <p className="text-sm text-text-secondary">{t("repoDesc")}</p>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {repos.length === 0 ? (
          <p className="text-text-tertiary italic text-sm">No repositories found</p>
        ) : repos.map((repo) => {
          const isSelected = selectedRepos.includes(repo.full_name);
          return (
            <div key={repo.full_name} onClick={() => onToggle(repo.full_name)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-border-strong bg-elevated" : "border-border-subtle hover:border-border-strong"}`}>
              <div className="flex items-center gap-3">
                <Checkbox checked={isSelected} />
                <span className={`text-sm font-medium ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>{repo.name}</span>
              </div>
              <span className={`px-2 py-0.5 border border-border-subtle rounded-full text-xs text-text-tertiary ${isSelected ? "opacity-100" : "opacity-50"}`}>
                {repo.private ? "Private" : "Public"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}