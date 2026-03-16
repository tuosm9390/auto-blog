import { redirect } from "@/i18n/routing";

export default function AdminPage() {
  redirect({ href: "/admin/testers", locale: "ko" });
}
