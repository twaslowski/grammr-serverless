import { StudyStats } from "@/types/stats";

/**
 * Which shape of dashboard the payload can actually support.
 *
 * - `empty`: no cards at all. A grid of zeros would be a worse answer than an
 *   invitation to add something, so the tiles are replaced outright.
 * - `fresh`: cards, but no reviews in the retention window. The forecast and
 *   the collection breakdown are meaningful; retention is not, and a 0% would
 *   misrepresent it.
 * - `full`: everything renders.
 *
 * Deciding this centrally rather than letting each tile guess keeps the rule
 * inspectable in one place and the tiles free of defensive branches.
 */
export type DashboardRegime = "empty" | "fresh" | "full";

export function dashboardRegime(stats: StudyStats): DashboardRegime {
  if (stats.collection.total === 0) return "empty";
  if (stats.retention.reviews === 0) return "fresh";

  return "full";
}
