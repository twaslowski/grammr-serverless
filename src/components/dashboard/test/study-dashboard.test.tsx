import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StudyDashboard } from "@/components/dashboard/study-dashboard";
import { getStudyStats } from "@/lib/stats";
import { StudyStats } from "@/types/stats";

jest.mock("@/lib/stats", () => ({
  getStudyStats: jest.fn(),
}));

const mockGetStudyStats = getStudyStats as jest.MockedFunction<
  typeof getStudyStats
>;

function stats(overrides: Partial<StudyStats> = {}): StudyStats {
  return {
    timeZone: "Europe/Berlin",
    collection: {
      total: 248,
      new: 40,
      learning: 12,
      review: 190,
      relearning: 6,
      dueNow: 0,
      nextDue: "2026-09-01T16:00:00Z",
      ...overrides.collection,
    },
    forecast: overrides.forecast ?? [
      { day: "2026-09-01", count: 0 },
      { day: "2026-09-02", count: 9 },
      { day: "2026-09-03", count: 23 },
      { day: "2026-09-04", count: 14 },
      { day: "2026-09-05", count: 5 },
      { day: "2026-09-06", count: 2 },
      { day: "2026-09-07", count: 6 },
    ],
    retention: {
      rate: 0.91,
      previousRate: 0.88,
      reviews: 232,
      again: 12,
      hard: 30,
      good: 180,
      easy: 22,
      ...overrides.retention,
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StudyDashboard", () => {
  it("renders both tiles once stats arrive", async () => {
    mockGetStudyStats.mockResolvedValue(stats());

    render(<StudyDashboard reviewed={0} />);

    expect(await screen.findByText("All caught up")).toBeInTheDocument();
    expect(screen.getByText("248 cards")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText("Coming up")).toBeInTheDocument();
  });

  it("credits the session that just ended", async () => {
    mockGetStudyStats.mockResolvedValue(stats());

    render(<StudyDashboard reviewed={12} />);

    expect(
      await screen.findByText("Nice work — 12 cards reviewed"),
    ).toBeInTheDocument();
  });

  it("says when the next card comes back", async () => {
    mockGetStudyStats.mockResolvedValue(stats());

    render(<StudyDashboard reviewed={0} />);

    // The interval is relative to now, so assert the shape, not the number.
    expect(await screen.findByText(/^Next review in /)).toBeInTheDocument();
  });

  it("invites a user with no cards to make one, instead of showing zeros", async () => {
    mockGetStudyStats.mockResolvedValue(
      stats({
        collection: {
          total: 0,
          new: 0,
          learning: 0,
          review: 0,
          relearning: 0,
          dueNow: 0,
          nextDue: null,
        },
      }),
    );

    render(<StudyDashboard reviewed={0} />);

    expect(await screen.findByText("Your deck is empty")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /look up a word/i }),
    ).toHaveAttribute("href", "/dashboard/dictionary");
    expect(screen.queryByText(/Retention/)).not.toBeInTheDocument();
  });

  it("hides retention until there is something to measure", async () => {
    mockGetStudyStats.mockResolvedValue(
      stats({
        retention: {
          rate: null,
          previousRate: null,
          reviews: 0,
          again: 0,
          hard: 0,
          good: 0,
          easy: 0,
        },
      }),
    );

    render(<StudyDashboard reviewed={0} />);

    // The collection is still worth showing; a 0% recall rate would not be.
    expect(await screen.findByText("248 cards")).toBeInTheDocument();
    expect(screen.queryByText(/Retention/)).not.toBeInTheDocument();
  });

  it("omits the delta when there is no prior window to compare against", async () => {
    mockGetStudyStats.mockResolvedValue(
      stats({
        retention: {
          rate: 0.91,
          previousRate: null,
          reviews: 232,
          again: 12,
          hard: 30,
          good: 180,
          easy: 22,
        },
      }),
    );

    render(<StudyDashboard reviewed={0} />);

    expect(await screen.findByText("91%")).toBeInTheDocument();
    expect(screen.queryByText(/pts?$/)).not.toBeInTheDocument();
  });

  it("offers a retry rather than a blank screen when the fetch fails", async () => {
    mockGetStudyStats.mockRejectedValueOnce(new Error("boom"));
    mockGetStudyStats.mockResolvedValueOnce(stats());

    render(<StudyDashboard reviewed={0} />);

    const retry = await screen.findByRole("button", { name: /try again/i });
    await userEvent.click(retry);

    expect(await screen.findByText("248 cards")).toBeInTheDocument();
  });

  it("labels the forecast for a screen reader, since the bars are divs", async () => {
    mockGetStudyStats.mockResolvedValue(stats());

    render(<StudyDashboard reviewed={0} />);

    expect(
      await screen.findByRole("img", { name: /9 on Wednesday/ }),
    ).toBeInTheDocument();
  });

  it("says out loud that review history can disappear", async () => {
    mockGetStudyStats.mockResolvedValue(stats());

    render(<StudyDashboard reviewed={0} />);

    expect(
      await screen.findByText(/Unsubscribing from a deck removes/),
    ).toBeInTheDocument();
  });
});
