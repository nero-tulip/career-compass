import type { UserSignals } from "./types";

/**
 * Turn structured signals into a compact, human-readable “evidence block”
 * that we can feed to an LLM or render verbatim.
 */
export function buildEvidenceText(sig: UserSignals): string {
  const parts: string[] = [];

  if (sig.intake) {
    const i = sig.intake;
    parts.push("• Profile:");
    const line: string[] = [];
    if (i.name) line.push(`Name: ${i.name}`);
    if (i.ageBand) line.push(`Age: ${i.ageBand}`);
    if (i.country?.label) line.push(`Country: ${i.country.label}`);
    if (i.educationLevel?.label) line.push(`Education: ${i.educationLevel.label}`);
    if (i.status?.length) line.push(`Status: ${i.status.map(s => s.label).join(", ")}`);
    if (i.stageOfCareer?.label) line.push(`Stage: ${i.stageOfCareer.label}`);
    if (i.goals?.length) line.push(`Goals: ${i.goals.map(g => g.label).join(", ")}`);
    if (i.workEnvironment?.label) line.push(`Work env: ${i.workEnvironment.label}`);
    if (i.travelAppetite?.label) line.push(`Travel: ${i.travelAppetite.label}`);
    if (i.workLocationIntent?.label) line.push(`Location intent: ${i.workLocationIntent.label}`);
    if (i.preferredCountries?.length) line.push(`Preferred countries: ${i.preferredCountries.map(c => c.label).join(", ")}`);
    if (i.interestedIndustries?.length) line.push(`Interested industries: ${i.interestedIndustries.map(c => c.label).join(", ")}`);
    if (line.length) parts.push("  - " + line.join(" · "));
  }

  if (sig.macro) {
    parts.push("• Career preferences:");
    // Likert
    for (const k of Object.keys(sig.macro.likert)) {
      const x = sig.macro.likert[k];
      parts.push(
        `  - ${x.prompt} → ${x.score}/5 (“${x.choiceLabel}”)`
      );
    }
    // Selects
    for (const k of Object.keys(sig.macro.selects)) {
      const x = sig.macro.selects[k];
      parts.push(`  - ${x.prompt} → ${x.label}`);
    }
    // Chips
    for (const k of Object.keys(sig.macro.chips)) {
      const x = sig.macro.chips[k];
      if (x.labels.length) parts.push(`  - ${x.prompt} → ${x.labels.join(", ")}`);
    }
    // Textareas (shorten)
    for (const k of Object.keys(sig.macro.textareas)) {
      const x = sig.macro.textareas[k];
      const clipped = x.text.length > 280 ? x.text.slice(0, 277) + "…" : x.text;
      if (clipped.trim()) parts.push(`  - ${x.prompt} → “${clipped}”`);
    }
  }

  if (sig.riasec) {
    const r = sig.riasec;
    parts.push(
      `• RIASEC: R=${r.R.toFixed(2)}, I=${r.I.toFixed(2)}, A=${r.A.toFixed(2)}, S=${r.S.toFixed(2)}, E=${r.E.toFixed(2)}, C=${r.C.toFixed(2)}`
    );
  }

  if (sig.big5) {
    const b = sig.big5;
    parts.push(
      `• Big-5: O=${b.O.toFixed(2)}, C=${b.C.toFixed(2)}, E=${b.E.toFixed(2)}, A=${b.A.toFixed(2)}, N=${b.N.toFixed(2)}`
    );
  }

  return parts.join("\n");
}