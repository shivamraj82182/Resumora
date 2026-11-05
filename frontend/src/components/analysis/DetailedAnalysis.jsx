import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

const SCORE_LABELS = [
  ["technicalSkills", "Technical skills"],
  ["formatting", "Formatting"],
  ["keywords", "Keywords"],
  ["experience", "Experience"],
];

const SECTION_LABELS = [
  ["summary", "Summary"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["experience", "Experience"],
];

function FeedbackList({ title, items, renderItem }) {
  if (!items?.length) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-3 text-sm text-[var(--ink-muted)]"
          >
            {renderItem ? renderItem(item) : item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DetailedAnalysis({ analysis }) {
  const sections = SECTION_LABELS.map(([key, label]) => ({
    key,
    label,
    feedback: analysis.sectionAnalysis?.[key],
  }));
  const hasSectionFeedback = sections.some(
    ({ feedback }) => feedback?.findings?.length || feedback?.suggestions?.length,
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">Detailed AI feedback</CardTitle>
          <CardDescription className="mt-1">
            Evidence-based estimates and suggestions. Verify that every suggested skill or detail is accurate for you.
          </CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-6">
        {analysis.scores && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Category scores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-2">
              {SCORE_LABELS.map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-3"
                >
                  <div className="text-xs text-[var(--ink-muted)]">{label}</div>
                  <div className="font-display text-xl font-semibold text-[var(--ink)] mt-1">
                    {analysis.scores[key] ?? "—"}
                    <span className="text-xs font-normal text-[var(--ink-muted)]"> / 100</span>
                  </div>
                  {analysis.scoreRationale?.[key] && (
                    <p className="text-xs text-[var(--ink-muted)] mt-2">
                      {analysis.scoreRationale[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <FeedbackList title="Grammar and spelling" items={analysis.grammarIssues} renderItem={(issue) => (
          <div className="space-y-1">
            <p><span className="font-medium text-[var(--ink)]">Original:</span> {issue.original}</p>
            <p><span className="font-medium text-[var(--ink)]">Correction:</span> {issue.correction}</p>
            {issue.explanation && <p>{issue.explanation}</p>}
          </div>
        )} />

        <FeedbackList title="Weak bullet points" items={analysis.weakBulletPoints} renderItem={(bullet) => (
          <div className="space-y-1">
            {bullet.section && <p className="text-xs font-medium uppercase">{bullet.section}</p>}
            <p><span className="font-medium text-[var(--ink)]">Original:</span> {bullet.original}</p>
            <p><span className="font-medium text-[var(--ink)]">Issue:</span> {bullet.weakness}</p>
            <p><span className="font-medium text-[var(--ink)]">Suggestion:</span> {bullet.suggestion}</p>
          </div>
        )} />

        <FeedbackList
          title="Skills to consider only if accurate"
          items={analysis.missingSkills}
        />
        <FeedbackList title="Actionable suggestions" items={analysis.suggestions} />

        {hasSectionFeedback && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Section-by-section feedback
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {sections.map(({ key, label, feedback }) => {
                if (!feedback?.findings?.length && !feedback?.suggestions?.length) {
                  return null;
                }

                return (
                  <div
                    key={key}
                    className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-3"
                  >
                    <h4 className="text-sm font-medium text-[var(--ink)]">{label}</h4>
                    <FeedbackList title="Findings" items={feedback.findings} />
                    <FeedbackList title="Suggestions" items={feedback.suggestions} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {analysis.scoreDisclaimer && (
          <p className="text-xs text-[var(--ink-muted)] border-t border-[var(--border)] pt-3">
            {analysis.scoreDisclaimer}
          </p>
        )}
      </div>
    </Card>
  );
}
