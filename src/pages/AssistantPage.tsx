import { useState } from "react";
import { Button, Card, Field, PageHeader } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export function AssistantPage() {
  const { aiSuggest } = useAppData();
  const [text, setText] = useState("");
  const [target, setTarget] = useState("equipment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof aiSuggest>> | null>(null);

  async function handleSuggest() {
    setLoading(true);
    try {
      const response = await aiSuggest({
        text,
        target: target as "equipment" | "notes" | "description" | "validation"
      });
      setResult(response);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate suggestions."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="AI Assistant"
        description="Safe suggestion mode only: no automatic saves, no silent edits, and structured suggestions stay review-first."
      />

      <Card title="Suggestion Request" subtitle="Mock provider is active for local development. Workers AI can plug in later behind the same interface.">
        <div className="form-grid">
          <Field label="Target">
            <select value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="equipment">Equipment cleanup</option>
              <option value="notes">Notes under 250</option>
              <option value="description">Description under 255</option>
              <option value="validation">Validation summary</option>
            </select>
          </Field>
        </div>
        <textarea
          className="large-textarea"
          rows={10}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste inventory text, apparatus abbreviations, barcode notes, or validation issues here"
        />
        <div className="button-row">
          <Button onClick={() => void handleSuggest()} disabled={loading || !text.trim()}>
            {loading ? "Generating..." : "Get Suggestions"}
          </Button>
        </div>
      </Card>

      {error ? (
        <Card title="Assistant Error">
          <p>{error}</p>
        </Card>
      ) : null}

      {result ? (
        <Card title={`Suggestions from ${result.provider}`} subtitle="Review these values before copying them into a record.">
          <div className="json-preview">
            <pre>{JSON.stringify(result.suggestions, null, 2)}</pre>
          </div>
          <ul className="summary-list">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
