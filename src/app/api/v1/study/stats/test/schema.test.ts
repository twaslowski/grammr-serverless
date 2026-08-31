import {
  isValidTimeZone,
  StudyStatsQuerySchema,
} from "@/app/api/v1/study/stats/schema";

describe("isValidTimeZone", () => {
  it("accepts IANA zones", () => {
    expect(isValidTimeZone("Europe/Berlin")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
  });

  it("rejects unknown zones", () => {
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("Berlin")).toBe(false);
  });

  it("rejects SQL that would otherwise reach an AT TIME ZONE expression", () => {
    // This function is the guard on an interpolated value, which is why it is
    // tested rather than assumed.
    expect(isValidTimeZone("UTC'; DROP TABLE review_log; --")).toBe(false);
    expect(isValidTimeZone("UTC' || (select 1)")).toBe(false);
  });
});

describe("StudyStatsQuerySchema", () => {
  it("defaults to UTC when tz is absent", () => {
    expect(StudyStatsQuerySchema.parse({})).toEqual({ tz: "UTC" });
  });

  it("passes a valid zone through", () => {
    expect(StudyStatsQuerySchema.parse({ tz: "Asia/Tokyo" })).toEqual({
      tz: "Asia/Tokyo",
    });
  });

  it("fails rather than falling back for an explicitly wrong zone", () => {
    // A caller that thinks it asked for Berlin must not be handed UTC buckets.
    expect(
      StudyStatsQuerySchema.safeParse({ tz: "Nowhere/Fake" }).success,
    ).toBe(false);
  });
});
