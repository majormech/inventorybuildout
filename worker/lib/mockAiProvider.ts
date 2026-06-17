import { cleanWhitespace, coerceUseChoice, normalizeApparatusName } from "../../shared/validation";
import type { AiSuggestionRequest, AiSuggestionResponse } from "../../shared/types";

export interface AiProvider {
  suggest(input: AiSuggestionRequest): Promise<AiSuggestionResponse>;
}

function buildDescription(text: string): string {
  const cleaned = cleanWhitespace(text);
  if (!cleaned) {
    return "";
  }
  return cleaned.slice(0, 255);
}

function buildNotes(text: string): string {
  const cleaned = cleanWhitespace(text).replace(/\s+/g, " ");
  return cleaned.slice(0, 250);
}

export class MockAiProvider implements AiProvider {
  async suggest(input: AiSuggestionRequest): Promise<AiSuggestionResponse> {
    const cleaned = cleanWhitespace(input.text);
    const normalizedApparatus = normalizeApparatusName(cleaned);
    const useChoice = coerceUseChoice("", {
      name: cleaned,
      equipment_type: cleaned,
      description: cleaned
    });

    return {
      provider: "mock",
      suggestions: {
        cleaned_text: cleaned,
        normalized_apparatus_name: normalizedApparatus,
        suggested_use: useChoice,
        suggested_description: buildDescription(cleaned),
        suggested_notes: buildNotes(cleaned)
      },
      warnings: [
        "Mock AI is active. Suggestions are deterministic and must be reviewed before saving.",
        "Automatic saves are intentionally disabled."
      ]
    };
  }
}
