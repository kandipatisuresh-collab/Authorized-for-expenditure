# AFE Builder

A dependency-free local web app for preparing Authorization for Expenditure (AFE)
documents. The Node.js backend serves the frontend, validates inputs, calculates IDC
and TDC contingencies and partner exposures, and generates a Markdown AFE for review.
No data is stored or sent to an external service.

## Requirements

- Node.js 18 or newer
- Windows PowerShell on Windows, or Bash on macOS/Linux

## Run on Windows

From PowerShell in this folder:

```powershell
.\run.ps1
```

If PowerShell script execution is restricted, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run.ps1
```

## Run with Bash

```bash
bash run.sh
```

The launcher starts the local server, waits for its health check, and opens the frontend
in the default browser. The app is available at `http://127.0.0.1:3000`. Press Ctrl+C in
the launcher terminal to stop it. Set `PORT` to use another local port.

## Use

1. Enter project and well information.
2. Add working-interest participants and complete the applicable cost and contingency
   inputs.
3. Add objective, risks, safeguards, economic assumptions, and any supplied approval
   details.
4. Choose **Generate AFE** to review the resulting Markdown.
5. Copy or download the document as `afe-output.md`.

Missing inputs remain pending. Category totals and participant exposures are only
calculated when the relevant inputs are complete and valid. This tool does not invent
operational estimates, vendor quotes, project identities, or approvals. Review all
assumptions and totals before using an AFE operationally.

## Tests

Run the built-in Node.js tests without installing packages:

```powershell
node --test app/server.test.js
```
