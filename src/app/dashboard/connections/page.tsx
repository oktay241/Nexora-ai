import { redirect } from "next/navigation";

/** Eski bağlantılar sayfası → sosyal bağlantılar */
export default function ConnectionsPage() {
  redirect("/dashboard/social");
}
