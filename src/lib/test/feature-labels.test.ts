import {
  getFeatureTypeLabel,
  getFeatureValueLabel,
  getPosLabel,
} from "@/lib/feature-labels";

describe("feature-labels", () => {
  describe("getFeatureValueLabel", () => {
    describe("CASE values", () => {
      it("should return human-readable case labels", () => {
        expect(getFeatureValueLabel("CASE", "NOM")).toBe("Nominative");
        expect(getFeatureValueLabel("CASE", "NOMN")).toBe("Nominative");
        expect(getFeatureValueLabel("CASE", "GEN")).toBe("Genitive");
        expect(getFeatureValueLabel("CASE", "GENT")).toBe("Genitive");
        expect(getFeatureValueLabel("CASE", "ACC")).toBe("Accusative");
        expect(getFeatureValueLabel("CASE", "ACCS")).toBe("Accusative");
        expect(getFeatureValueLabel("CASE", "DAT")).toBe("Dative");
        expect(getFeatureValueLabel("CASE", "DATV")).toBe("Dative");
        expect(getFeatureValueLabel("CASE", "ABL")).toBe("Instrumental");
        expect(getFeatureValueLabel("CASE", "ABLT")).toBe("Instrumental");
        expect(getFeatureValueLabel("CASE", "LOC")).toBe("Prepositional");
        expect(getFeatureValueLabel("CASE", "LOCT")).toBe("Prepositional");
      });

      it("should be case insensitive", () => {
        expect(getFeatureValueLabel("case", "nom")).toBe("Nominative");
        expect(getFeatureValueLabel("Case", "Nom")).toBe("Nominative");
      });
    });

    describe("NUMBER values", () => {
      it("should return human-readable number labels", () => {
        expect(getFeatureValueLabel("NUMBER", "SING")).toBe("Singular");
        expect(getFeatureValueLabel("NUMBER", "SG")).toBe("Singular");
        expect(getFeatureValueLabel("NUMBER", "PLUR")).toBe("Plural");
        expect(getFeatureValueLabel("NUMBER", "PL")).toBe("Plural");
      });

      it("should be case insensitive", () => {
        expect(getFeatureValueLabel("number", "sing")).toBe("Singular");
        expect(getFeatureValueLabel("Number", "Plur")).toBe("Plural");
      });
    });

    describe("GENDER values", () => {
      it("should return human-readable gender labels", () => {
        expect(getFeatureValueLabel("GENDER", "MASC")).toBe("Masculine");
        expect(getFeatureValueLabel("GENDER", "M")).toBe("Masculine");
        expect(getFeatureValueLabel("GENDER", "FEM")).toBe("Feminine");
        expect(getFeatureValueLabel("GENDER", "FEMN")).toBe("Feminine");
        expect(getFeatureValueLabel("GENDER", "F")).toBe("Feminine");
        expect(getFeatureValueLabel("GENDER", "NEUT")).toBe("Neuter");
        expect(getFeatureValueLabel("GENDER", "N")).toBe("Neuter");
      });
    });

    describe("PERSON values", () => {
      it("should return human-readable person labels", () => {
        expect(getFeatureValueLabel("PERSON", "1")).toBe("1st Person");
        expect(getFeatureValueLabel("PERSON", "FIRST")).toBe("1st Person");
        expect(getFeatureValueLabel("PERSON", "1PER")).toBe("1st Person");
        expect(getFeatureValueLabel("PERSON", "2")).toBe("2nd Person");
        expect(getFeatureValueLabel("PERSON", "SECOND")).toBe("2nd Person");
        expect(getFeatureValueLabel("PERSON", "2PER")).toBe("2nd Person");
        expect(getFeatureValueLabel("PERSON", "3")).toBe("3rd Person");
        expect(getFeatureValueLabel("PERSON", "THIRD")).toBe("3rd Person");
        expect(getFeatureValueLabel("PERSON", "3PER")).toBe("3rd Person");
      });
    });

    describe("TENSE values", () => {
      it("should return human-readable tense labels", () => {
        expect(getFeatureValueLabel("TENSE", "PAST")).toBe("Past");
        expect(getFeatureValueLabel("TENSE", "PRES")).toBe("Present");
        expect(getFeatureValueLabel("TENSE", "FUT")).toBe("Future");
        expect(getFeatureValueLabel("TENSE", "FUTR")).toBe("Future");
      });
    });

    describe("Unknown values", () => {
      it("should return the original value if no mapping exists", () => {
        expect(getFeatureValueLabel("CASE", "UNKNOWN")).toBe("UNKNOWN");
        expect(getFeatureValueLabel("UNKNOWN_TYPE", "value")).toBe("value");
      });
    });
  });

  describe("getFeatureTypeLabel", () => {
    it("should return human-readable type labels", () => {
      expect(getFeatureTypeLabel("CASE")).toBe("Case");
      expect(getFeatureTypeLabel("NUMBER")).toBe("Number");
      expect(getFeatureTypeLabel("GENDER")).toBe("Gender");
      expect(getFeatureTypeLabel("PERSON")).toBe("Person");
      expect(getFeatureTypeLabel("TENSE")).toBe("Tense");
      expect(getFeatureTypeLabel("ASPECT")).toBe("Aspect");
      expect(getFeatureTypeLabel("MOOD")).toBe("Mood");
      expect(getFeatureTypeLabel("VOICE")).toBe("Voice");
      expect(getFeatureTypeLabel("ANIMACY")).toBe("Animacy");
      expect(getFeatureTypeLabel("OTHER")).toBe("Other");
    });

    it("should be case insensitive", () => {
      expect(getFeatureTypeLabel("case")).toBe("Case");
      expect(getFeatureTypeLabel("Case")).toBe("Case");
      expect(getFeatureTypeLabel("number")).toBe("Number");
    });

    it("should return the original type if no mapping exists", () => {
      expect(getFeatureTypeLabel("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("getPosLabel", () => {
    it("should return human-readable labels for common POS tags", () => {
      expect(getPosLabel("NOUN")).toBe("Noun");
      expect(getPosLabel("VERB")).toBe("Verb");
      expect(getPosLabel("ADJ")).toBe("Adjective");
      expect(getPosLabel("ADV")).toBe("Adverb");
      expect(getPosLabel("PRON")).toBe("Pronoun");
      expect(getPosLabel("AUX")).toBe("Auxiliary");
    });

    it("should return human-readable labels for all Universal Dependencies POS tags", () => {
      expect(getPosLabel("PROPN")).toBe("Proper Noun");
      expect(getPosLabel("INTJ")).toBe("Interjection");
      expect(getPosLabel("ADP")).toBe("Adposition");
      expect(getPosLabel("CCONJ")).toBe("Coordinating Conjunction");
      expect(getPosLabel("DET")).toBe("Determiner");
      expect(getPosLabel("NUM")).toBe("Numeral");
      expect(getPosLabel("PART")).toBe("Particle");
      expect(getPosLabel("SCONJ")).toBe("Subordinating Conjunction");
      expect(getPosLabel("PUNCT")).toBe("Punctuation");
      expect(getPosLabel("SYM")).toBe("Symbol");
      expect(getPosLabel("X")).toBe("Other");
    });

    it("should be case insensitive", () => {
      expect(getPosLabel("noun")).toBe("Noun");
      expect(getPosLabel("Noun")).toBe("Noun");
      expect(getPosLabel("verb")).toBe("Verb");
      expect(getPosLabel("Verb")).toBe("Verb");
    });

    it("should return the original POS tag if no mapping exists", () => {
      expect(getPosLabel("UNKNOWN_POS")).toBe("UNKNOWN_POS");
    });
  });
});
