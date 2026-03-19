import { Resend } from "resend";
import { createElement } from "react";
import TesterApplyConfirm from "@/emails/TesterApplyConfirm";
import TesterApproved from "@/emails/TesterApproved";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "Synapso.dev <noreply@synapso.dev>";

export async function sendTesterApplyConfirmEmail(
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
      subject: "[Synapso.dev] 테스터 신청이 접수되었습니다",
      react: createElement(TesterApplyConfirm, { githubUsername }),
    });
  } catch (err) {
    console.error("[Email] Failed to send tester apply confirm:", err);
  }
}

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
