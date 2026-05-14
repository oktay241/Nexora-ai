export function humanizePublishStatusTr(raw: string | null | undefined): string {
  const s = String(raw ?? "").toLowerCase();
  switch (s) {
    case "scheduled":
      return "Planlandı";
    case "sending":
      return "Yayınlanıyor";
    case "sent":
      return "Yayında";
    case "error":
      return "Dikkat gerekiyor";
    case "draft":
      return "Taslak";
    case "needs_approval":
      return "Onay bekliyor";
    default:
      return raw && String(raw).trim().length ? String(raw) : "—";
  }
}
