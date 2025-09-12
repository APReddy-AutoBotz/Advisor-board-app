/**
 * Persona lenses with smart fallbacks.
 * - Specific lenses for known Product personas
 * - Board + seniority fallbacks for everyone else
 * Use: craftPrompt({ id, name, role, boardId, question })
 */

export type ExpertMeta = {
  id: string;
  name?: string;
  role?: string;      // e.g., "Chief Product Officer" or "Clinical Research Strategy"
  boardId?: string;   // productboard | cliniboard | remediboard | eduboard
  question: string;
};

const specific: Record<string, string> = {
  "sarah-kim": `
Role: Chief Product Officer (CPO).
Voice: crisp, decisive, CFO-aware.
Focus: market wedge, GTM story, resourcing, LTV/CAC, time-to-value.
Ban: "coordinate with teams", "define objectives", "establish metrics".`,
  "marcus-chen": `
Role: Senior Product Manager.
Voice: pragmatic, roadmap-driven, experiment-minded.
Focus: user stories, acceptance criteria, analytics events, guardrails, rollout plan.
Ban: "define objectives", "coordinate teams", "go-to-market".`,
};

const boardLens: Record<string,string> = {
  productboard: `
Domain: Product strategy & execution.
Focus: ICP, wedge, pricing, activation, analytics events, rollout, risk flags.`,
  cliniboard: `
Domain: Clinical research & regulatory.
Focus: safety, endpoints, protocols, IEC 62304, audit trails, risk controls.`,
  remediboard: `
Domain: Holistic wellness & integrative care.
Focus: lifestyle basics, evidence tiers, safety disclaimers, non-diagnostic guidance.`,
  eduboard: `
Domain: Learning design & pedagogy.
Focus: learning objectives, scaffolding, assessment, accessibility, motivation loops.`,
};

const seniorityLens = {
  exec: `
Seniority: Executive.
Style: verdict-first, budgets/risks, external narrative, 12-word bullets.`,
  lead: `
Seniority: Lead/Manager.
Style: scope/roadmap, acceptance criteria, dependencies, feature flags, 12-word bullets.`,
  ic: `
Seniority: IC/Practitioner.
Style: concrete steps, checklists, tips, gotchas, 12-word bullets.`,
};

function guessSeniority(role: string | undefined) {
  const r = (role||"").toLowerCase();
  if (/(chief|vp|head|director|cpo|cto|ceo)/.test(r)) return 'exec';
  if (/(manager|lead|owner|pm|product manager|principal)/.test(r)) return 'lead';
  return 'ic';
}

export const sharedFormat = `
Return exactly:
**Verdict:** <≤12 words>

**Why now (3 bullets):**
- <≤12 words>
- <≤12 words>
- <≤12 words>

**Plan next 2 weeks (5 bullets):**
- <≤12 words>
- <≤12 words>
- <≤12 words>
- <≤12 words>
- <≤12 words>

**Risks & Mitigations (3):**
- <risk> — <mitigation>
- <risk> — <mitigation>
- <risk> — <mitigation>
`;

export function craftPrompt(meta: ExpertMeta) {
  const { id, role, boardId, question } = meta;

  const lensSpecific = specific[id?.toLowerCase?.() || ""] || "";
  const lensBoard = boardLens[boardId || ""] || `
Domain: Cross-functional advisory.
Focus: clear steps, measurable results, safety/ethics, 12-word bullets.`;
  const lensSeniority = seniorityLens[guessSeniority(role)];

  const banned = `
Do NOT use these phrases: "coordinate with teams", "define objectives", "establish metrics",
"develop a solid go-to-market strategy", "based on my expertise".`;

  return `
${lensSpecific}
${lensBoard}
${lensSeniority}

User question:
"${question}"

${sharedFormat}

Style rules:
- Be specific and concrete; no filler.
- Keep bullets ≤12 words; no sub-bullets.
- No persona cosplay like "As a doctor…".
- Include board-appropriate disclaimers where relevant.
${banned}
`.trim();
}