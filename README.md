# 🏆 AdvisorBoard — Multi-Board AI Advisory Panels

**Live:** https://advisorboard-panels.netlify.app  
**License:** MIT  
**Hackathon Category:** **Productivity & Workflow Tools**

Transform expert consultation from **days to minutes** — and from scattered opinions to **coordinated, audit-friendly guidance**.

> **Why productivity?** AdvisorBoard collapses time-consuming expert outreach, scheduling, and synthesis into one streamlined flow: pick boards → ask once → get structured, executive-ready answers. That’s pure flow-boost.

---

## ✨ What is AdvisorBoard?

AdvisorBoard lets you assemble **domain-specific AI advisory boards** (Product, Clinical, Holistic Wellness, Education), ask once, and get **coordinated answers** with:

- **Consensus / Tension / Decision** synthesis
- **Distinct persona voices** (e.g., **CPO** vs **PM**), with **smart fallbacks**
- **Compliance-minded** language and disclaimers where appropriate
- **Premium UX** (shimmer, stagger, glass, sticky demo), **A11y first** (focus rings, reduced motion), and **Perf** targets

Built with **Kiro** (spec-driven + vibes + steering) and deployed with a **server-side LLM proxy** (Netlify Function) so **no secrets live in the browser**.

> Clinical/WELLNESS NOTE: AI personas are **educational only** and **not medical advice**.

---

## 🚀 Headline Features

- **Multi-Board Coordination** — Cross-domain answers synthesized to **Consensus / Tension / Decision**.
- **Persona Lenses** — Bespoke prompts for key Product personas + **board + seniority** fallbacks for everyone else.
- **Server-Side LLM** — `/.netlify/functions/llm` proxies OpenAI using `OPENAI_API_KEY` from the server.
- **A11y & Perf** — Focus rings, prefers-reduced-motion, CLS < 0.02, LCP targets, lazy images.
- **Analytics Hooks** — `hero_demo_submit`, `advisor_response_render`, `summary_render`, `persona_chat_click`.

---

## 🛠 Built with Kiro — What We Actually Used (and Why It Matters)

Kiro powered **spec-to-code**, vibe-guided UI polish, and prompt steering that kept us fast and consistent.

### 📋 Spec-Driven Development (spec-to-code)
- **Living Specs → UI & Services**: Kiro specs scaffolded **Vite + React + TS + Tailwind** and core services.
- **Acceptance Criteria → Tests**: Specs fed unit/integration/a11y tests so UI shipped with guardrails.
- **Change Discipline**: We edit specs first, then generate/update stubs and wiring.

**Outcome:** predictable delivery, consistent patterns, fewer regressions.

### 🤖 Agent Hooks & Automation
- **Build/Deploy Hooks**: Typecheck/tests preflight; prod-safe build.
- **Persona Safety Hooks**: “Prompt linting” enforces verdict-first format, ≤12-word bullets, and domain disclaimers.
- **DX Quality Hooks**: Auto-insert premium micro-interactions & a11y focus-rings to avoid drift.

**Outcome:** fewer “oops” moments; consistent outputs across personas and screens.

### 🎯 Steering & Context (vibes + prompts)
- **Persona Lenses**: Bespoke lenses for CPO/PM; **board + seniority** fallbacks for all other personas.
- **Domain Guardrails**: Clinical/Wellness answers include **educational-only** disclaimers and avoid diagnostic claims.
- **Format Contracts**: All answers follow the same structure (e.g., **Verdict → Why Now → 2-Week Plan → Risks/Mitigations**) for scannable, executive-ready results.

**Outcome:** crisp, comparable responses that read like real advisory notes.

### 🧩 Where to Look in the Repo
- `/.kiro/` — specs, hooks, steering (**required for judging; intentionally included**)
- `src/services/prompt/personaLenses.ts` — persona + fallback prompt generator
- `netlify/functions/llm.ts` — server-side OpenAI proxy (no client secrets)
- `public/_headers` — forces UTF-8 so emojis render correctly across CDNs

---

## 🏗 **Technical Architecture**

```
advisor-board-app/
├─ .kiro/ # Kiro specs/hooks/steering (REQUIRED for judging)
├─ netlify/
│ └─ functions/
│ └─ llm.ts # Serverless proxy to OpenAI (reads env OPENAI_API_KEY)
├─ public/
│ └─ _headers # Forces UTF-8 (fixes emoji/character issues)
├─ src/
│ ├─ components/ # React UI
│ ├─ services/
│ │ ├─ intelligentResponseService.ts
│ │ ├─ prompt/
│ │ │ └─ personaLenses.ts # Persona + fallback prompt generator
│ │ └─ llm/ # Provider layer + config
│ ├─ data/ # Curated static demo content
│ └─ shims/
│ └─ llm-proxy-shim.ts # Reroutes browser OpenAI calls → Netlify function
└─ netlify.toml # Build + SPA redirects + functions path
```

**Why this matters:** The browser never holds real keys. All LLM traffic flows through the function.

---

## ⚙️ Setup & Run

> **Tip:** Local LLM calls only work when you run **Netlify Dev** (because it hosts functions).

### 1) Install
```bash
npm ci

### 🔧 **Tech Stack**
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Build**: Vite + ESLint + PostCSS
- **Testing**: Vitest + Testing Library + Axe (Accessibility)
- **Export**: jsPDF for professional report generation
- **Configuration**: YAML-driven domain management

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Kiro IDE (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/advisor-board-app.git
cd advisor-board-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Development with Kiro

```bash
# View specs
ls .kiro/specs/advisor-board-app/

# Run tests
npm run test

# Build for production
npm run build
```

## 📊 **Project Stats**

- **Lines of Code**: 15,000+
- **Components**: 25+ React components
- **Tests**: 100+ test cases (Unit, Integration, E2E, Accessibility)
- **Coverage**: 95%+ test coverage
- **Performance**: <2s load time, 90+ Lighthouse score
- **Accessibility**: WCAG 2.1 AA compliant

## 🎯 **Hackathon Category**

**Productivity & Workflow Tools** - AdvisorBoard saves professionals hours of time and thousands of dollars by providing instant access to expert consultation with professional documentation.

### 🏆 **Winning Differentiators**

1. **Real Business Value**: Solves actual enterprise workflow problems
2. **Scalable Architecture**: Easy domain expansion via YAML configuration
3. **Professional Polish**: Enterprise-grade UI/UX and documentation
4. **Kiro Integration**: Showcases all major Kiro features effectively
5. **Demo Excellence**: Compelling user journey with immediate value

## 📈 **Market Impact**

- **Target Market**: 10M+ professionals in regulated industries
- **Time Savings**: 80% reduction in expert consultation time
- **Cost Reduction**: 90% lower than traditional consulting fees
- **Compliance**: Built-in documentation for regulatory requirements

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process
1. Check existing specs in `.kiro/specs/`
2. Use Kiro for feature development
3. Follow our testing standards
4. Submit PR with demo video

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Kiro Team** for the revolutionary development platform
- **Domain Experts** who inspired our advisor personas
- **Open Source Community** for the amazing tools and libraries

---

**Built with ❤️ using Kiro's spec-driven development platform**

[🌟 Star this repo](https://github.com/your-username/advisor-board-app) | [🐛 Report Issues](https://github.com/your-username/advisor-board-app/issues) | [💬 Join Discussion](https://github.com/your-username/advisor-board-app/discussions)
