# Quickstart: AFE Generation Validation

## Prerequisites

- GitHub Copilot Chat is available in VS Code.
- The project AFE requirements are available in `.github/prd.md` and
  `.github/AFEinstructions.md`.
- The active feature specification and generation contract are
  [spec.md](./spec.md) and [contracts/afe-generation.md](./contracts/afe-generation.md).

## Validate a complete request

1. In Copilot Chat, submit this deterministic test request (all project facts below are
   test inputs, not real project data):

   ```text
   Prepare an AFE for validation fixture AFE-QS-001.
   Operator: Test Operator; area: Permian Basin, Texas; classification: Development;
   target: Bone Spring; spud date: 2026-12-01; estimated days to TD: 20;
   MD: 10,000 feet; TVD: 8,000 feet. Currency: USD.
   Use 10% IDC and 10% TDC contingency. Working interests: Test Operator 60%,
   Test Partner 40%. Non-consent options: not provided.
   Use these gross line costs (quantity x unit rate where a quantity is stated):
   IDC 101 location/roads/pit: lump sum $85,000;
   IDC 102 rig: 20 days x $40,000/day;
   IDC 103 fuel/power: 20 days x $4,000/day;
   IDC 104 fluids: lump sum $120,000;
   IDC 105 cementing: 1 job x $65,000/job;
   IDC 106 directional: 20 days x $3,500/day;
   IDC 107 wireline: 1 run x $48,000/run;
   IDC 108 mud logging: 20 days x $1,500/day;
   IDC 109 supervision: 20 days x $1,800/day.
   TDC 201 surface casing: 2,000 feet x $45/foot;
   TDC 202 intermediate casing: 5,000 feet x $65/foot;
   TDC 203 production casing: 8,000 feet x $40/foot;
   TDC 204 wellhead: 1 unit x $120,000/unit;
   TDC 205 subsurface equipment: lump sum $95,000;
   TDC 206 surface facilities: lump sum $300,000.
   Objective: evaluate the Bone Spring development target.
   Risks: potential lost circulation and uncertain formation pressure.
   Safeguards included in this validation fixture: monitored mud program and
   contingency funds. No production-rate or ROI forecast is supplied.
   Do not invent vendor, approver, or non-consent details.
   ```

2. Confirm the response begins with `# AUTHORIZATION FOR EXPENDITURE (AFE)` and contains
   all five required sections, IDC/TDC cost tables, financial summary, justification, and
   four approval roles. Project and partner names above are test inputs; missing
   non-consent, vendor, approver, and economic values must remain unresolved.
3. Independently recalculate every quantity-by-unit-cost extension and category
   contingency.
4. Verify that total IDC plus total TDC equals the grand total exactly at the displayed
   currency precision.
5. Recalculate each participant's net exposure and verify the displayed exposures
   reconcile to the gross AFE total.

### Repeatable arithmetic fixture

Use the following supplied gross line costs and 10% IDC/TDC contingency rates to make the
financial check repeatable. For quantity-based rows, provide both the quantity and unit
rate:

| Category | Line item | Quantity | Unit cost ($) | Gross cost ($) |
|---|---|---:|---:|---:|
| IDC | Location, roads, and pit site prep | Lump sum | - | 85,000 |
| IDC | Daywork rig rental | 20 days | 40,000 | 800,000 |
| IDC | Fuel and power | 20 days | 4,000 | 80,000 |
| IDC | Drilling fluids and mud chemicals | Lump sum | - | 120,000 |
| IDC | Cementing services and surface materials | 1 job | 65,000 | 65,000 |
| IDC | Directional drilling services and tools | 20 days | 3,500 | 70,000 |
| IDC | Wireline logging and formation evaluation | 1 run | 48,000 | 48,000 |
| IDC | Mud logging services | 20 days | 1,500 | 30,000 |
| IDC | Supervision and engineering oversight | 20 days | 1,800 | 36,000 |
| TDC | Surface casing | 2,000 feet | 45 | 90,000 |
| TDC | Intermediate casing | 5,000 feet | 65 | 325,000 |
| TDC | Production casing/liner | 8,000 feet | 40 | 320,000 |
| TDC | Wellhead equipment and Christmas tree | 1 unit | 120,000 | 120,000 |
| TDC | Subsurface production equipment | Lump sum | - | 95,000 |
| TDC | Surface facilities and storage tanks | Lump sum | - | 300,000 |

Expected checks: IDC pre-contingency subtotal **$1,334,000**, IDC contingency
**$133,400**, and total IDC **$1,467,400**. TDC pre-contingency subtotal **$1,250,000**,
TDC contingency **$125,000**, and total TDC **$1,375,000**. The grand total is
**$2,842,400**. For supplied working interests of 60% and 40%, net exposures are
**$1,705,440** and **$1,136,960**, respectively, summing to the grand total.

## Validate missing and inconsistent inputs

1. Submit: `Prepare an AFE for a development well in the Permian Basin, Texas, targeting
   the Bone Spring at 10,000 ft MD and 8,000 ft TVD. Estimate omitted rig-rate and casing
   inputs only if these details provide a responsible basis; identify any defaults as
   estimates with their assumptions. The project/well name is not provided. Do not
   invent vendors or quotes.` Verify that any numeric defaults have a clear estimate
   basis and are not represented as quotes, and that the name remains `Not provided`.
2. Submit: `Prepare an AFE for an exploration well. Operator, area, target, depths, date,
   costs, partner interests, partner names, and approvers are not provided.` Verify that
   these unknown values are not invented, missing costs are not zero, and the AFE does not
   claim fully reconciled totals.
3. Submit: `Prepare an AFE for a well. I need casing sizes and a rig rate. No location,
   target, measured depth, true vertical depth, drilling duration, cost input, or vendor
   quote is available. Do not invent operational details or use unsupported defaults.`
   Verify casing and rig-rate values remain unresolved rather than fabricated.
4. Submit: `Prepare an AFE. Working interests are Test Operator 60% and Test Partner
   30%. The rig cost (IDC code 102) is -$40,000. Surface facilities (TDC code 206) have
   no amount, quote, or estimate basis. Do not normalize or replace any input.`
   Verify the 90% participation total, negative cost, and pending surface-facilities
   amount are explicit; affected totals and exposures must not be presented as reconciled.
5. Submit: `Prepare an AFE for a development well. Objective: evaluate the supplied
   target. Material hazards: potential lost circulation and uncertain formation
   pressure. Safeguards: monitored mud program and contingency funds. No target name,
   location, well name, costs, signatory names, production rate, or ROI are provided.
   Do not invent them.`
   Verify the narrative uses only these facts and identities and economic outcomes remain
   unresolved.

## Expected result

The output satisfies the [AFE Generation Contract](./contracts/afe-generation.md), all
mandatory scenarios in [spec.md](./spec.md), and the project requirements. Any failure
in arithmetic, required sections, or unsupported-fact handling is a validation failure.

## Automated output validator

Run the validator self-tests from the workspace root in PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests\validate_afe_output.ps1 -SelfTest
```

The self-test must accept the complete fixture, reject an incorrect contingency and
invalid negative-cost/working-interest inputs, accept an explicitly pending cost only
when the grand total is also unresolved, and reject a numeric grand total when a cost
remains pending.

To check a generated AFE saved as Markdown:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests\validate_afe_output.ps1 -Path .\afe-output.md
```

For a document that intentionally contains pending cost inputs, add
`-AllowPendingInputs`. The validator then requires explicit unresolved status, pending
partner exposures, and no numeric grand total. A complete document must reconcile every
required cost code, quantity extension, category contingency, financial summary, and
working-interest exposure.
