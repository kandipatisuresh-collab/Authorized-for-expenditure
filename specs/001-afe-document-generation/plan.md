# Implementation Plan: AFE Document Generation

**Branch**: `001-afe-document-generation` | **Date**: 2026-10-31 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
[specs/001-afe-document-generation/spec.md](./spec.md)

## Summary

Deliver the AFE generator as a Copilot Chat workflow governed by the existing AFE
requirements and project constitution. The repository currently contains prompt and
Spec Kit documentation, not an executable application; therefore this plan defines the
user-facing generation contract and validation scenarios without introducing an
unspecified software stack or external data source. The generated document must keep
estimates and assumptions distinguishable from supplied facts and reconcile IDC, TDC,
partner exposures, and the total.

## Technical Context

**Language/Version**: N/A; no executable application language is established.

**Primary Dependencies**: GitHub Copilot Chat; `.github/prd.md`;
`.github/AFEinstructions.md`; `.specify/memory/constitution.md`.

**Storage**: N/A; generation uses the current user request and does not persist AFE
records.

**Testing**: Documented acceptance scenarios and manual validation against the AFE
generation contract; independently recalculate all displayed monetary totals.

**Target Platform**: GitHub Copilot Chat in VS Code.

**Project Type**: Prompt-driven document generation workflow.

**Performance Goals**: Produce a complete AFE in one response for a sufficiently
specified request; no latency target is established.

**Constraints**: Output is Markdown; no external price, vendor, operating agreement, or
economic data source is established; do not imply missing values are zero or invent
confirmed project facts.

**Scale/Scope**: One AFE per request; no persistence, electronic routing, signature
execution, or accounting integration in the initial scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Financial Accuracy and Classification | Define separate IDC/TDC treatment and explicit reconciliation checks for contingencies, totals, and partner exposures. | PASS |
| II. Traceable Estimates and Assumptions | Distinguish user-supplied values, calculations, estimated defaults, and unresolved placeholders. | PASS |
| III. Operational Credibility and Risk | Base operational estimates on supplied geography and depth; connect material risks to safeguards without guaranteeing economics. | PASS |
| IV. Complete, Consistent AFE Output | Preserve the required AFE headings, tables, narrative, sign-off roles, and no-preface format. | PASS |
| V. Verified and Maintainable Behavior | Define repeatable acceptance scenarios and retain the existing PRD and app instructions as requirements. | PASS |

No constitution violations or unjustified complexity are identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-afe-document-generation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── afe-generation.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/
├── AFEinstructions.md
├── prd.md
└── skills/
    └── speckit-*/
.specify/
└── memory/
    └── constitution.md
specs/
└── 001-afe-document-generation/
```

**Structure Decision**: This repository has no application source tree, package manifest,
or test runner. The feature is scoped as a Copilot Chat document-generation workflow, so
the plan adds design and validation documents under the active feature directory and
does not invent a `src/`, service, database, or deployment structure. Changes to the
generator's operative prompt files remain an implementation-phase decision guided by
these contracts.

## Complexity Tracking

No constitution violations; no additional projects, services, or abstractions are
proposed.
