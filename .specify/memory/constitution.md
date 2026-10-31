<!--
Sync Impact Report
Version change: unratified scaffold → 1.0.0 (initial ratification)
Modified principles: placeholder principles → I. Financial Accuracy and Classification;
  II. Traceable Estimates and Assumptions; III. Operational Credibility and Risk;
  IV. Complete, Consistent AFE Output; V. Verified and Maintainable Behavior
Added sections: AFE Domain Constraints; Quality and Delivery
Removed sections: none
Follow-up TODOs: none
-->

# AFE Management Application Constitution

## Core Principles

### I. Financial Accuracy and Classification
Every estimate MUST distinguish Intangible Drilling/Completion Costs (IDC) from Tangible
Drilling/Completion Costs (TDC). Each line item, subtotal, contingency, partner exposure,
and grand total MUST reconcile arithmetically to the displayed values. Costs MUST NOT be
duplicated across categories, and contingency MUST identify its applicable cost base and
percentage.

### II. Traceable Estimates and Assumptions
Estimates MUST include meaningful units, quantities or durations, and unit costs wherever
applicable. When the user omits operational details, the system MUST use credible defaults
appropriate to the stated geography, target depth, and project scope. It MUST NOT present
unknown vendor identities, partner interests, approvals, or economic outcomes as confirmed
facts.

### III. Operational Credibility and Risk
AFE content MUST be consistent with the stated well objective, classification, target
formation, and measured or vertical depth. The operational scope MUST address material
geological and execution risks and connect them to budgeted safeguards. Production rates,
ROI benchmarks, and other economic assumptions MUST not be represented as guaranteed
results.

### IV. Complete, Consistent AFE Output
The final document MUST use the required AFE structure: operational header, partner
participation schedule, separate IDC and TDC tables, reconciled financial summary,
operational justification, and approval routing. It MUST use clear Markdown tables and
professional language, start with the AFE header, and omit introductory or process
commentary.

### V. Verified and Maintainable Behavior
Changes to AFE generation MUST preserve the project requirements in `.github/prd.md` and
`.github/AFEinstructions.md`. Automated checks MUST cover financial calculations and
required output structure when those behaviors change. Invalid or incomplete inputs MUST
not produce success-shaped results that conceal calculation errors or unsupported facts.

## AFE Domain Constraints

- Working-interest percentages and net cost exposures MUST be consistent with the gross
  AFE total; partner allocations MUST reconcile to 100% when interests are provided.
- Values derived from user input or calculated by the system MUST retain sufficient
  precision for correct totals; displayed rounding MUST not create unreconciled summaries.
- AFE identifiers MUST be unique tracking values, not represented as externally assigned
  identifiers unless the user supplies them.
- Missing facts MUST be handled with realistic estimates or explicit placeholders according
  to the output requirements; the system MUST NOT invent named people or executed approvals.

## Quality and Delivery

- Before returning an AFE, verify all line-item extensions, contingencies, subtotals,
  financial summary totals, and partner exposures.
- Verify that the required headings, tables, and approval roles are present and that the
  document contains no contradictory values.
- Keep changes focused on the requested behavior and update directly related requirements
  documentation when behavior or output requirements change.

## Governance

This constitution governs AFE product behavior and supersedes conflicting implementation
conventions. Amendments MUST be made in `.specify/memory/constitution.md`, reviewed against
the AFE requirements, and reflected in the version and amendment date below. Use semantic
versioning: MAJOR for incompatible principle changes, MINOR for new principles or material
requirements, and PATCH for clarifications that do not change governance. Reviewers MUST
check material changes for compliance with these principles and the referenced AFE
requirements before approval.

**Version**: 1.0.0 | **Ratified**: 2026-10-31 | **Last Amended**: 2026-10-31
