import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { getStudyStats } from "@/lib/server/stats";

import { StudyStatsQuerySchema } from "./schema";

/**
 * GET /api/v1/study/stats - Aggregates behind the Study tab's idle dashboard.
 *
 * Authorization: reads scoped to the caller. See `getStudyStats` for how
 * `review_log`, which carries no `user_id`, is reached.
 */
export const GET = withApiHandler(
  { querySchema: StudyStatsQuerySchema },
  async ({ user, query }) => {
    return NextResponse.json(await getStudyStats(user.id, query.tz));
  },
);
