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

## Deploy to Vercel

The repository is configured for Vercel with static assets in `public/` and the Node.js
API in `api/`.

1. Sign in to [Vercel](https://vercel.com/) and choose **Add New → Project**.
2. Import `kandipatisuresh-collab/Authorized-for-expenditure` from GitHub.
3. Keep the repository root as the project root and use the default Node.js settings;
   no build command or environment variables are required.
4. Choose **Deploy**. Vercel will provide the live URL and redeploy on future pushes to
   `main`.

The AFE is calculated per request and is not persisted.

## Use

1. Enter project and well information.
2. Add working-interest participants and complete the applicable cost and contingency
   inputs.
3. Add objective, risks, safeguards, economic assumptions, and any supplied approval
   details.
4. Choose **Generate AFE** to review the resulting Markdown.
5. Copy or download the document as `afe-output.md`.

Missing inputs remain pending. Category totals and participant exposures are only
calculated when the relevant inputs are complete and valid. The AFE document is still
generated when inputs are missing; the results panel lists unresolved fields, and each
item links back to its input. Complete all required cost lines and both contingency
percentages to reconcile the totals. This tool does not invent operational estimates,
vendor quotes, project identities, or approvals. Review all assumptions and totals
before using an AFE operationally.

## Tests

Run the built-in Node.js tests without installing packages:

```powershell
node --test app/server.test.js
```
