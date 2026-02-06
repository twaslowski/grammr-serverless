import {LanguageCode} from "@/types/languages";

export const saveProfile = async (
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
) => {
    const response = await fetch("/api/v1/profile", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to save profile");
    }
};

