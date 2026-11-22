import type { Debate } from "@/types/domain";

export function statusTone(s: Debate["status"]) {
  return s === "open" ? "accent" : s === "upcoming" ? "info" : s === "concluded" ? "success" : "warning";
}
