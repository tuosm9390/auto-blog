import { Resend } from "resend";
import { createElement } from "react";
import TesterApproved from "@/emails/TesterApproved";
import { FROM_EMAIL } from "@/lib/constants/site";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = FROM_EMAIL;

export async function sendTesterApprovedEmail(
  to: string,
  githubUsername: string
) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set. Skipping email.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "[Synapso.dev] 테스터로 승인되었습니다 🎉",
      react: createElement(TesterApproved, { githubUsername }),
    });
  } catch (err) {
    console.error("[Email] Failed to send tester approved:", err);
  }
}
