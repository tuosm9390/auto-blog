"use client";

import type { Repo } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

interface GitHubRepoPickerProps {
  ownerLabel: string;
  repoLabel: string;
  selectLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  errorLabel: string;
  manualLabel: string;
  selectedLabel: string;
  initialOwner?: string | null;
  initialRepo?: string | null;
}

export function GitHubRepoPicker({
  ownerLabel,
  repoLabel,
  selectLabel,
  loadingLabel,
  emptyLabel,
  errorLabel,
  manualLabel,
  selectedLabel,
  initialOwner,
  initialRepo,
}: GitHubRepoPickerProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [selectedFullName, setSelectedFullName] = useState(
    initialOwner && initialRepo ? `${initialOwner}/${initialRepo}` : ""
  );
  const [owner, setOwner] = useState(initialOwner ?? "");
  const [repoName, setRepoName] = useState(initialRepo ?? "");

  useEffect(() => {
    let isMounted = true;

    async function loadRepos() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/github/repos");
        const data = (await response.json()) as { repos?: Repo[]; error?: string };
        if (!response.ok) {
          throw new Error(data.error || errorLabel);
        }
        if (!isMounted) {
          return;
        }
        setRepos(data.repos ?? []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : errorLabel);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRepos();

    return () => {
      isMounted = false;
    };
  }, [errorLabel]);

  const selectedRepo = useMemo(
    () => repos.find((repo) => repo.full_name === selectedFullName) ?? null,
    [repos, selectedFullName]
  );

  const handleSelect = (fullName: string) => {
    setSelectedFullName(fullName);
    const repo = repos.find((item) => item.full_name === fullName);
    if (!repo) {
      setOwner("");
      setRepoName("");
      return;
    }

    const [repoOwner, name] = repo.full_name.split("/");
    setOwner(repoOwner ?? "");
    setRepoName(name ?? repo.name);
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="githubRepoOwner" value={owner} />
      <input type="hidden" name="githubRepoName" value={repoName} />

      {!manualMode ? (
        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-primary">{selectLabel}</span>
            <select
              value={selectedFullName}
              disabled={loading}
              onChange={(event) => handleSelect(event.target.value)}
              className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-strong disabled:opacity-60"
            >
              <option value="">
                {loading ? loadingLabel : repos.length === 0 ? emptyLabel : selectLabel}
              </option>
              {repos.map((repo) => (
                <option key={repo.full_name} value={repo.full_name}>
                  {repo.full_name}
                  {repo.private ? " · private" : ""}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p className="text-sm text-error">{error}</p>
          ) : null}

          {selectedRepo ? (
            <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">
                {selectedLabel}
              </p>
              <p className="text-sm font-medium text-text-primary">{selectedRepo.full_name}</p>
              {selectedRepo.description ? (
                <p className="text-sm text-text-secondary mt-1">{selectedRepo.description}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-primary">{ownerLabel}</span>
            <input
              value={owner}
              onChange={(event) => {
                setOwner(event.target.value);
                setSelectedFullName("");
              }}
              placeholder="tuosm9390"
              className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-primary">{repoLabel}</span>
            <input
              value={repoName}
              onChange={(event) => {
                setRepoName(event.target.value);
                setSelectedFullName("");
              }}
              placeholder="auto-blog"
              className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong"
            />
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={() => setManualMode((current) => !current)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {manualLabel}
      </button>
    </div>
  );
}
