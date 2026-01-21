import {
  Feature,
  FeatureSchema,
  getFeatureDisplayValue,
  getFeatureDisplayType,
  FALLBACK_FEATURE_TYPE,
} from "@/types/feature";

describe("feature", () => {
  describe("FeatureSchema", () => {
    it("should parse valid features", () => {
      const feature = FeatureSchema.parse({
        type: "CASE",
        value: "NOM",
      });
      expect(feature.type).toBe("CASE");
      expect(feature.value).toBe("NOM");
    });

    it("should uppercase feature types", () => {
      const feature = FeatureSchema.parse({
        type: "case",
        value: "NOM",
      });
      expect(feature.type).toBe("CASE");
    });

    it("should fallback to OTHER for invalid feature types", () => {
      const feature = FeatureSchema.parse({
        type: "INVALID",
        value: "something",
      });
      expect(feature.type).toBe(FALLBACK_FEATURE_TYPE);
    });
  });

  describe("getFeatureDisplayValue", () => {
    it("should return human-readable value for known features", () => {
      const feature: Feature = { type: "NUMBER", value: "SING" };
      expect(getFeatureDisplayValue(feature)).toBe("Singular");
    });

    it("should return human-readable value for case features", () => {
      const feature: Feature = { type: "CASE", value: "NOM" };
      expect(getFeatureDisplayValue(feature)).toBe("Nominative");
    });

    it("should return human-readable value for person features", () => {
      const feature: Feature = { type: "PERSON", value: "1" };
      expect(getFeatureDisplayValue(feature)).toBe("1st Person");
    });

    it("should return original value for unknown features", () => {
      const feature: Feature = { type: "CASE", value: "UNKNOWN" };
      expect(getFeatureDisplayValue(feature)).toBe("UNKNOWN");
    });
  });

  describe("getFeatureDisplayType", () => {
    it("should return human-readable type labels", () => {
      const feature: Feature = { type: "NUMBER", value: "SING" };
      expect(getFeatureDisplayType(feature)).toBe("Number");
    });

    it("should return human-readable type for case", () => {
      const feature: Feature = { type: "CASE", value: "NOM" };
      expect(getFeatureDisplayType(feature)).toBe("Case");
    });

    it("should return human-readable type for tense", () => {
      const feature: Feature = { type: "TENSE", value: "PAST" };
      expect(getFeatureDisplayType(feature)).toBe("Tense");
    });

    it("should return original type for unknown types", () => {
      const feature: Feature = { type: "OTHER", value: "something" };
      expect(getFeatureDisplayType(feature)).toBe("Other");
    });
  });
});
