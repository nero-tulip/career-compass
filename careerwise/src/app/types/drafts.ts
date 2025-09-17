export type DraftStatus =
  | "started"
  | "intake_done"
  | "macro_done"
  | "riasec_done"
  | "free_done"
  | "premium_done"
  | "archived";

export type DraftDoc = {
  status: DraftStatus;
  entitlement: "free" | "premium";
  createdAt?: any;
  updatedAt?: any;
  intake?: unknown;
  macro?: unknown;
  riasec?: unknown;
};
