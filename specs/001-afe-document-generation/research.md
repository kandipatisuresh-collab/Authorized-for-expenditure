# Research: AFE Document Generation

## Decision: Treat the current feature as a Copilot Chat workflow

**Rationale**: The repository contains AFE prompt/instruction Markdown and the GitHub
Copilot Spec Kit integration, but no application source, package manifest, deployment
configuration, data store, or test runner. Copilot Chat is the evidenced user surface.
The plan therefore specifies a document-generation workflow and does not assume a
separate web application or programming language.

**Alternatives considered**:

- Build a web application: no UI, framework, or deployment requirements are supplied.
- Build a command-line utility: no command interface or local runtime requirements are
  supplied.

## Decision: Treat the request as the source of project facts

**Rationale**: No vendor pricing, quote database, joint operating agreement, or economic
data integration exists in the project. Estimates may use realistic defaults only when
geography and target depth give adequate context; unknown identities and unsupported
values remain placeholders.

**Alternatives considered**:

- Query external pricing or vendor sources: no source, authority, geography coverage, or
  update policy is specified, so externally retrieved prices could not be represented as
  audit-ready facts.
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
The contract describes observable chat input and output without imposing an API or
implementation architecture that the repository does not have.

**Alternatives considered**:

- Define an HTTP or serialized-data API: there is no service or external machine
  interface in scope.

## Unresolved implementation choices

The precise application form and technology stack remain outside the approved
prompt-driven scope. If the owner intends a standalone software product rather than a
Copilot Chat workflow, scope and platform must be established before implementation.
No remaining uncertainty prevents the document-generation contract or validation guide.
