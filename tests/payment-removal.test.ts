// 결제 시스템 제거 상태를 파일 시스템 기준으로 검증한다.
import { existsSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function fromRoot(...segments: string[]) {
  return path.join(repoRoot, ...segments);
}

function readFromRoot(...segments: string[]) {
  return readFileSync(fromRoot(...segments), "utf8");
}

function existingForbiddenMatches(files: string[], patterns: RegExp[]) {
  return files.flatMap((file) => {
    const fullPath = fromRoot(...file.split("/"));
    if (!existsSync(fullPath)) {
      return [];
    }

    const content = readFileSync(fullPath, "utf8");
    return patterns
      .filter((pattern) => pattern.test(content))
      .map((pattern) => `${file}: ${pattern.source}`);
  });
}

describe("payment system removal", () => {
  it("removes payment api route files", () => {
    const removedRoutes = [
      "app/api/subscription/route.ts",
      "app/api/subscription/verify/route.ts",
      "app/api/portone/billing-key/route.ts",
      "app/api/webhooks/portone/route.ts",
      "app/api/cron/billing/route.ts",
    ];

    const existingRoutes = removedRoutes.filter((route) =>
      existsSync(fromRoot(...route.split("/"))),
    );

    expect(existingRoutes, "payment API routes should be deleted").toEqual([]);
  });

  it("removes payment UI surfaces", () => {
    const removedUiFiles = [
      "app/[locale]/pricing/page.tsx",
      "app/[locale]/pricing/PricingClient.tsx",
      "app/[locale]/admin/subscriptions/page.tsx",
      "components/settings/BillingSection.tsx",
    ];
    const existingUiFiles = removedUiFiles.filter((file) =>
      existsSync(fromRoot(...file.split("/"))),
    );

    expect(existingUiFiles, "payment UI files should be deleted").toEqual([]);

    const activeUiFiles = [
      "components/Header.tsx",
      "components/MobileMenu.tsx",
      "app/[locale]/admin/layout.tsx",
      "app/[locale]/admin-portal-v5-secret/page.tsx",
      "messages/ko.json",
      "messages/en.json",
    ];
    const forbiddenUiPatterns = [
      /pricing/i,
      /subscriptions?/i,
      /billing/i,
      /portone/i,
      /stripe/i,
      /결제/,
      /구독/,
      /요금제/,
    ];

    expect(
      existingForbiddenMatches(activeUiFiles, forbiddenUiPatterns),
      "active UI should not expose payment text or links",
    ).toEqual([]);
  });

  it("removes payment dependencies and config", () => {
    const packageJson = JSON.parse(readFromRoot("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ];

    expect(dependencyNames).not.toContain("@portone/browser-sdk");
    expect(dependencyNames).not.toContain("@portone/server-sdk");

    const lockfiles = ["package-lock.json", "pnpm-lock.yaml"];
    expect(
      existingForbiddenMatches(lockfiles, [/@portone\/browser-sdk/, /@portone\/server-sdk/]),
      "lockfiles should not retain PortOne SDK packages",
    ).toEqual([]);

    const vercelConfig = readFromRoot("vercel.json");
    expect(vercelConfig).not.toMatch(/billing/i);

    const nextConfig = readFromRoot("next.config.ts");
    expect(nextConfig).not.toMatch(/cdn\.portone\.io|api\.portone\.io|iamport|tosspayments|payment=/i);
  });

  it("removes payment domain modules and docs guidance", () => {
    const removedDomainFiles = [
      "lib/portone-billing.ts",
      "lib/billing.ts",
      "lib/stripe.ts",
      "lib/subscription.ts",
      "scripts/add-subscription-fields.sql",
    ];
    const existingDomainFiles = removedDomainFiles.filter((file) =>
      existsSync(fromRoot(...file.split("/"))),
    );

    expect(existingDomainFiles, "payment domain files should be deleted").toEqual([]);

    const docsAndInstructions = [
      "AGENTS.md",
      "app/api/AGENTS.md",
      "lib/AGENTS.md",
      "components/AGENTS.md",
      "CLAUDE.md",
      "GEMINI.md",
      "RULES.md",
      "README.md",
      "TODOS.md",
    ];
    const forbiddenDocPatterns = [
      /PortOne/,
      /Stripe/,
      /billing/i,
      /subscriptions?/i,
      /결제/,
      /구독/,
      /요금제/,
    ];

    expect(
      existingForbiddenMatches(docsAndInstructions, forbiddenDocPatterns),
      "current docs and agent instructions should not describe payment features",
    ).toEqual([]);
  });
});
