import type { DraftStatus } from "@/app/types/drafts";

export function destinationForStatus(status: DraftStatus, rid: string): string {
  switch (status) {
    case "started":
      return `/intake?rid=${rid}`;
    case "intake_done":
      return `/macro?rid=${rid}`;
    case "macro_done":
      return `/riasec?rid=${rid}`;
    case "riasec_done":
    case "free_done":
      return `/results?rid=${rid}`;
    case "premium_done":
      return `/final?rid=${rid}`;
    default:
      // archived shouldn't be active; fall back to intake if it happens
      return `/intake?rid=${rid}`;
  }
}
