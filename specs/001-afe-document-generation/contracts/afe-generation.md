# AFE Generation Contract

## Request

The user provides raw oil and gas project details in Copilot Chat. Inputs may include
project/well identity, operator, location, classification, target, schedule, depths,
costs, cost units, contingencies, working-interest participants, objective, risks, and
economic assumptions. Any of these may be omitted.

## Response

Return one professional Markdown AFE document. The first line is:

```text
# AUTHORIZATION FOR EXPENDITURE (AFE)
```

The response contains the following sections, in this order:

1. General and operational header.
2. Partner participation schedule.
3. Cost estimate breakdown with distinct IDC and TDC tables and a financial summary.
4. Justification and operational scope.
5. Approval routing and sign-off blocks.

The cost tables use the PRD's required line items and codes. The response includes units,
quantities/durations, unit costs where meaningful, gross line costs, an estimate basis
(user-provided, calculated, estimated default, or pending input) for each cost, and
category contingency percentages. It does not add introductory or process commentary
before the AFE title.

## Financial invariants

- Each line extension equals quantity multiplied by unit cost, or a supported lump-sum
  amount.
- Each category contingency is calculated once from its corresponding pre-contingency
  subtotal.
- Total IDC equals IDC line items plus IDC contingency.
- Total TDC equals TDC line items plus TDC contingency.
- Grand total equals total IDC plus total TDC.
- If supplied, complete working-interest allocations total 100%; partner exposures are
  calculated from the gross total and reconcile at displayed currency precision.
- If currency rounding creates a residual in partner exposures, allocate it to the
  participant with the largest working interest and disclose the adjustment.
- Invalid or inconsistent values are identified rather than silently normalized or
  replaced with zero.

## Missing information and estimates

Use contextual operational defaults only when location/geography and target depth support
a credible estimate. Distinguish such estimates from user-supplied facts. Do not invent
partner interests, named vendors, people, dates, executed approvals, or unsupported
economic results. Use explicit placeholders for unknown values that cannot reasonably be
estimated; do not imply a missing cost is zero.

## Narrative and sign-off

The justification is 2–3 paragraphs and covers the project objective, relevant risks and
budgeted mitigations, and economic assumptions where supplied or responsibly estimable.
Include the four roles in the PRD approval routing. Names and signatures are not
represented as actual approvals unless supplied.
