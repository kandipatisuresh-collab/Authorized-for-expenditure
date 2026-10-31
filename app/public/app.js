const form = document.querySelector("#afe-form");
const statusMessage = document.querySelector("#status");
const participantsBody = document.querySelector("#participants");
const approvals = document.querySelector("#approvals");
const resultPanel = document.querySelector("#result");
const preview = document.querySelector("#preview");
const summary = document.querySelector("#summary");
let costDefinitions = [];
let approvalRoles = [];
let generatedMarkdown = "";

function makeInput({ name, type = "text", placeholder = "", min, max, step = "any" }) {
  const input = document.createElement("input");
  input.name = name;
  input.type = type;
  input.placeholder = placeholder;
  if (min !== undefined) input.min = String(min);
  if (max !== undefined) input.max = String(max);
  if (type === "number") input.step = step;
  return input;
}

function renderCostTable(definitions, target) {
  const body = document.querySelector(target);
  for (const item of definitions) {
    const row = document.createElement("tr");
    row.dataset.code = String(item.code);
    const code = document.createElement("td");
    code.className = "cost-code";
    code.textContent = String(item.code);
    const label = document.createElement("td");
    label.textContent = item.description;
    const quantityCell = document.createElement("td");
    const unitCell = document.createElement("td");
    const amountCell = document.createElement("td");
    if (item.kind === "lump") {
      quantityCell.textContent = "Lump sum";
      unitCell.textContent = "—";
      const amount = makeInput({ name: `cost-${item.code}-lumpSum`, type: "number", min: 0, placeholder: "Amount" });
      amount.setAttribute("aria-label", `${item.description} lump-sum amount`);
      amountCell.append(amount);
    } else {
      const quantity = makeInput({ name: `cost-${item.code}-quantity`, type: "number", min: 0, placeholder: "Quantity" });
      quantity.setAttribute("aria-label", `${item.description} quantity`);
      quantityCell.append(quantity);
      unitCell.textContent = item.unit;
      const amount = makeInput({ name: `cost-${item.code}-unitCost`, type: "number", min: 0, placeholder: "Rate" });
      amount.setAttribute("aria-label", `${item.description} unit cost`);
      amountCell.append(amount);
    }
    row.append(code, label, quantityCell, unitCell, amountCell);
    body.append(row);
  }
}

function addParticipant(owner = "", interest = "", nonConsent = "") {
  const row = document.createElement("tr");
  const ownerCell = document.createElement("td");
  const ownerInput = makeInput({ name: "participant-owner", placeholder: "Owner name" });
  ownerInput.value = owner;
  ownerInput.setAttribute("aria-label", "Working interest owner");
  ownerCell.append(ownerInput);

  const interestCell = document.createElement("td");
  const interestInput = makeInput({ name: "participant-interest", type: "number", min: 0, max: 100, placeholder: "Percent" });
  interestInput.value = interest;
  interestInput.setAttribute("aria-label", "Working interest percentage");
  interestCell.append(interestInput);

  const consentCell = document.createElement("td");
  const consentSelect = document.createElement("select");
  consentSelect.name = "participant-consent";
  consentSelect.setAttribute("aria-label", "Non-consent option");
  for (const [value, label] of [["", "Not provided"], ["yes", "Yes"], ["no", "No"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    consentSelect.append(option);
  }
  consentSelect.value = nonConsent;
  consentCell.append(consentSelect);

  const removeCell = document.createElement("td");
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-button";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", "Remove participant");
  remove.addEventListener("click", () => {
    row.remove();
    if (!participantsBody.children.length) addParticipant();
  });
  removeCell.append(remove);
  row.append(ownerCell, interestCell, consentCell, removeCell);
  participantsBody.append(row);
}

function collectFormData() {
  const formData = new FormData(form);
  const read = (name) => String(formData.get(name) || "").trim();
  const costs = costDefinitions.map((definition) => ({
    code: definition.code,
    quantity: read(`cost-${definition.code}-quantity`),
    unitCost: read(`cost-${definition.code}-unitCost`),
    lumpSum: read(`cost-${definition.code}-lumpSum`),
  }));
  const participants = [...participantsBody.querySelectorAll("tr")].map((row) => ({
    owner: row.querySelector('[name="participant-owner"]').value.trim(),
    interest: row.querySelector('[name="participant-interest"]').value,
    nonConsent: row.querySelector('[name="participant-consent"]').value || "Not provided",
  }));
  const approvalData = {};
  for (const role of approvalRoles) {
    approvalData[role.key] = {
      name: read(`approval-${role.key}-name`),
      title: read(`approval-${role.key}-title`),
      date: read(`approval-${role.key}-date`),
    };
  }
  return {
    project: {
      projectName: read("projectName"),
      operator: read("operator"),
      area: read("area"),
      classification: read("classification"),
      target: read("target"),
      spudDate: read("spudDate"),
      daysToTd: read("daysToTd"),
      md: read("md"),
      tvd: read("tvd"),
      currency: read("currency"),
      objective: read("objective"),
      risks: read("risks"),
      safeguards: read("safeguards"),
      economics: read("economics"),
    },
    participants,
    costs,
    contingencies: { idc: read("idcContingency"), tdc: read("tdcContingency") },
    approvals: approvalData,
  };
}

function showStatus(message, kind = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status ${kind}`;
}

function renderSummary(data) {
  const values = [
    ["IDC total", data.summary.idcCents],
    ["TDC total", data.summary.tdcCents],
    ["Grand total", data.summary.grandTotalCents],
  ];
  summary.replaceChildren();
  for (const [label, cents] of values) {
    const card = document.createElement("div");
    card.className = "summary-card";
    const title = document.createElement("span");
    title.textContent = label;
    const value = document.createElement("strong");
    value.textContent = cents === null ? "Not reconciled" : new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.summary.currency,
    }).format(cents / 100);
    card.append(title, value);
    summary.append(card);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector("#generate");
  button.disabled = true;
  showStatus("Generating and validating the AFE…");
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectFormData()),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The AFE could not be generated.");
    generatedMarkdown = data.markdown;
    preview.textContent = generatedMarkdown;
    renderSummary(data);
    resultPanel.hidden = false;
    showStatus(
      data.summary.isReconciled
        ? "AFE generated. Review the document and all supplied assumptions before use."
        : "AFE generated with unresolved inputs. Totals and exposures remain unreconciled.",
      data.summary.isReconciled ? "success" : "warning",
    );
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#add-participant").addEventListener("click", () => addParticipant());

document.querySelector("#copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(generatedMarkdown);
    showStatus("AFE Markdown copied to clipboard.", "success");
  } catch {
    showStatus("Clipboard access was denied by the browser. Select and copy the document text instead.", "error");
  }
});

document.querySelector("#download").addEventListener("click", () => {
  const file = new Blob([generatedMarkdown], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "afe-output.md";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

async function initialize() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("Unable to load AFE cost schedule.");
    const config = await response.json();
    costDefinitions = config.costs;
    approvalRoles = config.approvalRoles;
    renderCostTable(costDefinitions.filter((item) => item.category === "IDC"), "#costs-idc");
    renderCostTable(costDefinitions.filter((item) => item.category === "TDC"), "#costs-tdc");
    for (const role of approvalRoles) {
      const label = document.createElement("label");
      label.className = "approval-field";
      label.append(document.createTextNode(role.label));
      const fields = document.createElement("span");
      fields.className = "approval-inputs";
      const name = makeInput({ name: `approval-${role.key}-name`, placeholder: "Name" });
      name.setAttribute("aria-label", `${role.label} name`);
      const title = makeInput({ name: `approval-${role.key}-title`, placeholder: "Title" });
      title.setAttribute("aria-label", `${role.label} title`);
      const date = makeInput({ name: `approval-${role.key}-date`, type: "date" });
      date.setAttribute("aria-label", `${role.label} date`);
      fields.append(name, title, date);
      label.append(fields);
      approvals.append(label);
    }
    addParticipant();
    addParticipant();
  } catch (error) {
    showStatus(error.message, "error");
    document.querySelector("#generate").disabled = true;
  }
}

initialize();
