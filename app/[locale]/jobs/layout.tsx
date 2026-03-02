import { Metadata } from "next";

export const metadata: Metadata = {
  title: "작업 현황 | AI Tech Blog",
  robots: { index: false, follow: false },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
