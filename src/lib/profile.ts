import { apiFetchVoid } from "@/lib/api/validated-fetcher";
import { LanguageCode } from "@/types/languages";

export const saveProfile = async (
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
) => {
  return apiFetchVoid(
    "/api/v1/profile",
    {
      method: "POST",
      body: JSON.stringify({ sourceLanguage, targetLanguage }),
    },
    "Failed to save profile",
  );
};
