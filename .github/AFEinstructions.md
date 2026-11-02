# AFE App Instructions

Generate a comprehensive, technically credible Authorization for Expenditure (AFE) from
the user's oil and gas project details. Treat [.github/prd.md](./prd.md) as the
canonical source for the required headings, fields, cost codes, line items, and table
structure. Keep this instruction file consistent with that PRD.

## Generation Rules

- Return only the final AFE document. Start with `# AUTHORIZATION FOR EXPENDITURE (AFE)`
  and do not add introductory or process commentary.
- Preserve the distinction between user-provided facts, calculated amounts, benchmark-
  based estimates, and unresolved inputs. Identify the source of each benchmark-based
  estimate; do not present assumed vendors, quotes, dates, partner interests, approvals,
  or economic outcomes as confirmed facts.
- Use `Not provided` for the project/well name unless the user supplies one. Do not
  create a descriptive name from the target, basin, objective, or test-fixture details.
  A generated AFE tracking reference is not a project or well name.
- Do not infer rig rates, casing quantities, or other numeric cost inputs from geography
  and depth alone. Use amounts supplied by the user or an explicitly provided/approved
  benchmark; otherwise retain an explicit pending-input placeholder and do not claim the
  AFE is fully reconciled.
- Do not silently normalize invalid costs or working-interest percentages. Identify the
  affected inputs and state when totals or partner exposures cannot be reconciled.
- Show USD unless the user supplies another currency. Use consistent currency precision
  and check the values as displayed.
- Complete the Estimate Basis column for each cost line as user-provided, calculated,
  benchmark-based estimate, or pending input. For estimates, identify the source and
  assumptions used.

## Financial Controls

- Classify every estimate exactly once as Intangible Drilling/Completion Cost (IDC) or
  Tangible Drilling/Completion Cost (TDC), using the PRD's cost codes.
- Extend quantity-based items as quantity multiplied by unit cost. Present supported
  lump sums without implying unsupported quantities or unit rates.
- Calculate each IDC/TDC contingency once from its corresponding pre-contingency subtotal;
  state the percentage and basis.
- Recalculate each category subtotal including its contingency. The grand total must
  equal total IDC plus total TDC.
- When complete working interests are provided and total 100%, calculate net exposures
  from the gross AFE and verify their sum. If currency rounding causes a residual cent,
  assign the rounding residual to the participant with the largest working interest and
  disclose the adjustment in the schedule or its notes; never hide a difference.

## Required Document

Use the five sections and exact cost-line structure in `.github/prd.md`: operational
header; partner participation schedule; separate IDC and TDC estimates and financial
summary; 2–3 paragraph justification and operational scope; and approval routing.
Include the project objective, material risks and budgeted safeguards, and supported
economic assumptions without guaranteeing results. Keep unknown names and sign-offs as
placeholders, not completed approvals.

Before responding, verify every line extension, contingency, IDC/TDC subtotal, grand
total, and partner exposure, as well as all required headings and approval roles.
