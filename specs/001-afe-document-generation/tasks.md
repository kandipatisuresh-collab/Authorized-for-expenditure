# Tasks: AFE Document Generation

**Input**: Design documents from `specs/001-afe-document-generation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/afe-generation.md`, and `quickstart.md`

**Tests**: No automated test suite or runtime exists in this prompt-driven project.
Verification tasks use the documented Copilot Chat scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by the three user stories in `spec.md`. The
implementation surface is the existing Copilot instruction and PRD documents, not a new
application codebase.

## Phase 1: Setup

**Purpose**: Confirm the existing project setup and implementation scope.

- [X] T001 Verify the Copilot generation instructions in `.github/AFEinstructions.md`, source requirements in `.github/prd.md`, and active feature state in `.specify/feature.json` before making story changes.

## Phase 2: Foundational

**Purpose**: Establish one consistent source of truth for the AFE output contract.

- [X] T002 Update `.github/AFEinstructions.md` to identify `.github/prd.md` as the canonical AFE section and line-item requirements, while retaining the instruction file's output-only response rule.

**Checkpoint**: Existing Copilot workflow and its source requirements are confirmed and
aligned; user-story work can proceed.

## Phase 3: User Story 1 - Generate a Complete AFE (Priority: P1) - MVP

**Goal**: Produce a complete AFE with required sections, correct IDC/TDC classification,
and reconciled financial and partner totals.

**Independent Test**: Use a request with complete project, cost, contingency, and partner
data. Verify required headings and tables, every line extension, category totals,
contingencies, grand total, and partner exposures using
`specs/001-afe-document-generation/quickstart.md`.

### Implementation

- [X] T003 [US1] Align the AFE template, operational header, participant schedule, cost codes, and IDC/TDC line-item tables in `.github/AFEinstructions.md` with the canonical structure in `.github/prd.md`.
- [X] T004 [P] [US1] Clarify in `.github/prd.md` that line extensions, IDC/TDC pre-contingency subtotals, category contingencies, summary totals, and the grand total must reconcile at displayed currency precision.
- [X] T005 [US1] Specify in `.github/AFEinstructions.md` that each contingency is calculated once against its matching pre-contingency category subtotal and that partner exposures use the gross AFE and reconcile when provided interests total 100%.
- [X] T006 [US1] Validate the complete-input scenario in `specs/001-afe-document-generation/quickstart.md` by checking a generated AFE's line extensions, contingencies, IDC/TDC totals, grand total, and partner exposures.

**Checkpoint**: A complete-input request produces the required AFE structure and
reconciled financial schedule.

## Phase 4: User Story 2 - Complete Missing Operational Estimate Details (Priority: P2)

**Goal**: Use plausible contextual estimates without inventing confirmed project facts or
concealing missing amounts.

**Independent Test**: Use one request with geography and target depth but omitted rig and
casing details, and a second with insufficient estimate context and missing identities.
Verify contextual estimates are identifiable as estimates and unsupported facts remain
explicitly unresolved.

### Implementation

- [X] T007 [US2] Update `.github/AFEinstructions.md` to use operational defaults only when geography and target depth support them, distinguish defaults from supplied facts, and preserve placeholders for unknown identities and unsupported costs.
- [X] T008 [P] [US2] Align `.github/prd.md` missing-input requirements so unknown costs are not treated as zero and partner interests, vendors, approvers, dates, and other project facts are not invented as confirmed.
- [ ] T009 [US2] Validate the missing-information scenarios in `specs/001-afe-document-generation/quickstart.md`, including inadequate context, missing partner/approval identities, and incomplete or invalid cost inputs.

**Checkpoint**: Missing information is either filled with context-appropriate estimates
or represented explicitly without false certainty.

## Phase 5: User Story 3 - Review Scope, Risk, and Approvals (Priority: P3)

**Goal**: Give reviewers the project objective, material risks and mitigations, economic
assumptions, and approval routing needed to assess the proposal.

**Independent Test**: Use a request that identifies the objective and material hazards.
Verify the 2–3 paragraph justification addresses scope, risks, safeguards, and economic
assumptions, and that every required approval role is present without invented signers.

### Implementation

- [X] T010 [US3] Refine the justification and sign-off guidance in `.github/AFEinstructions.md` to require the project objective, material risks and budgeted mitigations, non-guaranteed economic assumptions, and all four approval roles.
- [X] T011 [P] [US3] Confirm `.github/prd.md` specifies the same justification length, narrative topics, and prepared-by, operations/engineering, finance/joint-interest accounting, and executive approval fields.
- [ ] T012 [US3] Validate the narrative and approval scenarios in `specs/001-afe-document-generation/quickstart.md`; ensure unknown names and completed approvals are not fabricated.

**Checkpoint**: Stakeholders can assess the operational case and routing without
mistaking forecasts or placeholders for confirmed facts.

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Verify the integrated instructions against the specification and all
user-facing scenarios.

- [X] T013 Review `.github/AFEinstructions.md` and `.github/prd.md` against `specs/001-afe-document-generation/contracts/afe-generation.md`; resolve any contradictory headings, line items, calculation rules, or missing-information behavior.
- [ ] T014 Run all applicable scenarios in `specs/001-afe-document-generation/quickstart.md` and record failures or required instruction corrections in the affected source file.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on setup confirmation; blocks story implementation
  to ensure the instruction file uses the PRD as its source of required output structure.
- **User Story 1 (Phase 3)**: Depends on the foundational alignment; establishes the
  complete document and financial behavior.
- **User Story 2 (Phase 4)**: Depends on the established AFE output structure so
  missing-data behavior can be applied consistently to its fields and cost lines.
- **User Story 3 (Phase 5)**: Depends on the established document structure so narrative
  and approval fields are integrated in the required locations.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: First implementation increment and MVP; depends on Phase 2.
- **US2 (P2)**: Follows US1 to apply missing-input rules to the complete AFE template.
- **US3 (P3)**: Follows US1 to apply narrative and approval requirements to the complete
  AFE template.

### Parallel Opportunities

- Within US1, T004 may run in parallel with T003 because they edit different files; T005
  follows the foundational task and should be coordinated with T003 because both update
  `.github/AFEinstructions.md`.
- Within US2, T008 may run in parallel with T007 because they edit different files.
- Within US3, T011 may run in parallel with T010 because they edit different files.
- Story implementation should otherwise proceed sequentially because the core
  `.github/AFEinstructions.md` is shared and each story extends the same output contract.
- Validation tasks follow their corresponding instruction and PRD edits.

## Implementation Strategy

### MVP First (User Story 1)

1. Complete setup and foundational alignment.
2. Complete US1 changes to the AFE structure and financial calculations.
3. Validate a complete request with `quickstart.md` before expanding scope.

### Incremental Delivery

1. Add US2 missing-input behavior and validate estimates and placeholders.
2. Add US3 narrative and approval behavior and validate the stakeholder-facing sections.
3. Run all documented scenarios and reconcile both prompt files against the contract.

## Notes

- Every task uses the required checkbox, sequential ID, optional parallel marker, story
  label for story tasks, and concrete file path.
- No application runtime, package, or deployment tasks are proposed because the
  repository defines this feature as a Copilot Chat prompt workflow. T015 adds a
  standalone PowerShell validator for deterministic AFE output checks.
- `[P]` tasks operate on separate files and have no prerequisite task in their phase.
- The arithmetic fixture and output contract were checked statically in this environment.
  The runnable prompts and expected checks are documented in
  `specs/001-afe-document-generation/quickstart.md`. The validator self-tests cover
  invalid negative costs, non-100% interests, and pending costs, but T006, T009, T012,
  and T014 remain unchecked until the prompts are run against the Copilot Chat
  instruction files and the resulting responses are inspected; this environment cannot
  invoke the VS Code Copilot Chat UI directly.

## Phase 7: Convergence

- [x] T015 Add automated AFE output checks for required sections, IDC/TDC line extensions and contingencies, grand-total reconciliation, partner exposures, and missing-input handling in `tests/validate_afe_output.ps1` per Constitution V (partial).
