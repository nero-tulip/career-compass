// src/app/lib/quizEntry.ts
export function destinationForStatus(status: string, rid: string) {
  switch (status) {
    case "started":
      return `/intake?rid=${rid}`;
    case "intake_done":
      return `/macro?rid=${rid}`;
    case "macro_done":
      // If you support resuming mid-RIASEC, you can also append &page=...
      return `/riasec?rid=${rid}`;
    case "riasec_in_progress":
      // Optional: if you store progress.page, you can use it here
      return `/riasec?rid=${rid}`;
    case "riasec_done":
    case "free_done":
    case "premium_done":
      return `/results?rid=${rid}`;
    default:
      // Fallback: start at intake for unknown/legacy statuses
      return `/intake?rid=${rid}`;
  }
}