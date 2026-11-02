# Data Model: AFE Document Generation

This is a conceptual model for the document contract; it does not prescribe persistence
or implementation types.

## AFE Project

Represents one proposed expenditure.

| Field | Meaning | Validation |
|---|---|---|
| AFE number | Unique tracking identifier for the estimate | Generate a tracking value; do not imply it was externally assigned |
| Project/well name | Name supplied for the proposal | Preserve the supplied name; use a placeholder when absent |
| Operator | Operating company | Do not invent a confirmed company identity |
| Area/asset group | Geographic or asset context | Use supplied context for estimates; do not infer precise location |
| Classification | Exploration, development, workover, or facility | Must be consistent with stated scope |
| Target/objective | Target formation or project objective | Preserve supplied objective |
| Spud date and TD duration | Schedule assumptions | Label estimated dates/durations; do not present unknown dates as confirmed |
| MD and TVD | Well measured and vertical depths | Keep units explicit; do not infer missing depths |

## Working-Interest Participant

Represents an operator or partner participating in project costs.

| Field | Meaning | Validation |
|---|---|---|
| Owner | Participant name | Do not fabricate identity |
| Working interest | Percentage allocation | Validate numeric range and 100% aggregate when a complete schedule is supplied |
| Net cost exposure | Participant share of gross AFE | Calculate from gross AFE and interest; displayed exposures must reconcile |
| Non-consent option | Stated yes/no status | Preserve as supplied or use an explicit placeholder |

## AFE Cost Line

Represents one coded drilling or completion estimate.

| Field | Meaning | Validation |
|---|---|---|
| Cost code | IDC or TDC line identifier | Use the applicable code from the PRD schedule |
| Category | Intangible or tangible | Every line belongs to exactly one category |
| Description | Cost item | Retain required PRD line-item labels |
| Units/quantity | Days, length, per-job quantity, unit, or lump sum | Must be consistent with the unit cost |
| Unit cost | Cost per unit where applicable | Do not imply a unit price for a lump sum |
| Gross cost | Extended estimate for the line | Quantity multiplied by unit cost, or supported lump sum |
| Contingency | Category-specific percentage and amount | Apply once to the pre-contingency category subtotal |
| Estimate basis | User supplied, calculated, or pending input | Do not infer missing cost rates or quantities from geography/depth |

## AFE Summary

Represents the aggregate financial control totals.

| Field | Meaning | Validation |
|---|---|---|
| Total IDC | IDC line items plus IDC contingency | Must equal displayed IDC amounts |
| Total TDC | TDC line items plus TDC contingency | Must equal displayed TDC amounts |
| Grand total | Total IDC plus total TDC | Must reconcile exactly at displayed currency precision |
| Currency | Currency used in the estimate | Use USD unless the request specifies another currency |

## Operational Justification

Contains the project objective, geological and execution risks, budgeted safeguards, and
economic assumptions. Projected rates and returns are assumptions, not guaranteed
outcomes.

## Approval Record

Contains preparation, operations/engineering review, finance/joint-interest accounting
review, and executive approval roles, each with name, title, and date fields. Unknown
people or completed approvals must remain placeholders.
