# Implementation Plan: AFE Document Generation

**Branch**: `001-afe-document-generation` | **Date**: 2026-10-31 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from
[specs/001-afe-document-generation/spec.md](./spec.md)

## Summary

Deliver a dependency-free local AFE web app alongside the Copilot generation
instructions, governed by the existing AFE requirements and project constitution. The
app calculates only from user-supplied values; omitted cost inputs remain pending
because no approved pricing source is configured. The generated document must keep
estimates and assumptions distinguishable from supplied facts and reconcile IDC, TDC,
partner exposures, and the total.

## Technical Context

**Language/Version**: JavaScript on Node.js 18 or newer; browser-native HTML, CSS, and
JavaScript.

**Primary Dependencies**: Node.js built-in modules; no package dependencies.

**Storage**: None; the local app does not persist AFE records.

**Testing**: `node --test app/server.test.js` and
`tests/validate_afe_output.ps1`; independently recalculate displayed monetary totals.

**Target Platform**: Local browser on Windows, macOS, or Linux; Copilot instructions are
also maintained in `.github/`.

**Project Type**: Local web application and prompt-driven document-generation workflow.

**Performance Goals**: Produce a complete AFE in one response for a sufficiently
specified request; no latency target is established.

**Constraints**: Output is Markdown; no approved price, vendor, operating agreement, or
economic data source is established. Do not infer cost values from geography/depth,
imply missing values are zero, or invent confirmed project facts.

**Scale/Scope**: One AFE per request; no persistence, electronic routing, signature
execution, or accounting integration in the initial scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Financial Accuracy and Classification | Define separate IDC/TDC treatment and explicit reconciliation checks for contingencies, totals, and partner exposures. | PASS |
| II. Traceable Estimates and Assumptions | Distinguish user-supplied values, calculations, and unresolved inputs; require user-supplied costs. | PASS |
| III. Operational Credibility and Risk | Connect material risks to supplied safeguards without inventing costs or guaranteeing economics. | PASS |
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
.gitignore
app/
├── server.js
├── server.test.js
└── public/
    ├── app.js
    ├── index.html
    └── styles.css
tests/
├── validate_afe_output.ps1
└── fixtures/
    └── afe-valid.md
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

**Structure Decision**: Keep the existing dependency-free Node.js server and static
frontend. Do not add a package manifest, database, external pricing service, or new
deployment structure. Maintain the Copilot instruction and PRD files as the canonical
generation requirements.

## Complexity Tracking

No constitution violations; no additional projects, services, or abstractions are
proposed.
