# Research: AFE Document Generation

## Decision: Keep the local AFE Builder and Copilot instructions aligned

**Rationale**: The repository contains a dependency-free local AFE web app, AFE
prompt/instruction Markdown, and the GitHub Copilot Spec Kit integration. The app is the
local user surface; the PRD and instruction file remain the canonical output contract.

**Alternatives considered**:

- Add a separate service or framework: no such dependencies are needed for the current
  local workflow.
- Treat the prompt instructions and app as separate products: this risks inconsistent
  financial controls and missing-input behavior.

## Decision: Treat user-supplied values as the only cost basis

**Rationale**: No approved price book, vendor quote, joint operating agreement, or
economic data integration exists in the project. Geography and target depth do not
establish a monetary rate, so omitted cost values remain pending until supplied by the
user.

**Alternatives considered**:

- Add external pricing or vendor sources: no source, authority, geography coverage, or
  update policy is specified, so retrieved prices could not be represented as audit-ready
  facts.
- Treat omitted cost amounts as zero: this would understate the expenditure and conceal
  missing information.

## Decision: Validate arithmetic from displayed values and amounts

**Rationale**: IDC and TDC category subtotals, contingencies, the grand total, and partner
exposures are the core financial controls in the PRD and constitution. The specification
requires explicit calculations and reconciliation at the document's displayed currency
precision.

**Alternatives considered**:

- Validate only that summary values are present: presence does not detect double-counted
  contingency, incorrect line extensions, or unreconciled partner allocations.

## Decision: Use a user-facing Markdown document contract

**Rationale**: The PRD requires a Markdown AFE with a fixed heading and table structure.
The contract keeps the local app and Copilot instructions aligned on the same observable
input and output without introducing an external service or data interface.

**Alternatives considered**:

- Define an external API or serialized-data contract: there is no external integration
  in scope.

## Unresolved implementation choices

No approved price book or vendor data source is configured; omitted numeric costs remain
pending until supplied by the user. Copilot Chat prompt responses still require
interactive validation in VS Code, while the local application and output contract have
automated coverage.
