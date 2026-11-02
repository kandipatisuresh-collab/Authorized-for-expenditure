# Feature Specification: AFE Document Generation

**Feature Branch**: `001-afe-document-generation`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: Generate a comprehensive, audit-ready Authorization for Expenditure (AFE) from raw oil and gas project details, following `.github/prd.md` and `.github/AFEinstructions.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate a Complete AFE (Priority: P1)

As an oil and gas project engineer or petroleum financial analyst, I provide project and
well details and receive a professional AFE that stakeholders can review as a project cost
baseline.

**Why this priority**: Producing the complete, reconciled AFE is the core user outcome.

**Independent Test**: Provide a well-defined project with cost and partner details and
verify that one response contains all required AFE sections, line items, and reconciled
totals.

**Acceptance Scenarios**:

1. **Given** project details that include the well objective, location, depth, costs, and
   working interests, **When** the user requests an AFE, **Then** the response starts
   directly with `# AUTHORIZATION FOR EXPENDITURE (AFE)` and includes the required
   operational header, partner schedule, cost tables, financial summary, justification,
   and approvals.
2. **Given** IDC and TDC line items and contingency percentages, **When** the AFE is
   generated, **Then** each extension and subtotal is calculated correctly and the grand
   total equals IDC plus TDC.
3. **Given** valid partner working interests, **When** the AFE is generated, **Then** each
   net exposure is calculated from the gross total and the interests and exposures
   reconcile to the provided participation.
4. **Given** IDC and TDC pre-contingency subtotals and stated contingency percentages,
   **When** the AFE is generated, **Then** each contingency is applied once to its
   corresponding category subtotal and its percentage is shown.

---

### User Story 2 - Complete Missing Operational Estimate Details (Priority: P2)

As an AFE preparer, I want missing drilling and completion cost inputs clearly marked
pending unless I provide values or an approved benchmark, so the estimate does not present
unsupported prices as credible defaults.

**Why this priority**: Raw project requests may omit operational details, and unsupported
cost assumptions could misstate the expenditure baseline.

**Independent Test**: Omit rig rates and casing quantities from a request that includes
geography and target depth; verify that those values remain pending without a
user-provided/approved benchmark and that project identities remain explicit placeholders.

**Acceptance Scenarios**:

1. **Given** geography and target depth but omitted cost inputs and no approved benchmark,
   **When** the AFE is generated, **Then** those cost values remain pending and are not
   inferred from context alone.
2. **Given** missing partner names, working interests, or approver identities, **When** the
   AFE is generated, **Then** those facts are left as explicit placeholders and are not
   invented.
3. **Given** insufficient location or depth context for a credible operational default,
   **When** the AFE is generated, **Then** unsupported operational values are not
   fabricated.
4. **Given** cost inputs that cannot be used or working interests that do not total 100%,
   **When** the AFE is generated, **Then** the affected values are identified as
   inconsistent and are not silently changed or presented as reconciled.
5. **Given** a cost amount that is missing and no user-provided or approved benchmark is
   available, **When** the AFE is generated, **Then** the amount is shown as an explicit
   placeholder rather than as zero.

---

### User Story 3 - Review Scope, Risk, and Approvals (Priority: P3)

As an internal or joint-venture stakeholder, I want to review the purpose, material
operational risks, economic assumptions, and approval routing alongside the estimate so I
can assess the proposal before sanction.

**Why this priority**: Stakeholders need the technical and approval context to interpret
the cost baseline and make an informed decision.

**Independent Test**: Generate an AFE for a project with an objective and identified
hazards; verify that the narrative links the objective, risks, mitigations, and stated
economic assumptions and that approval roles are present.

**Acceptance Scenarios**:

1. **Given** an objective and material risks, **When** the AFE is generated, **Then** the
   justification covers the objective, geological or execution risks, budgeted safeguards,
   and economic assumptions without guaranteeing results.
2. **Given** any project request, **When** the AFE is generated, **Then** the sign-off
   block includes prepared-by, operations/engineering review, finance/joint-interest
   accounting review, and executive approval roles.

### Edge Cases

- When costs are supplied without units or quantities, use lump-sum presentation where
  appropriate; do not imply an unsupported unit rate.
- When a requested cost has no provided amount, use an explicit pending-input placeholder
  unless the user supplies a supported value; never treat it as zero.
- When supplied working interests do not total 100%, do not silently normalize them;
  identify the inconsistency in the affected schedule.
- When a cost or percentage is negative, malformed, or otherwise unusable, do not include
  it as a valid estimate or silently replace it with zero.
- When measured depth, true vertical depth, units, or dates are absent, do not infer
  precise values from unrelated project details.
- When a calculated amount rounds for display, ensure the displayed category and grand
  totals still reconcile to the displayed line items.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST generate one AFE document from the project details supplied
  in the user's request.
- **FR-002**: The AFE MUST begin with the required AFE title and contain the general and
  operational header fields defined in `.github/prd.md`.
- **FR-003**: The AFE MUST include a partner participation schedule with owner, working
  interest, net cost exposure, and non-consent option fields.
- **FR-004**: The AFE MUST organize drilling and completion estimates into separate IDC
  and TDC tables and include the required cost codes and line-item descriptions defined
  in `.github/prd.md`.
- **FR-005**: The system MUST calculate line-item extensions, contingencies, category
  subtotals, and the grand total accurately. The grand total MUST equal total IDC plus
  total TDC.
- **FR-006**: Each contingency MUST state its percentage and apply to the corresponding
  pre-contingency category subtotal. It MUST NOT be included in that subtotal more than
  once.
- **FR-007**: When partner interests are provided and total 100%, the system MUST
  calculate each partner's net exposure from the gross AFE total and ensure the displayed
  exposures reconcile to the gross total.
- **FR-008**: The system MUST use user-supplied cost inputs or an explicitly provided or
  approved benchmark for numeric cost estimates. Geography and target depth alone MUST NOT
  be used to infer missing prices or quantities; absent a supported basis, the affected
  inputs MUST remain pending.
- **FR-009**: The system MUST NOT invent partner interests, named vendors, approvers,
  dates, or other project-specific facts as though they were provided or confirmed.
- **FR-010**: The AFE MUST include a 2–3 paragraph justification and operational scope
  that covers the objective, material geological or execution risks and mitigations, and
  economic assumptions where supplied or reasonably estimable.
- **FR-011**: The AFE MUST include prepared-by, operations/engineering review,
  finance/joint-interest accounting review, and executive approval sign-off fields.
- **FR-012**: The response MUST use professional Markdown headings, tables, and bullets;
  it MUST NOT include introductory filler or process commentary before the AFE title.
- **FR-013**: The system MUST preserve the distinction between user-provided data,
  calculated values, and unresolved inputs, without presenting projected production or
  return assumptions as guaranteed outcomes.
- **FR-014**: The system MUST flag internally inconsistent cost inputs or participation
  percentages rather than silently correcting, normalizing, or concealing them.

### Key Entities *(include if feature involves data)*

- **AFE Project**: A proposed oil and gas expenditure, including project identity,
  operator, area, classification, target, schedule, and well depths.
- **Working-Interest Participant**: An operator or partner with a stated participation
  percentage, associated net cost exposure, and non-consent option status.
- **AFE Cost Line**: A coded IDC or TDC estimate with description, units or quantity,
  unit cost when applicable, gross amount, and contingency treatment.
- **AFE Summary**: Reconciled IDC, TDC, and grand-total amounts, with the currency and
  presentation precision used in the document.
- **Operational Justification**: The project objective, risks, safeguards, and economic
  assumptions supporting the proposed expenditure.
- **Approval Record**: A required preparation, review, or approval role and its
  corresponding name, title, and date fields.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a validation set of 100 valid cost schedules, 100% of displayed IDC,
  TDC, and grand totals reconcile to the displayed line items and contingency amounts.
- **SC-002**: In 100 generated AFE documents, 100% contain all five required sections,
  the required IDC and TDC tables, and the four required approval roles.
- **SC-003**: In every test case with valid partner interests summing to 100%, displayed
  partner exposures reconcile to the gross AFE total within the document's stated
  currency precision.
- **SC-004**: In 100 requests with omitted numeric cost inputs and no approved benchmark,
  100% of those inputs remain explicitly pending and are not represented as numeric
  estimates.
- **SC-005**: In 100 test cases with unknown partner or approval identities, no generated
  document presents an invented identity as a confirmed fact.

## Assumptions

- The primary users are project engineers, petroleum financial analysts, and stakeholders
  reviewing a proposed AFE.
- The source of project facts and numeric costs is the user's request or a benchmark
  explicitly provided/approved by the user; no external price database, vendor quote, or
  joint operating agreement is assumed.
- Costs are denominated in USD unless the user specifies another currency.
- Contingencies are calculated against the applicable IDC or TDC pre-contingency subtotal.
- When required project-specific information is unavailable, the document uses an
  explicit placeholder rather than inventing the fact or silently treating an unknown
  amount as zero.
- The initial scope is generating the AFE document. Electronic routing, signatures,
  approval workflow, persistence, and integration with accounting or vendor systems are
  out of scope.
