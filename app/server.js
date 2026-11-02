const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "..", "public");
const MAX_BODY_BYTES = 1024 * 1024;
const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "127.0.0.1";

const COSTS = [
  { code: 101, category: "IDC", description: "Location, Roads, & Pit Site Prep", kind: "lump" },
  { code: 102, category: "IDC", description: "Daywork Rig Rental", kind: "quantity", unit: "days", rateUnit: "day" },
  { code: 103, category: "IDC", description: "Fuel & Power", kind: "quantity", unit: "days", rateUnit: "day" },
  { code: 104, category: "IDC", description: "Drilling Fluids & Mud Chemicals", kind: "lump" },
  { code: 105, category: "IDC", description: "Cementing Services & Surface Materials", kind: "quantity", unit: "job" },
  { code: 106, category: "IDC", description: "Directional Drilling Services & Tools", kind: "quantity", unit: "days", rateUnit: "day" },
  { code: 107, category: "IDC", description: "Wireline Logging & Formation Evaluation", kind: "quantity", unit: "run" },
  { code: 108, category: "IDC", description: "Mud Logging Services", kind: "quantity", unit: "days", rateUnit: "day" },
  { code: 109, category: "IDC", description: "Supervision / Engineering Oversight", kind: "quantity", unit: "days", rateUnit: "day" },
  { code: 201, category: "TDC", description: "Surface Casing", kind: "quantity", unit: "feet", rateUnit: "foot" },
  { code: 202, category: "TDC", description: "Intermediate Casing", kind: "quantity", unit: "feet", rateUnit: "foot" },
  { code: 203, category: "TDC", description: "Production Casing/Liner", kind: "quantity", unit: "feet", rateUnit: "foot" },
  { code: 204, category: "TDC", description: "Wellhead Equipment & Christmas Tree", kind: "quantity", unit: "unit" },
  { code: 205, category: "TDC", description: "Subsurface Production Equipment (Tubing/Packers)", kind: "lump" },
  { code: 206, category: "TDC", description: "Surface Production Facilities & Storage Tanks", kind: "lump" },
];

const APPROVALS = [
  ["preparedBy", "Prepared By"],
  ["operationsReview", "Reviewed By (Operations/Engineering)"],
  ["financeReview", "Reviewed By (Finance/Joint Interest Accounting)"],
  ["executiveApproval", "Approved By (Executive Management/CEO)"],
];

function cleanText(value, fallback = "Not provided") {
  if (typeof value !== "string") return fallback;
  const text = value.trim().replace(/\s+/g, " ");
  return text || fallback;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "&#124;").replace(/\r?\n/g, " ");
}

function parseNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function toCents(value) {
  const cents = Math.round(value * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function formatMoney(cents, currency) {
  if (cents === null || cents === undefined) return "Pending input";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
}

function formatPercent(value) {
  return `${formatNumber(value)}%`;
}

function trackingNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `AFE-DRAFT-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function fieldValue(fields, name) {
  return cleanText(fields && fields[name]);
}

function evaluateCost(definition, input, currency) {
  const item = input && typeof input === "object" ? input : {};
  const result = { ...definition, input: item, cents: null, quantity: null, unitCost: null, issue: null };
  if (definition.kind === "lump") {
    const amount = parseNumber(item.lumpSum);
    if (amount === null) {
      result.issue = "Pending input; no lump-sum amount supplied";
    } else if (!Number.isFinite(amount) || amount < 0 || toCents(amount) === null) {
      result.issue = "Invalid user input; provide a non-negative amount within supported currency precision";
    } else {
      result.cents = toCents(amount);
    }
    return result;
  }

  const quantity = parseNumber(item.quantity);
  const unitCost = parseNumber(item.unitCost);
  result.quantity = quantity;
  result.unitCost = unitCost;
  if (quantity === null || unitCost === null) {
    result.issue = "Pending input; quantity and unit cost are required";
    return result;
  }
  if (!Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(unitCost) || unitCost < 0) {
    result.issue = "Invalid user input; quantity must be positive and unit cost non-negative";
    return result;
  }
  const unitCostCents = toCents(unitCost);
  const cents = toCents(quantity * unitCost);
  if (cents === null || unitCostCents === null) {
    result.issue = "Invalid user input; extended amount exceeds supported precision";
    return result;
  }
  result.cents = cents;
  result.formattedUnitCost = formatMoney(unitCostCents, currency);
  result.rateUnit = definition.rateUnit || definition.unit;
  return result;
}

function evaluateCategory(category, lineItems, percentageValue) {
  const categoryLines = lineItems.filter((line) => line.category === category);
  const percentage = parseNumber(percentageValue);
  const base = categoryLines.every((line) => line.cents !== null)
    ? categoryLines.reduce((sum, line) => sum + line.cents, 0)
    : null;
  const baseCents = base !== null && Number.isSafeInteger(base) ? base : null;
  let issue = null;
  let contingencyCents = null;
  if (percentage === null) {
    issue = "Contingency percentage not provided";
  } else if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    issue = "Invalid contingency percentage; expected 0–100%";
  } else if (baseCents === null) {
    issue = "Pre-contingency subtotal unresolved";
  } else {
    const contingency = Math.round((baseCents * percentage) / 100);
    contingencyCents = Number.isSafeInteger(contingency) ? contingency : null;
    if (contingencyCents === null) issue = "Contingency exceeds supported precision";
  }
  const total = baseCents !== null && contingencyCents !== null ? baseCents + contingencyCents : null;
  const totalCents = total !== null && Number.isSafeInteger(total) ? total : null;
  if (total !== null && totalCents === null) issue = "Category total exceeds supported precision";
  return { category, lines: categoryLines, percentage, baseCents, contingencyCents, totalCents, issue };
}

function evaluateParticipants(participants, grandTotalCents) {
  const list = Array.isArray(participants) ? participants : [];
  const rows = list.map((participant) => {
    const owner = cleanText(participant && participant.owner, "");
    const interest = parseNumber(participant && participant.interest);
    const option = cleanText(participant && participant.nonConsent, "Not provided");
    const issue = interest !== null && (!Number.isFinite(interest) || interest < 0 || interest > 100)
      ? "Invalid working interest; expected 0–100%"
      : null;
    return { owner, interest, option, issue, exposureCents: null };
  });
  const provided = rows.filter((row) => row.owner || row.interest !== null);
  if (provided.length === 0) {
    return { rows: [{ owner: "Not provided", interest: null, option: "Not provided", exposureCents: null }], note: null };
  }
  const complete = provided.every((row) => row.owner && row.interest !== null && !row.issue);
  const totalInterest = complete ? provided.reduce((sum, row) => sum + row.interest, 0) : null;
  const validTotal = totalInterest !== null && Math.abs(totalInterest - 100) < 0.000001;
  const invalidRows = provided.filter((row) => row.issue);
  const canCalculate = complete && validTotal && grandTotalCents !== null;
  if (canCalculate) {
    const largest = provided.reduce((best, row) => row.interest > best.interest ? row : best, provided[0]);
    let allocated = 0;
    for (const row of provided) {
      row.exposureCents = Math.round((grandTotalCents * row.interest) / 100);
      allocated += row.exposureCents;
    }
    largest.exposureCents += grandTotalCents - allocated;
  }
  let note = null;
  if (invalidRows.length) {
    note = `${invalidRows.map((row) => row.owner || "Participant").join(", ")}: invalid working interest; expected 0–100%.`;
  } else if (!complete) note = "Participant names and working interests must both be provided before exposures can be calculated.";
  else if (!validTotal) note = `Provided working interests total ${formatNumber(totalInterest)}%, not 100%; partner exposures cannot be reconciled.`;
  else if (grandTotalCents === null) note = "Working interests total 100%, but net exposures remain pending until the gross AFE is fully reconciled.";
  return {
    rows: provided,
    note,
    hasProvidedParticipants: provided.length > 0,
    needsInput: provided.length > 0 && (!complete || !validTotal),
  };
}

function renderCostRow(line, currency) {
  const code = line.code;
  const quantityText = line.kind === "lump"
    ? "Lump Sum"
    : line.quantity === null
      ? "Pending input"
      : `${formatNumber(line.quantity)} ${line.unit}`;
  const unitCostText = line.kind === "lump"
    ? "-"
    : line.formattedUnitCost
      ? `${line.formattedUnitCost}/${line.rateUnit}`
      : "Pending input";
  const basis = line.issue
    ? line.issue
    : line.kind === "lump"
      ? "User-provided lump sum"
      : "Calculated from user-provided quantity and unit cost";
  return `| ${code} | ${escapeCell(line.description)} | ${quantityText} | ${unitCostText} | ${line.cents === null ? "Pending input" : formatMoney(line.cents, currency)} | ${escapeCell(basis)} |`;
}

function renderContingencyRow(category, evaluated, currency) {
  const code = category === "IDC" ? 110 : 207;
  const label = evaluated.percentage !== null && Number.isFinite(evaluated.percentage)
    ? `Contingency (${category}) - ${formatPercent(evaluated.percentage)} of ${evaluated.baseCents === null ? "unresolved pre-contingency subtotal" : formatMoney(evaluated.baseCents, currency)}`
    : `Contingency (${category}) - percentage and pre-contingency basis pending`;
  const basis = evaluated.contingencyCents === null
    ? `Pending input; ${evaluated.issue}`
    : `Calculated once from ${category} pre-contingency subtotal`;
  return `| ${code} | ${label} | - | - | ${evaluated.contingencyCents === null ? "Pending input" : formatMoney(evaluated.contingencyCents, currency)} | ${escapeCell(basis)} |`;
}

function approvalText(approval) {
  const name = cleanText(approval && approval.name, "");
  const title = cleanText(approval && approval.title, "");
  const date = cleanText(approval && approval.date, "");
  const values = [name, title, date].filter(Boolean);
  return values.length ? values.map(escapeCell).join(", ") : "[Name, Title, Date — not provided]";
}

function generateAfe(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("Request body must be a JSON object.");
  }
  const project = data.project && typeof data.project === "object" ? data.project : {};
  const inputs = new Map((Array.isArray(data.costs) ? data.costs : []).map((line) => [Number(line.code), line]));
  const currencyInput = cleanText(project.currency, "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currencyInput)) throw new TypeError("Currency must be a three-letter ISO code.");
  const supportedCurrencies = Intl.supportedValuesOf("currency");
  if (!supportedCurrencies.includes(currencyInput)) throw new TypeError("Currency is not a supported ISO currency code.");
  new Intl.NumberFormat("en-US", { style: "currency", currency: currencyInput });
  const currency = currencyInput;
  const lineItems = COSTS.map((definition) => evaluateCost(definition, inputs.get(definition.code), currency));
  const contingencies = data.contingencies && typeof data.contingencies === "object" ? data.contingencies : {};
  const idc = evaluateCategory("IDC", lineItems, contingencies.idc);
  const tdc = evaluateCategory("TDC", lineItems, contingencies.tdc);
  const grandTotalCents = idc.totalCents !== null && tdc.totalCents !== null
    ? idc.totalCents + tdc.totalCents
    : null;
  const participants = evaluateParticipants(data.participants, grandTotalCents);
  const errors = [];
  for (const line of lineItems) {
    if (line.issue && !line.issue.startsWith("Pending input")) {
      errors.push(`Cost code ${line.code}: ${line.issue}.`);
    }
  }
  for (const evaluated of [idc, tdc]) {
    if (evaluated.issue && evaluated.issue.startsWith("Invalid")) {
      errors.push(`${evaluated.category} contingency: ${evaluated.issue}.`);
    }
  }
  for (const row of participants.rows) {
    if (row.issue) errors.push(`${row.owner || "Participant"}: ${row.issue}.`);
  }
  if (participants.note && participants.note.includes("not 100%")) errors.push(participants.note);

  const pendingInputs = lineItems
    .filter((line) => line.cents === null)
    .map((line) => ({
      category: line.category,
      label: `${line.code} — ${line.description}`,
      message: line.issue,
      inputNames: line.kind === "lump"
        ? [`cost-${line.code}-lumpSum`]
        : [`cost-${line.code}-quantity`, `cost-${line.code}-unitCost`],
    }));
  for (const evaluated of [idc, tdc]) {
    if (evaluated.percentage === null ||
        !Number.isFinite(evaluated.percentage) ||
        evaluated.percentage < 0 ||
        evaluated.percentage > 100 ||
        (evaluated.baseCents !== null && evaluated.totalCents === null)) {
      pendingInputs.push({
        category: evaluated.category,
        label: `${evaluated.category} contingency`,
        message: evaluated.issue || "Contingency is unresolved",
        inputNames: [`${evaluated.category.toLowerCase()}Contingency`],
      });
    }
  }
  if (participants.needsInput) {
    pendingInputs.push({
      category: "Participation",
      label: "Working interests",
      message: participants.note,
      inputNames: ["participant-owner", "participant-interest"],
    });
  }

  const date = fieldValue(project, "spudDate");
  const dateDisplay = date === "Not provided" ? date : `${date} (user-provided)`;
  const days = fieldValue(project, "daysToTd");
  const md = fieldValue(project, "md");
  const tvd = fieldValue(project, "tvd");
  const name = fieldValue(project, "projectName");
  const classification = fieldValue(project, "classification");
  const objective = fieldValue(project, "objective");
  const risks = fieldValue(project, "risks");
  const safeguards = fieldValue(project, "safeguards");
  const economics = fieldValue(project, "economics");

  const markdown = [
    "# AUTHORIZATION FOR EXPENDITURE (AFE)",
    "",
    "## 1. GENERAL & OPERATIONAL HEADER",
    "",
    `- **AFE Number:** ${trackingNumber()} (generated tracking reference; not externally issued)`,
    `- **Project / Well Name:** ${escapeCell(name)}`,
    `- **Operator:** ${escapeCell(fieldValue(project, "operator"))}`,
    `- **Area / Asset Group:** ${escapeCell(fieldValue(project, "area"))}`,
    `- **Classification:** ${escapeCell(classification)}`,
    `- **Target Formation / Objective:** ${escapeCell(fieldValue(project, "target"))}`,
    `- **Estimated Spud Date:** ${escapeCell(dateDisplay)}`,
    `- **Estimated Days to Total Depth (TD):** ${days === "Not provided" ? days : `${escapeCell(days)} days (user-provided)`}`,
    `- **Measured Depth (MD):** ${md === "Not provided" ? md : `${escapeCell(md)} feet (user-provided)`}`,
    `- **True Vertical Depth (TVD):** ${tvd === "Not provided" ? tvd : `${escapeCell(tvd)} feet (user-provided)`}`,
    `- **Currency:** ${currency}`,
    "",
    "## 2. PARTNER PARTICIPATION SCHEDULE",
    "",
    `| Working Interest Owner | Working Interest (%) | Net Cost Exposure (${currency}) | Non-Consent Option Allowed? |`,
    "| :--- | :---: | :---: | :--- |",
    ...participants.rows.map((row) => `| ${escapeCell(row.owner || "Not provided")} | ${row.interest === null ? "Not provided" : formatPercent(row.interest)} | ${row.exposureCents === null ? "Pending input" : formatMoney(row.exposureCents, currency)} | ${escapeCell(row.option)} |`),
    ...(participants.rows.length > 1 ? [`| **Total provided interests** | **${participants.rows.every((row) => row.interest !== null) ? `${formatPercent(participants.rows.reduce((sum, row) => sum + row.interest, 0))}` : "Not provided"}** | **${participants.rows.every((row) => row.exposureCents !== null) ? formatMoney(participants.rows.reduce((sum, row) => sum + row.exposureCents, 0), currency) : "Not reconciled"}** | |`] : []),
    ...(participants.note ? ["", participants.note] : []),
    "",
    "## 3. COST ESTIMATE BREAKDOWN",
    "",
    "### A. Intangible Costs (IDC)",
    "",
    `| Cost Code | Description / Line Item | Units / Days | Unit Cost (${currency}) | Estimated Gross Cost (${currency}) | Estimate Basis |`,
    "| :--- | :--- | :--- | :---: | :---: | :--- |",
    ...lineItems.filter((line) => line.category === "IDC").map((line) => renderCostRow(line, currency)),
    renderContingencyRow("IDC", idc, currency),
    `| **SUBTOTAL** | **TOTAL INTANGIBLE COSTS** | | | **${idc.totalCents === null ? "Not reconciled" : formatMoney(idc.totalCents, currency)}** | ${idc.totalCents === null ? "Costs or contingency unresolved" : "Includes IDC contingency"} |`,
    "",
    "### B. Tangible Costs (TDC)",
    "",
    `| Cost Code | Description / Line Item | Quantity / Length | Unit Cost (${currency}) | Estimated Gross Cost (${currency}) | Estimate Basis |`,
    "| :--- | :--- | :--- | :---: | :---: | :--- |",
    ...lineItems.filter((line) => line.category === "TDC").map((line) => renderCostRow(line, currency)),
    renderContingencyRow("TDC", tdc, currency),
    `| **SUBTOTAL** | **TOTAL TANGIBLE COSTS** | | | **${tdc.totalCents === null ? "Not reconciled" : formatMoney(tdc.totalCents, currency)}** | ${tdc.totalCents === null ? "Costs or contingency unresolved" : "Includes TDC contingency"} |`,
    "",
    "### C. FINANCIAL SUMMARY",
    "",
    `- **Total Intangible Costs (including IDC contingency):** ${idc.totalCents === null ? "Not reconciled; cost or contingency inputs are pending/invalid" : formatMoney(idc.totalCents, currency)}`,
    `- **Total Tangible Costs (including TDC contingency):** ${tdc.totalCents === null ? "Not reconciled; cost or contingency inputs are pending/invalid" : formatMoney(tdc.totalCents, currency)}`,
    `- **GRAND TOTAL ESTIMATED AFE COST:** **${grandTotalCents === null ? "Pending input — not fully reconciled; no numeric grand total." : formatMoney(grandTotalCents, currency) + " (reconciled)"}**`,
    ...(errors.length ? ["", "**Input validation issues:**", ...errors.map((error) => `- ${escapeCell(error)}`)] : []),
    "",
    "## 4. JUSTIFICATION & OPERATIONAL SCOPE",
    "",
    `Project objective: ${escapeCell(objective)}. Target: ${escapeCell(fieldValue(project, "target"))}. Area: ${escapeCell(fieldValue(project, "area"))}. The project/well name is ${escapeCell(name)}. No unsupported operational defaults or project facts are inferred by this application.`,
    "",
    `Risks: ${escapeCell(risks)}. Safeguards: ${escapeCell(safeguards)}. Economic assumptions: ${escapeCell(economics)}. Where details are not provided, they remain unresolved; estimates are not represented as vendor quotes or guaranteed outcomes.`,
    "",
    "## 5. APPROVAL ROUTING & SIGN-OFF BLOCKS",
    "",
    ...APPROVALS.map(([key, label]) => `- **${label}:** ${approvalText(data.approvals && data.approvals[key])}`),
    "",
  ].join("\n");

  return {
    markdown,
    summary: {
      currency,
      idcCents: idc.totalCents,
      tdcCents: tdc.totalCents,
      grandTotalCents,
      isReconciled: grandTotalCents !== null &&
        (!participants.hasProvidedParticipants ||
          (participants.note === null &&
            participants.rows.every((row) => row.exposureCents !== null))),
      pendingInputs,
      errors,
    },
  };
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function readJson(request) {
  if (request.body !== undefined) {
    try {
      const body = request.body;
      if (typeof body === "string" || Buffer.isBuffer(body)) {
        const text = body.toString("utf8");
        if (Buffer.byteLength(text) > MAX_BODY_BYTES) {
          throw Object.assign(new Error("Request body exceeds 1 MiB."), { statusCode: 413 });
        }
        return Promise.resolve(JSON.parse(text));
      }
      return Promise.resolve(body);
    } catch (error) {
      return Promise.reject(error.statusCode
        ? error
        : Object.assign(new Error("Request body must contain valid JSON."), { statusCode: 400 }));
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";
    let bodyBytes = 0;
    let tooLarge = false;
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      bodyBytes += Buffer.byteLength(chunk);
      if (bodyBytes > MAX_BODY_BYTES) {
        tooLarge = true;
      } else if (!tooLarge) {
        body += chunk;
      }
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(Object.assign(new Error("Request body exceeds 1 MiB."), { statusCode: 413 }));
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("Request body must contain valid JSON."), { statusCode: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function serveStatic(request, response, pathname) {
  let requestedPath;
  try {
    requestedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  } catch {
    response.writeHead(400);
    response.end("Invalid path");
    return;
  }
  const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);
  if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      response.end(error.code === "ENOENT" ? "Not found" : "Unable to read requested file");
      return;
    }
    const contentType = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".svg": "image/svg+xml",
    }[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": contents.length,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { status: "ok" });
    return;
  }
  if (url.pathname === "/api/config" && request.method === "GET") {
    sendJson(response, 200, {
      costs: COSTS.map(({ code, category, description, kind, unit }) => ({ code, category, description, kind, unit })),
      approvalRoles: APPROVALS.map(([key, label]) => ({ key, label })),
    });
    return;
  }
  if (url.pathname === "/api/generate" && request.method === "POST") {
    try {
      const input = await readJson(request);
      sendJson(response, 200, generateAfe(input));
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message || "Unable to generate AFE." });
    }
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    sendJson(response, 404, { error: "API endpoint not found." });
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  serveStatic(request, response, url.pathname);
}

function createServer() {
  return http.createServer(handleRequest);
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`AFE app running at http://${HOST}:${PORT}`);
    console.log("Press Ctrl+C to stop the server.");
  });
  server.on("error", (error) => {
    console.error(`Unable to start AFE app: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { COSTS, createServer, generateAfe, handleRequest };
