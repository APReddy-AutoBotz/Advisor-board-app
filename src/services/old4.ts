/**
 * Static Multi-Board Response Service (Hardened)
 * - Never throws on unknown board IDs
 * - Normalizes IDs: clini/clinical/cliniBoard -> cliniboard, etc.
 * - Works with current demo data shape (scenario.boards[].scenarios[].advisors)
 * - Provides safe fallbacks using the Board registry experts
 */

import type { Board } from '../lib/boards';
import { BOARDS } from '../lib/boards';
import {
  DEFAULT_MULTI_BOARD_QUESTION,
  // The helper returns a scenario with shape:
  // { key, title, boards: [{ boardId, boardName, scenarios: [{ id, title, advisors: [...], crossBoardSummary?, totalExperts }]}] }
  // It is guaranteed to return a valid scenario for >=2 boards.
  // @ts-ignore - path exists in the app
  // eslint-disable-next-line import/no-relative-packages
  // (We keep the relative import identical to your project structure.)
  getMultiBoardDemoScenario as getScenarioFromData,
} from '../data/multiBoardDemoData';

/** Request shape used by MultiBoardDemo */
export interface MultiDomainConsultationRequest {
  question: string;
  selectedBoards: Board[];
}

export interface PersonaLite {
  name: string;
  expertise: string;
}

export interface AdvisorOutput {
  advisorId: string;
  content: string;          // markdown/plain; UI handles clamping
  timestamp: Date;
  persona: PersonaLite;
  confidence?: number;
}

export interface MultiDomainResponse {
  boardId: string;
  boardName: string;
  responses: AdvisorOutput[];
  timestamp: Date;
  coordinationContext?: string;
}

export interface StaticMultiBoardResult {
  responses: MultiDomainResponse[];
  crossBoardSummary: string;
  totalExperts: number;
  isDemo: boolean;
}

// -------------------- ID Normalization --------------------

type CanonicalId = 'productboard' | 'cliniboard' | 'remediboard' | 'eduboard';

const ID_MAP: Record<string, CanonicalId> = {
  productboard: 'productboard',
  product: 'productboard',
  productBoard: 'productboard',

  cliniboard: 'cliniboard',
  clini: 'cliniboard',
  clinical: 'cliniboard',
  cliniBoard: 'cliniboard',
  clinicalboard: 'cliniboard',

  remediboard: 'remediboard',
  remedi: 'remediboard',
  remedy: 'remediboard',
  remediBoard: 'remediboard',

  eduboard: 'eduboard',
  edu: 'eduboard',
  eduBoard: 'eduboard',
};

function normalizeOne(id: string | undefined | null): CanonicalId | null {
  if (!id) return null;
  const raw = String(id);
  if (raw in ID_MAP) return ID_MAP[raw as keyof typeof ID_MAP];
  const stripped = raw.replace(/[^a-zA-Z]/g, '').toLowerCase();
  return (ID_MAP as any)[stripped] ?? null;
}

function normalizeIds(ids: Array<string>): CanonicalId[] {
  const out: CanonicalId[] = [];
  for (const id of ids) {
    const n = normalizeOne(id);
    if (n && !out.includes(n)) out.push(n);
  }
  return out.sort();
}

// -------------------- Core: Generate Responses --------------------

/**
 * Primary entrypoint. Returns coordinated responses immediately (static demo path).
 * Always resolves; never throws.
 */
export async function generateStaticMultiBoardResponses(
  request: MultiDomainConsultationRequest
): Promise<StaticMultiBoardResult> {
  // Subtle demo delay for skeletons
  await new Promise((r) => setTimeout(r, 500));

  const boardIds = normalizeIds(request.selectedBoards.map((b) => b.id));
  if (boardIds.length < 2) {
    // Keep UI alive with a boring fallback
    return buildFallbackFromBoards(request.selectedBoards, request.question || DEFAULT_MULTI_BOARD_QUESTION);
  }

  let scenario: any;
  try {
    scenario = getScenarioFromData(boardIds);
  } catch (_err) {
    // If the helper import shape ever changes, we still stay up
    return buildFallbackFromBoards(request.selectedBoards, request.question || DEFAULT_MULTI_BOARD_QUESTION);
  }

  // Defensive checks against unexpected shapes
  const boardsArray: any[] = Array.isArray(scenario?.boards) ? scenario.boards : [];
  if (boardsArray.length === 0) {
    return buildFallbackFromBoards(request.selectedBoards, request.question || DEFAULT_MULTI_BOARD_QUESTION);
  }

  const responses: MultiDomainResponse[] = [];
  let totalExperts = 0;

  for (const b of boardsArray) {
    const bid: string = String(b?.boardId ?? '');
    const canonical = normalizeOne(bid) ?? normalizeOne(b?.id ?? '') ?? normalizeOne(b?.name ?? '') ?? 'productboard';
    const bname: string = String(b?.boardName ?? BOARDS[canonical]?.title ?? 'Advisory Board');
    const scenarios: any[] = Array.isArray(b?.scenarios) ? b.scenarios : [];
    const chosen = scenarios[0] ?? null;

    const advisors: any[] = Array.isArray(chosen?.advisors) ? chosen.advisors : [];
    totalExperts += Number(chosen?.totalExperts ?? advisors.length ?? 0);

    const advisorOutputs: AdvisorOutput[] = advisors.map((a) => ({
      advisorId: String(a?.advisorId ?? Math.random().toString(36).slice(2)),
      content: String(a?.content ?? ''),
      timestamp: new Date(),
      persona: {
        name: String(a?.persona?.name ?? 'Expert Advisor'),
        expertise: String(a?.persona?.role ?? 'Domain Specialist'),
      },
    }));

    // If no advisors present, synthesize two from the Board registry
    if (advisorOutputs.length === 0) {
      const registry = BOARDS[canonical]?.experts ?? [];
      const synth = registry.slice(0, 2).map((e) => ({
        advisorId: e.id,
        content: synthContent(e.name, e.role, bname, request.question),
        timestamp: new Date(),
        persona: { name: e.name, expertise: e.role },
      }));
      advisorOutputs.push(...synth);
      totalExperts += synth.length;
    }

    responses.push({
      boardId: canonical,
      boardName: bname,
      responses: advisorOutputs,
      timestamp: new Date(),
      coordinationContext: String(chosen?.title ?? ''),
    });
  }

  // Ensure every selected board returns a response (append fallbacks if scenario is partial)
  const selectedCanon: CanonicalId[] = normalizeIds(request.selectedBoards.map((b) => b.id));
  const present = new Set(responses.map((r) => r.boardId));
  for (const id of selectedCanon) {
    if (!present.has(id)) {
      const chosen = request.selectedBoards.find((b) => normalizeOne(b.id) === id);
      const title = String(chosen?.title ?? BOARDS[id]?.title ?? 'Advisory Board');
      const picks = (chosen?.experts ?? BOARDS[id]?.experts ?? []).slice(0, 2);
      const now = new Date();
      const advisorOutputs = (picks.length ? picks : [
        { id: 'fallback-1', name: 'Lead Advisor', role: 'Principal' },
        { id: 'fallback-2', name: 'Domain Reviewer', role: 'Reviewer' },
      ]).map((e: any) => ({
        advisorId: e.id,
        content: synthContent(e.name, e.role, title, request.question),
        timestamp: now,
        persona: { name: e.name, expertise: e.role },
      }));

      responses.push({
        boardId: id,
        boardName: title,
        responses: advisorOutputs,
        timestamp: now,
        coordinationContext: 'Demo synthesis (fallback)',
      });
      totalExperts += advisorOutputs.length;
      present.add(id);
    }
  }

  // Cross-board summary
  const topLevelSynthesis: string = String(scenario?.synthesis ?? '');
  const crossBoardSummary =
    (topLevelSynthesis && String(topLevelSynthesis)) ||
    defaultSynthesisText(boardIds, request.question || DEFAULT_MULTI_BOARD_QUESTION);

  return {
    responses,
    crossBoardSummary,
    totalExperts: Math.max(1, totalExperts),
    isDemo: true,
  };
}

// -------------------- Fallback Builders --------------------

function buildFallbackFromBoards(boards: Board[], question: string): StaticMultiBoardResult {
  const now = new Date();
  const responses: MultiDomainResponse[] = boards.map((board) => {
    const canonical = normalizeOne(board.id) ?? 'productboard';
    const picks = (board.experts ?? []).slice(0, 2);
    const advisorOutputs: AdvisorOutput[] =
      picks.length > 0
        ? picks.map((e) => ({
            advisorId: e.id,
            content: synthContent(e.name, e.role, board.title, question),
            timestamp: now,
            persona: { name: e.name, expertise: e.role },
          }))
        : [
            {
              advisorId: 'fallback-1',
              content: synthContent('Lead Advisor', 'Principal', board.title, question),
              timestamp: now,
              persona: { name: 'Lead Advisor', expertise: 'Principal' },
            },
            {
              advisorId: 'fallback-2',
              content: synthContent('Domain Reviewer', 'Reviewer', board.title, question),
              timestamp: now,
              persona: { name: 'Domain Reviewer', expertise: 'Reviewer' },
            },
          ];

    return {
      boardId: canonical,
      boardName: board.title,
      responses: advisorOutputs,
      timestamp: now,
      coordinationContext: 'Demo synthesis',
    };
  });

  const crossBoardSummary = defaultSynthesisText(
    normalizeIds(boards.map((b) => b.id)),
    question || DEFAULT_MULTI_BOARD_QUESTION
  );

  const totalExperts = responses.reduce((acc, r) => acc + (r.responses?.length ?? 0), 0);

  return {
    responses,
    crossBoardSummary,
    totalExperts: Math.max(1, totalExperts),
    isDemo: true,
  };
}

function synthContent(advisorName: string, advisorRole: string, boardTitle: string, question: string): string {
  const id = (boardTitle || '').toLowerCase();
  if (id.includes('clinical') || id.includes('remed')) {
    return `**Verdict:** Educational guidance only; not medical advice.
- Use synthetic or de-identified data
- Add visible disclaimers and limits
- Prefer lifestyle-first, low-risk tips
- Escalate high-risk cues to clinicians
- Log rationale + sources`;
  }
    if (id.includes('product')) {
    const role = (advisorRole || '').toLowerCase();

    // CPO / Head of Product: strategy lens
    if (role.includes('chief') or role.includes('head of product') or role == 'cpo') {
      return `**Verdict:** Commit to one killer demo path and GTM story.
- Define 1–2 hero moments tied to value
- Ruthlessly defer non-critical asks to v0.2
- Craft pricing/tiers early; validate willingness to pay
- Instrument activation → habit loop → retention
- Staff POD: PM + FE + BE + Design; timebox 12 weeks`;
    }

    // Senior PM / PM: execution lens
    if (role.includes('senior product manager') or role == 'spm' or role == 'pm' or role.endswith('product manager')) {
      return `**Verdict:** Ship the reliable slice, not the buffet.
- Freeze acceptance criteria for the happy path
- Add feature flags for risky integrations
- Track LCP, crash-free sessions, funnel drop-offs
- Write rollback plan + kill-switches day one
- Weekly demo cadence; close the feedback loop`;
    }

    // Design / UX: experience lens
    if (role.includes('ux') or role.includes('design')) {
      return `**Verdict:** Clarity over cleverness; reduce cognitive load.
- Use a single primary CTA per screen
- Progressive disclosure for advanced controls
- Motion: under 250ms; respect reduced motion
- Empty states teach with examples
- Offline-friendly patterns where feasible`;
    }

    // Data / Analytics: measurement lens
    if (role.includes('data') or role.includes('analytics')) {
      return `**Verdict:** Measure the loop that matters.
- Define north-star + 3 guardrail metrics
- Event schema: hero_demo_submit → conversion
- Add cohorting by CGM usage and coach touch
- Build a minimal KPI dashboard for judges
- Annotate releases; run A/B only if stable`;
    }

    // Engineering / Platform: delivery lens
    if (role.includes('engineer') or role.includes('platform') or role.includes('tech lead')) {
      return `**Verdict:** Make reliability the feature.
- Keep the integration surface area tiny
- Circuit-breakers on all external calls
- Observability: traces + structured logs
- Use typed contracts; fail soft, not loud
- Blue/green deploy for demo week`;
    }

    // Default product fallback
    return `**Verdict:** Demo-first MVP; kill scope creep.
- Freeze the happy-path flow
- Add 1–2 wow moments only
- Instrument LCP and conversion
- Ship feature flags for risky bits
- Collect judge feedback in-app`;
  }
  if (id.includes('edu')) {
    return `**Verdict:** Explain like I’m 12, then stretch.
- Use example-first teaching
- Add recall checks and hints
- Provide printable take-home tasks
- Keep low-bandwidth fallback UX
- Track learning progress visibly`;
  }
  return `**Verdict:** Proceed with constraints and safety rails.
- Clarify outcomes and exclusions
- Phase delivery and checkpoints
- Track risks and decisions
- Prefer reversible choices early
- Capture analytics from day one`;
}

function defaultSynthesisText(boardIds: CanonicalId[], question: string): string {
  const lanes = boardIds.map((b) => {
    switch (b) {
      case 'productboard':
        return 'Product';
      case 'cliniboard':
        return 'Clinical';
      case 'remediboard':
        return 'Wellness';
      case 'eduboard':
        return 'Education';
      default:
        return 'Advisory';
    }
  });

  return [
    '## Cross-Board Synthesis',
    `*Coordinating: ${lanes.join(' • ')}*`,
    '',
    '**Verdict:** Demo-first path looks viable with guardrails.',
    '- Lock scope; prefer reliability over breadth',
    '- Show disclaimers for clinical/wellness content',
    '- Add analytics: hero_demo_submit, advisor_response_render',
    '- Optimize LCP ≤ 2.5s; CLS < 0.02',
    '- Capture judge feedback in-product',
  ].join('\n');
}

// -------------------- Helpers surfaced to UI --------------------

/**
 * Recommend a question based on selected boards.
 */
export function getRecommendedDemoQuestion(boards: Board[]): string {
  const ids = normalizeIds(boards.map((b) => b.id));
  const key = ids.join(',');
  const map: Record<string, string> = {
    'cliniboard,productboard': 'How should we scope a CGM-first diabetes MVP with safety rails?',
    'productboard,eduboard': 'How do we teach complex flows in a simple onboarding MVP?',
    'cliniboard,remediboard': 'What low-risk wellness guidance fits an educational diabetes companion?',
    'productboard,remediboard': 'How do we add habit-forming wellness nudges without over-scoping MVP?',
    'cliniboard,eduboard': 'How do we turn clinical insights into student-friendly learning?',
    'eduboard,remediboard': 'How do we design family-friendly wellness guidance for students?',
  };
  return map[key] || DEFAULT_MULTI_BOARD_QUESTION;
}

/**
 * Signal if a combo has premium demo content (true for our shipped combos).
 */
export function hasPremiumDemoContent(boards: Board[]): boolean {
  try {
    const ids = normalizeIds(boards.map((b) => b.id));
    const scenario = getScenarioFromData(ids);
    return !!scenario && Array.isArray(scenario.boards) && scenario.boards.length >= 2;
  } catch {
    return false;
  }
}
