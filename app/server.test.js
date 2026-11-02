const assert = require("node:assert/strict");
const test = require("node:test");
const { COSTS, createServer, generateAfe, handleRequest } = require("./server");

const completeRequest = {
  project: {
    projectName: "",
    operator: "Test Operator",
    area: "Permian Basin, Texas",
    classification: "Development",
    target: "Bone Spring",
    spudDate: "2026-12-01",
    daysToTd: "20",
    md: "10000",
    tvd: "8000",
    currency: "USD",
    objective: "Evaluate the Bone Spring development target.",
    risks: "Lost circulation and uncertain formation pressure.",
    safeguards: "Monitored mud program and contingency funds.",
    economics: "No production-rate or ROI forecast supplied.",
  },
  costs: [
    { code: 101, lumpSum: 85000 },
    { code: 102, quantity: 20, unitCost: 40000 },
    { code: 103, quantity: 20, unitCost: 4000 },
    { code: 104, lumpSum: 120000 },
    { code: 105, quantity: 1, unitCost: 65000 },
    { code: 106, quantity: 20, unitCost: 3500 },
    { code: 107, quantity: 1, unitCost: 48000 },
    { code: 108, quantity: 20, unitCost: 1500 },
    { code: 109, quantity: 20, unitCost: 1800 },
    { code: 201, quantity: 2000, unitCost: 45 },
    { code: 202, quantity: 5000, unitCost: 65 },
    { code: 203, quantity: 8000, unitCost: 40 },
    { code: 204, quantity: 1, unitCost: 120000 },
    { code: 205, lumpSum: 95000 },
    { code: 206, lumpSum: 300000 },
  ],
  contingencies: { idc: 10, tdc: 10 },
  participants: [
    { owner: "Test Operator", interest: 60, nonConsent: "Not provided" },
    { owner: "Test Partner", interest: 40, nonConsent: "Not provided" },
  ],
  approvals: {},
};

test("provides all required coded IDC and TDC lines", () => {
  assert.equal(COSTS.length, 15);
  assert.deepEqual(COSTS.map((line) => line.code), [
    101, 102, 103, 104, 105, 106, 107, 108, 109, 201, 202, 203, 204, 205, 206,
  ]);
});

test("calculates category contingencies, grand total, and partner exposures", () => {
  const result = generateAfe(completeRequest);
  assert.equal(result.summary.idcCents, 146740000);
  assert.equal(result.summary.tdcCents, 137500000);
  assert.equal(result.summary.grandTotalCents, 284240000);
  assert.match(result.markdown, /\$1,705,440\.00/);
  assert.match(result.markdown, /\$1,136,960\.00/);
  assert.match(result.markdown, /# AUTHORIZATION FOR EXPENDITURE \(AFE\)/);
  assert.match(result.markdown, /\*\*Project \/ Well Name:\*\* Not provided/);
  assert.equal(result.summary.isReconciled, true);
});

test("keeps missing costs and contingencies pending without a numeric grand total", () => {
  const result = generateAfe({
    project: {
      area: "Permian Basin, Texas",
      target: "Bone Spring",
      md: "10000",
      tvd: "8000",
    },
    costs: [],
    contingencies: {},
    participants: [{ owner: "Owner", interest: 100 }],
  });
  assert.equal(result.summary.grandTotalCents, null);
  assert.match(result.markdown, /Pending input — not fully reconciled/);
  assert.match(result.markdown, /\| 102 \| Daywork Rig Rental \| Pending input \| Pending input \| Pending input \| Pending input; quantity and unit cost are required \|/);
  assert.match(result.markdown, /\| 201 \| Surface Casing \| Pending input \| Pending input \| Pending input \| Pending input; quantity and unit cost are required \|/);
  assert.match(result.markdown, /Net Cost Exposure \(USD\)[\s\S]*?\| Owner \| 100% \| Pending input/);
  assert.equal(result.summary.isReconciled, false);
});

test("identifies negative costs and incomplete working interests", () => {
  const result = generateAfe({
    ...completeRequest,
    costs: completeRequest.costs.map((line) => {
      if (line.code === 102) return { ...line, quantity: 1, unitCost: -50 };
      if (line.code === 206) return { code: 206 };
      return line;
    }),
    participants: [
      { owner: "Partner A", interest: 60 },
      { owner: "Partner B", interest: 30 },
    ],
  });
  assert.equal(result.summary.grandTotalCents, null);
  assert.match(result.markdown, /quantity must be positive and unit cost non-negative/);
  assert.match(result.markdown, /total 90%, not 100%/);
  assert.match(result.markdown, /Net Cost Exposure \(USD\)[\s\S]*?\| Partner A \| 60% \| Pending input/);
  assert.match(result.markdown, /\| 206 \| Surface Production Facilities & Storage Tanks \| Lump Sum \| - \| Pending input \| Pending input; no lump-sum amount supplied \|/);
});

test("keeps unsupported project and estimate details as explicit placeholders", () => {
  const result = generateAfe({
    project: {
      area: "Permian Basin, Texas",
      target: "Bone Spring",
      md: "10000",
      tvd: "8000",
    },
    costs: [],
    contingencies: {},
    participants: [],
    approvals: {},
  });

  assert.match(result.markdown, /\*\*Project \/ Well Name:\*\* Not provided/);
  assert.match(result.markdown, /\*\*Operator:\*\* Not provided/);
  assert.match(result.markdown, /\*\*Estimated Spud Date:\*\* Not provided/);
  assert.match(result.markdown, /\| 102 \| Daywork Rig Rental \| Pending input \| Pending input \| Pending input \| Pending input; quantity and unit cost are required \|/);
  assert.match(result.markdown, /\| Not provided \| Not provided \| Pending input \| Not provided \|/);
  assert.match(result.markdown, /\[Name, Title, Date — not provided\]/);
  assert.equal(result.summary.grandTotalCents, null);
});

test("does not infer project facts or cost amounts from an underspecified request", () => {
  const result = generateAfe({
    project: {},
    costs: [],
    contingencies: {},
    participants: [],
    approvals: {},
  });

  assert.match(result.markdown, /\*\*Project \/ Well Name:\*\* Not provided/);
  assert.match(result.markdown, /\*\*Area \/ Asset Group:\*\* Not provided/);
  assert.match(result.markdown, /\*\*Target Formation \/ Objective:\*\* Not provided/);
  assert.match(result.markdown, /\| 102 \| Daywork Rig Rental \| Pending input \| Pending input \| Pending input \| Pending input; quantity and unit cost are required \|/);
  assert.match(result.markdown, /GRAND TOTAL ESTIMATED AFE COST:\*\* \*\*Pending input/);
  assert.match(result.markdown, /\| Not provided \| Not provided \| Pending input \| Not provided \|/);
  assert.equal(result.summary.grandTotalCents, null);
});

test("includes supplied justification and all approval roles without inventing signers", () => {
  const result = generateAfe({
    ...completeRequest,
    approvals: {
      preparedBy: { name: "Test Preparer", title: "Engineer", date: "2026-11-01" },
    },
  });
  const narrative = result.markdown.split("## 4. JUSTIFICATION & OPERATIONAL SCOPE")[1]
    .split("## 5. APPROVAL ROUTING & SIGN-OFF BLOCKS")[0];

  assert.match(narrative, /Evaluate the Bone Spring development target/);
  assert.match(narrative, /Lost circulation and uncertain formation pressure/);
  assert.match(narrative, /Monitored mud program and contingency funds/);
  assert.match(narrative, /No production-rate or ROI forecast supplied/);
  assert.equal(narrative.trim().split(/\n\s*\n/).length, 2);
  assert.match(result.markdown, /\*\*Prepared By:\*\* Test Preparer, Engineer, 2026-11-01/);
  assert.match(result.markdown, /\*\*Reviewed By \(Operations\/Engineering\):\*\* \[Name, Title, Date — not provided\]/);
  assert.match(result.markdown, /\*\*Reviewed By \(Finance\/Joint Interest Accounting\):\*\* \[Name, Title, Date — not provided\]/);
  assert.match(result.markdown, /\*\*Approved By \(Executive Management\/CEO\):\*\* \[Name, Title, Date — not provided\]/);
});

test("keeps unavailable narrative facts and economic assumptions unresolved", () => {
  const result = generateAfe({
    project: {
      objective: "Evaluate the supplied target.",
      risks: "Potential lost circulation and uncertain formation pressure.",
      safeguards: "Monitored mud program and contingency funds.",
    },
    costs: [],
    contingencies: {},
    participants: [],
    approvals: {},
  });
  const narrative = result.markdown.split("## 4. JUSTIFICATION & OPERATIONAL SCOPE")[1]
    .split("## 5. APPROVAL ROUTING & SIGN-OFF BLOCKS")[0];

  assert.match(narrative, /Project objective: Evaluate the supplied target/);
  assert.match(narrative, /Risks: Potential lost circulation and uncertain formation pressure/);
  assert.match(narrative, /Safeguards: Monitored mud program and contingency funds/);
  assert.match(narrative, /Economic assumptions: Not provided/);
  assert.match(narrative, /Target: Not provided/);
  assert.match(narrative, /project\/well name is Not provided/);
  assert.doesNotMatch(narrative, /\b(?:production rate|ROI)\s*[:=]\s*\$?\d/i);
});

test("rejects malformed request objects and unsupported currencies", () => {
  assert.throws(() => generateAfe(null), /JSON object/);
  assert.throws(() => generateAfe({ project: { currency: "US" } }), /three-letter/);
  assert.throws(() => generateAfe({ project: { currency: "ZZZ" } }), /supported ISO/);
});

test("serves the frontend and generates an AFE through the HTTP API", async (t) => {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const pageResponse = await fetch(baseUrl);
  assert.equal(pageResponse.status, 200);
  const page = await pageResponse.text();
  assert.match(page, /AFE Builder/);
  assert.match(page, /Enter supplied values; missing cost inputs stay pending/);

  const configResponse = await fetch(`${baseUrl}/api/config`);
  assert.equal(configResponse.status, 200);
  assert.equal((await configResponse.json()).costs.length, 15);

  const generationResponse = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(completeRequest),
  });
  assert.equal(generationResponse.status, 200);
  const generated = await generationResponse.json();
  assert.equal(generated.summary.grandTotalCents, 284240000);
  assert.match(generated.markdown, /GRAND TOTAL ESTIMATED AFE COST.*\$2,842,400\.00/);
});

test("accepts platform-parsed request bodies for serverless deployments", async () => {
  const response = {
    statusCode: null,
    headers: null,
    body: "",
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body = "") {
      this.body = body;
    },
  };

  await handleRequest({
    method: "POST",
    url: "/api/generate",
    headers: { host: "localhost" },
    body: completeRequest,
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).summary.grandTotalCents, 284240000);
});
