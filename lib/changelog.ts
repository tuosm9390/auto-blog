import { unstable_cache } from "next/cache";
import { getOctokit } from "./github";

export type ReleaseEntry = {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
  security: string[];
  other: string[];
};

export function parseBody(body: string): Omit<ReleaseEntry, "version" | "date"> {
  const extract = (heading: string) => {
    const re = new RegExp(
      `##[^#\\n]*(?:${heading})[^\\n]*\\n([\\s\\S]*?)(?=\\n##|$)`
    );
    const match = body.match(re);
    return (match?.[1] ?? "")
      .split("\n")
      .map((l) => l.replace(/^-\s*/, "").trim())
      .filter(Boolean);
  };
  return {
    features: extract("새 기능|Features"),
    fixes: extract("버그 수정|Bug Fix"),
    security: extract("보안|Security"),
    other: extract("리팩토링|Refactor|기타|Other"),
  };
}

export const getReleases = unstable_cache(
  async (): Promise<ReleaseEntry[]> => {
    const octokit = getOctokit(process.env.GITHUB_TOKEN);
    const { data } = await octokit.rest.repos.listReleases({
      owner: "tuosm9390",
      repo: "Synapso.dev",
      per_page: 20,
    });
    return data.map((r) => ({
      version: r.tag_name,
      date: r.published_at?.slice(0, 10) ?? "",
      ...parseBody(r.body ?? ""),
    }));
  },
  ["github-releases"],
  { revalidate: 3600 }
);
