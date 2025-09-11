// -----------------------------------------------------------------------------
// Multi-board demo data (static, judge-ready). Keeps responses short & distinct.
// This file is self-contained and safe: no null returns from the helper.
// -----------------------------------------------------------------------------

// If your app already has these types elsewhere, these local types are compatible
export type AdvisorPersona = {
  initials: string;
  name: string;
  role: string;
};

export type AdvisorEntry = {
  advisorId: string;
  persona: AdvisorPersona;
  content: string; // markdown; UI handles clamping + show more/less
};

export type BoardBlock = {
  boardId: 'productboard' | 'cliniboard' | 'remediboard' | 'eduboard';
  boardName: string;
  scenarios: Array<{
    id: string;
    title: string;
    advisors: AdvisorEntry[];
    crossBoardSummary?: string; // optional per-scenario synthesis
    totalExperts: number;
  }>;
};

export type MultiBoardDemoScenario = {
  key: string; // e.g., 'clinicalWellness'
  title: string;
  boards: BoardBlock[];
  synthesis?: string; // optional top-level synthesis
};

// -----------------------------------------------------------------------------
// Demo scenarios for common board combinations
// -----------------------------------------------------------------------------

export const MULTI_BOARD_DEMO_SCENARIOS: Record<string, MultiBoardDemoScenario> = {
  // Product + Clinical
  productClinical: {
    key: 'productClinical',
    title: 'Product + Clinical — Diabetes Platform',
    boards: [
      {
        boardId: 'productboard',
        boardName: 'Product Development & Strategy',
        scenarios: [
          {
            id: 'diabetes-platform',
            title: 'Diabetes Platform — Product',
            advisors: [
              {
                advisorId: 'sk',
                persona: { initials: 'SK', name: 'Sarah Kim', role: 'Chief Product Officer' },
                content: `**Verdict:** Ship a CGM-first MVP with care-team messaging in 12 weeks.

- Map patient journeys: onboarding → CGM pairing → coach loop
- Must-haves: CGM sync, hypo alerts, med logging
- Guardrails: PHI segregation, audit trails
- Success: ≥50% WAU by week 8
- Next: Staff 1 PM, 1 FE, 1 BE, 1 RN; kickoff Monday`,
              },
              {
                advisorId: 'mc',
                persona: { initials: 'MC', name: 'Marcus Chen', role: 'Senior Product Manager' },
                content: `**Verdict:** Validate with 3 cohorts; prove activation, retention, outcomes.

- Cohorts: newly diagnosed, insulin users, lifestyle-managed
- A/B: onboarding flows; alert thresholds; coach cadence
- Metrics: D1/D7 activation, 8-week WAU, HbA1c delta (pilot)
- Risk: scope creep; freeze PRD v1 to 8 epics
- Next: PRD sign-off; experiment matrix T-0`,
              },
            ],
            totalExperts: 2,
          },
        ],
      },
      {
        boardId: 'cliniboard',
        boardName: 'Clinical Research & Regulatory',
        scenarios: [
          {
            id: 'diabetes-platform',
            title: 'Diabetes Platform — Clinical',
            advisors: [
              {
                advisorId: 'dsc',
                persona: { initials: 'DSC', name: 'Dr. Sarah Chen', role: 'Clinical Research Strategy' },
                content: `**Verdict:** Class II-adjacent app; HIPAA + IEC 62304; start with MDDS claim.

- FDA: avoid diagnostic claims in v1
- Data: BAA; least-privilege access; audit logs
- Risk: ISO 14971 safety case; hazard analysis
- Pilot: 2 clinics; pre/post HbA1c; PROs
- Next: QMS checklist draft in 7 days

*AI persona. Educational only — not medical advice.*`,
              },
              {
                advisorId: 'dmr',
                persona: { initials: 'DMR', name: 'Dr. Michael Rodriguez', role: 'Regulatory Affairs Director' },
                content: `**Verdict:** Build regulatory runway while learning from pilots.

- Labeling: patient self-management support; no diagnosis
- Interop: CGM integrations under vendor terms
- Security: threat model; PHI data map
- Evidence: define clinical endpoints early
- Next: pre-sub outline; consult in 3 weeks

*AI persona. Educational only — not medical advice.*`,
              },
            ],
            totalExperts: 2,
          },
        ],
      },
    ],
    synthesis: `**Consensus:** User-centered MVP with safety-first design.
**Tension:** Speed-to-market vs regulatory scope.
**Decision:** Product owns MVP scope; Clinical owns safety review; target ≥70% WAU by week 8.`,
  },

  // Product + Education
  productEducation: {
    key: 'productEducation',
    title: 'Product + Education — Diabetes Platform',
    boards: [
      {
        boardId: 'productboard',
        boardName: 'Product Development & Strategy',
        scenarios: [
          {
            id: 'diabetes-platform',
            title: 'Diabetes Platform — Product',
            advisors: [
              {
                advisorId: 'sk',
                persona: { initials: 'SK', name: 'Sarah Kim', role: 'Chief Product Officer' },
                content: `**Verdict:** Build habit-forming education loops tied to device signals.

- Trigger: CGM event → micro-lesson
- Action: 60-second explainer + tiny task
- Variable reward: streaks → coach kudos
- Investment: log meal, rate mood, set goal
- Next: library of 24 lessons; ship v1`,
              },
            ],
            totalExperts: 1,
          },
        ],
      },
      {
        boardId: 'eduboard',
        boardName: 'Education & Learning Design',
        scenarios: [
          {
            id: 'diabetes-platform',
            title: 'Diabetes Platform — Education',
            advisors: [
              {
                advisorId: 'ed1',
                persona: { initials: 'EL', name: 'Elena Rodriguez', role: 'Head of Design' },
                content: `**Verdict:** Competency-based modules; assess, adapt, repeat.

- Pre-test → personalized pathway
- Chunking: 3–5 minute lessons max
- Spaced repetition: weekly refreshers
- Accessibility: WCAG AA; captions/alt
- Next: 3 pathways; pilot N=50`,
              },
            ],
            totalExperts: 1,
          },
        ],
      },
    ],
    synthesis: `**Consensus:** Just-in-time education beats generic content.
**Tension:** Depth vs completion rates.
**Decision:** Cap lessons at 5 minutes; measure 30-day retention.`,
  },

  // Clinical + Remedi (Holistic)
  clinicalWellness: {
    key: 'clinicalWellness',
    title: 'Clinical + Holistic — Diabetes Platform',
    boards: [
      {
        boardId: 'cliniboard',
        boardName: 'Clinical Research & Regulatory',
        scenarios: [
          {
            id: 'diabetes-platform',
            title: 'Diabetes Platform — Clinical',
            advisors: [
              {
                advisorId: 'dsc',
                persona: { initials: 'DSC', name: 'Dr. Sarah Chen', role: 'Clinical Research Strategy' },
                content: `**Verdict:** Integrate safe lifestyle features; avoid diagnostic claims.

- HIPAA BAA; least-privilege access; audit logs
- IEC 62304 SDLC; traceability
- Define endpoints: HbA1c, TIR, PROs
- Pilot: 2 sites; 12 weeks; ethics approval
- Next: risk controls; safety case outline

*AI persona. Educational only — not medical advice.*`,
              },
            ],
            totalExperts: 1,
          },
        ],
      },
      {
        boardId: 'remediboard',
        boardName: 'Holistic Wellness & Natural Remedies',
        scenarios: [
          {
            id: 'diabetes-platform',
            title: 'Diabetes Platform — Holistic Wellness',
            advisors: [
              {
                advisorId: 'djw',
                persona: {
                  initials: 'DJW',
                  name: 'Dr. James Wilson',
                  role: 'Naturopathic Medicine',
                },
                content: `**Verdict:** Build daily habit loops around whole foods, movement, and stress care.

- Plate method: half veg, quarter protein, smart carbs
- Swap refined grains for millets/brown rice (trial 4 weeks)
- Pair carbs with fiber + protein to blunt glucose spikes
- CGM-aware nudges: pre-meal walk; 10-min post-meal movement
- Weekly coach check-ins; track sleep, mood, adherence`,
              },
              {
                advisorId: 'dlc',
                persona: {
                  initials: 'DLC',
                  name: 'Dr. Lisa Chen',
                  role: 'Traditional Chinese Medicine',
                },
                content: `**Verdict:** Layer TCM pattern support onto metabolic basics, safely and simply.

- Screen pattern: damp-heat vs qi deficiency (no diagnostic claims)
- Food therapy: warm, minimally processed, low-GI; adjust seasonally
- Gentle qigong/breathwork: 10–15 minutes after meals
- Acupuncture module: educational only; refer licensed practitioners
- Herb safety: flag drug–herb interactions; pharmacist review`,
              },
            ],
            crossBoardSummary: `**Shared Ground:** Patient safety, evidence-based validation, and respect for traditional healing principles.

**Key Trade-off:** Speed-to-market vs regulatory scope; align timelines.

**Decision:** Product owns MVP scope; Clinical owns safety review; target ≥70% WAU by week 8.

**Immediate Next:** Form a traditional-medicine practitioner advisory committee within 7 days for study-design input and cultural-safety review.`,
            totalExperts: 2,
          },
        ],
      },
    ],
    synthesis: `**Consensus:** Combine metabolic basics with safe, culturally competent care.
**Tension:** Standardization vs personalization.
**Decision:** Pilot dual-track care education; monitor outcomes + adherence.`,
  },
};

// -----------------------------------------------------------------------------
// Helper + default prompt
// -----------------------------------------------------------------------------

// Map ANY 2- or 3-board combo to our available demo scenarios.
// (IDs must match your app: 'productboard' | 'cliniboard' | 'remediboard' | 'eduboard')
export function getMultiBoardDemoScenario(boardIds: string[]): MultiBoardDemoScenario {
  // de-dup + sort for stable keys: e.g., ['productboard','cliniboard'] -> 'cliniboard,productboard'
  const ids = [...new Set(boardIds)].sort();
  const key = ids.join(',');

  const scenarioMap: Record<string, keyof typeof MULTI_BOARD_DEMO_SCENARIOS> = {
    // ---- exact 2-board matches
    'cliniboard,productboard': 'productClinical',
    'productboard,eduboard': 'productEducation',
    'cliniboard,remediboard': 'clinicalWellness',

    // ---- remaining 2-board pairs → sensible fallbacks
    'productboard,remediboard': 'clinicalWellness', // product × wellness → prioritize safety + habits
    'cliniboard,eduboard': 'productEducation',      // clinical × edu → education-style demo fits best
    'eduboard,remediboard': 'productEducation',     // edu × wellness → keep to short, teachable flows

    // ---- 3-board mixes (closest existing)
    'cliniboard,productboard,remediboard': 'clinicalWellness',
    'cliniboard,productboard,eduboard': 'productEducation',
    'cliniboard,eduboard,remediboard': 'clinicalWellness',
    'productboard,eduboard,remediboard': 'productEducation',
  };

  const mapped = scenarioMap[key];
  if (mapped) return MULTI_BOARD_DEMO_SCENARIOS[mapped];

  // Belt-and-suspenders fallback (never return undefined)
  if (ids.includes('cliniboard') && ids.includes('remediboard')) {
    return MULTI_BOARD_DEMO_SCENARIOS['clinicalWellness'];
  }
  if (ids.includes('productboard') && ids.includes('cliniboard')) {
    return MULTI_BOARD_DEMO_SCENARIOS['productClinical'];
  }
  if (ids.includes('productboard') && ids.includes('eduboard')) {
    return MULTI_BOARD_DEMO_SCENARIOS['productEducation'];
  }

  // Last-resort default (shouldn’t be hit if min 2 boards are enforced)
  return MULTI_BOARD_DEMO_SCENARIOS['productClinical'];
}

// Some modules may import a default. Make it safe.
export default getMultiBoardDemoScenario;

// Default multi-board question for demo
export const DEFAULT_MULTI_BOARD_QUESTION =
  'How should we approach developing a digital health platform for diabetic patients?';
