import { FALLBACK_FEATURE_TYPE, FeatureSchema } from "@/types/feature";

describe("FeatureSchema", () => {
  it("should parse valid features", () => {
    const feature = FeatureSchema.parse({ type: "CASE", value: "NOM" });
    expect(feature.type).toBe("CASE");
    expect(feature.value).toBe("NOM");
  });

  it("should uppercase feature types", () => {
    // The morphology service emits spaCy's lowercase tags, the inflection
    // services emit uppercase ones.
    expect(FeatureSchema.parse({ type: "case", value: "NOM" }).type).toBe(
      "CASE",
    );
  });

  it("should fallback to OTHER for invalid feature types", () => {
    const feature = FeatureSchema.parse({
      type: "INVALID",
      value: "something",
    });
    expect(feature.type).toBe(FALLBACK_FEATURE_TYPE);
  });

  it.each([
    "ASPECT",
    "MOOD",
    "VOICE",
    "ANIMACY",
    "DEGREE",
    "VERBFORM",
    "POLARITY",
  ])(
    "keeps %s, which morphological analysis reports and used to be discarded",
    (type) => {
      expect(FeatureSchema.parse({ type, value: "X" }).type).toBe(type);
    },
  );
});
