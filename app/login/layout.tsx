import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 | AI Tech Blog",
  description: "GitHub 계정으로 AI Tech Blog에 로그인하세요.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
