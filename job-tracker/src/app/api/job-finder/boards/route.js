// Job board catalog for the search + auto-apply UIs.
// @route   GET /api/job-finder/boards
// @access  Private
//
// Exists so the Job Finder filters and the auto-apply board picker stop
// hardcoding a board list. Both previously shipped a literal ['reed','adzuna'],
// which meant every new adapter needed a matching frontend edit and the two
// lists drifted from the registry (and from each other).
//
// Each board reports three orthogonal things, and the UI needs all of them to
// explain itself:
//   configured  - does this deployment hold the credentials
//   available   - can THIS user search it right now (tier + budget + credentials)
//   quota       - how much of the free tier budget is left, and when it resets
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import { requireAuth } from '@/server/auth';
import { listBoardsWithQuota, allEnabledBoardsAreFree } from '@/server/services/jobBoards';

export const GET = withApi(async (request) => {
  const authUser = await requireAuth(request);
  const tier = authUser.subscriptionTier || 'free';

  const boards = await listBoardsWithQuota(tier);

  return NextResponse.json(
    {
      success: true,
      data: {
        tier,
        boards,
        defaults: boards.filter((b) => b.available).map((b) => b.name),
        // Lets the UI say plainly whether searching currently costs anything.
        // True means no reachable board bills per request.
        allFree: allEnabledBoardsAreFree(),
        // Boards that are set up and in-plan but temporarily out of requests,
        // with the time each frees up again.
        exhausted: boards
          .filter((b) => b.quota?.exhausted)
          .map((b) => ({
            board: b.name,
            label: b.label,
            availableAt: b.quota.availableAt,
            reason: b.quota.blockedUntil ? 'upstream_rate_limited' : 'quota_exhausted',
          })),
      },
    },
    { status: 200 }
  );
});
