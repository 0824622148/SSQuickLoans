/**
 * Vuka Engine — Multi-Step Form Controller
 *
 * Manages step navigation, validation, live calculator preview,
 * sessionStorage persistence, and final submission.
 */

(function () {
  const TOTAL_STEPS = 4;

  const STEP_NAMES = [
    "Personal Details",
    "Employment & Income",
    "Loan Details",
    "Review & Consent",
  ];

  // ── State ────────────────────────────────────────────────
  let currentStep = 1;

  // ── DOM refs ─────────────────────────────────────────────
  const progressFill = document.getElementById("progress-fill");
  const stepLabel = document.getElementById("step-label");
  const stepName = document.getElementById("step-name");
  const progressBar = document.querySelector(".progress-track");

  // ── Helpers ──────────────────────────────────────────────
  function $(id) {
    return document.getElementById(id);
  }

  function setError(el, hasError) {
    if (!el) return;
    if (hasError) {
      el.classList.add("error");
    } else {
      el.classList.remove("error");
    }
  }

  function isValidSAPhone(val) {
    // Accept 10-digit SA numbers, optionally with spaces or dashes, +27 prefix
    const cleaned = val.replace(/[\s\-()]/g, "");
    return /^(\+?27|0)[6-8][0-9]{8}$/.test(cleaned);
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function isValidSAID(val) {
    const id = val.replace(/\s/g, "");
    if (!/^\d{13}$/.test(id)) return false;

    // Validate month and day in DOB portion (YYMMDD)
    const month = parseInt(id.substring(2, 4), 10);
    const day   = parseInt(id.substring(4, 6), 10);
    if (month < 1 || month > 12) return false;
    if (day   < 1 || day   > 31) return false;

    // Luhn checksum over first 12 digits; result must match digit 13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      let d = parseInt(id[i], 10);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return (10 - (sum % 10)) % 10 === parseInt(id[12], 10);
  }

  // ── Step display ─────────────────────────────────────────
  function showStep(n) {
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const pane = $(`step-${i}`);
      if (pane) pane.classList.toggle("active", i === n);

      const dot = $(`dot-${i}`);
      if (dot) {
        dot.classList.toggle("active", i === n);
        dot.classList.toggle("done", i < n);
      }
    }

    const pct = Math.round((n / TOTAL_STEPS) * 100);
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressBar) progressBar.setAttribute("aria-valuenow", pct);
    if (stepLabel) stepLabel.textContent = `Step ${n} of ${TOTAL_STEPS}`;
    if (stepName) stepName.textContent = STEP_NAMES[n - 1];

    // Scroll to top of form area
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Validation per step ───────────────────────────────────
  function validateStep1() {
    let ok = true;

    const name = $("full-name");
    const nameOk = name && name.value.trim().length >= 2;
    setError(name, !nameOk);
    if (!nameOk) ok = false;

    const saId = $("sa-id");
    const saIdOk = saId && isValidSAID(saId.value);
    setError(saId, !saIdOk);
    if (!saIdOk) ok = false;

    const phone = $("phone");
    const phoneOk = phone && isValidSAPhone(phone.value);
    setError(phone, !phoneOk);
    if (!phoneOk) ok = false;

    const email = $("email");
    const emailOk = email && isValidEmail(email.value);
    setError(email, !emailOk);
    if (!emailOk) ok = false;

    return ok;
  }

  function validateStep2() {
    let ok = true;

    const status = $("employment-status");
    const statusOk = status && status.value !== "";
    setError(status, !statusOk);
    if (!statusOk) ok = false;

    const income = $("monthly-income");
    const incomeOk = income && parseFloat(income.value) > 0;
    setError(income, !incomeOk);
    if (!incomeOk) ok = false;

    return ok;
  }

  function validateStep3() {
    let ok = true;

    const amount = $("loan-amount-apply");
    const amountVal = parseFloat(amount ? amount.value : 0);
    const amountOk = amountVal >= 1000 && amountVal <= 8000;
    setError(amount, !amountOk);
    if (!amountOk) ok = false;

    // Slider always carries a value (1–6); just confirm the element exists
    const term = $("loan-term-slider-apply");
    const termOk = term && parseInt(term.value, 10) >= 1;
    if (!termOk) ok = false;

    return ok;
  }

  function validateStep4() {
    let ok = true;

    const popia = $("popia-consent");
    const popiaGroup = $("popia-group");
    const popiaError = $("popia-error");
    if (!popia || !popia.checked) {
      if (popiaGroup) popiaGroup.classList.add("error");
      if (popiaError) popiaError.style.display = "block";
      ok = false;
    } else {
      if (popiaGroup) popiaGroup.classList.remove("error");
      if (popiaError) popiaError.style.display = "none";
    }

    const nca = $("nca-consent");
    const ncaGroup = $("nca-group");
    const ncaError = $("nca-error");
    if (!nca || !nca.checked) {
      if (ncaGroup) ncaGroup.classList.add("error");
      if (ncaError) ncaError.style.display = "block";
      ok = false;
    } else {
      if (ncaGroup) ncaGroup.classList.remove("error");
      if (ncaError) ncaError.style.display = "none";
    }

    return ok;
  }

  // ── sessionStorage persistence ────────────────────────────
  function saveField(id, key) {
    const el = $(id);
    if (!el) return;
    try {
      sessionStorage.setItem("vuka_form_" + key, el.value);
    } catch (_) {}
  }

  function restoreField(id, key) {
    const el = $(id);
    if (!el) return;
    try {
      const val = sessionStorage.getItem("vuka_form_" + key);
      if (val !== null) el.value = val;
    } catch (_) {}
  }

  function saveStep1() {
    saveField("full-name", "full_name");
    saveField("sa-id", "sa_id_number");
    saveField("phone", "phone");
    saveField("email", "email");
  }

  function saveStep2() {
    saveField("employment-status", "employment_status");
    saveField("monthly-income", "monthly_income");
  }

  function saveStep3() {
    saveField("loan-amount-apply", "loan_amount");
    saveField("loan-term-slider-apply", "loan_term_months");
  }

  function restoreAllFields() {
    restoreField("full-name", "full_name");
    restoreField("sa-id", "sa_id_number");
    restoreField("phone", "phone");
    restoreField("email", "email");
    restoreField("employment-status", "employment_status");
    restoreField("monthly-income", "monthly_income");

    // Loan amount: prefer URL param, then sessionStorage
    const params = new URLSearchParams(window.location.search);
    const urlAmount = params.get("amount");
    const urlMonths = params.get("months");
    const storedAmount = sessionStorage.getItem("vuka_loan_amount");
    const storedMonths = sessionStorage.getItem("vuka_loan_months");

    const amountEl = $("loan-amount-apply");
    if (amountEl) {
      const val = urlAmount || sessionStorage.getItem("vuka_form_loan_amount") || storedAmount;
      if (val) amountEl.value = val;
    }

    // Restore term slider and sync its label
    const termSlider = $("loan-term-slider-apply");
    if (termSlider) {
      const saved = sessionStorage.getItem("vuka_form_loan_term_months") || urlMonths || storedMonths;
      if (saved) {
        const v = parseInt(saved, 10);
        if (v >= parseInt(termSlider.min, 10) && v <= parseInt(termSlider.max, 10)) {
          termSlider.value = v;
        }
      }
      syncTermLabel(termSlider.value);
    }
  }

  // ── Sync term slider label (apply.html) ──────────────────
  function syncTermLabel(val) {
    const label = $("term-display-apply");
    if (label) {
      const n = parseInt(val, 10);
      label.textContent = n + (n === 1 ? " month" : " months");
    }
  }

  // ── Live calculator on step 3 ─────────────────────────────
  function updateApplyCalc() {
    const amountEl = $("loan-amount-apply");
    const termEl = $("loan-term-slider-apply");
    const resultBox = $("apply-calc-result");
    const monthlyEl = $("apply-monthly");
    const totalEl = $("apply-total");

    if (!amountEl || !termEl || !resultBox) return;

    const amount = parseFloat(amountEl.value);
    const months = parseInt(termEl.value, 10);

    if (!amount || !months || amount < 1000) {
      resultBox.style.display = "none";
      return;
    }

    if (window.VukaCalc) {
      const monthly = window.VukaCalc.calcMonthlyPayment(amount, months);
      const total = monthly * months;
      if (monthlyEl) monthlyEl.textContent = window.VukaCalc.formatZAR(monthly);
      if (totalEl) totalEl.textContent = window.VukaCalc.formatZAR(total);
      resultBox.style.display = "block";
    }
  }

  // ── Summary box for step 4 ────────────────────────────────
  function buildSummary() {
    const box = $("summary-content");
    if (!box) return;

    const rows = [
      ["Name", ($("full-name") || {}).value],
      ["SA ID", ($("sa-id") || {}).value],
      ["Phone", ($("phone") || {}).value],
      ["Email", ($("email") || {}).value],
      ["Employment", (($("employment-status") || {}).selectedOptions || [{}])[0].text],
      ["Monthly Income", "R" + (parseFloat(($("monthly-income") || {}).value) || 0).toLocaleString("en-ZA")],
      ["Loan Amount", "R" + (parseFloat(($("loan-amount-apply") || {}).value) || 0).toLocaleString("en-ZA")],
      ["Loan Term", (($("loan-term-slider-apply") || {}).value || "") + " months"],
    ];

    box.innerHTML = rows
      .filter(([, v]) => v && v.trim && v.trim() !== "" && v !== "undefined months")
      .map(
        ([k, v]) =>
          `<div style="display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--border);padding:4px 0;">` +
          `<span style="color:var(--text-muted);font-size:.85rem;">${k}</span>` +
          `<span style="font-weight:600;font-size:.85rem;">${v}</span></div>`
      )
      .join("");
  }

  // ── Collect all form data ─────────────────────────────────
  function collectFormData() {
    return {
      full_name: ($("full-name") || {}).value,
      sa_id_number: ($("sa-id") || {}).value,
      phone: ($("phone") || {}).value,
      email: ($("email") || {}).value,
      employment_status: ($("employment-status") || {}).value,
      monthly_income: ($("monthly-income") || {}).value,
      loan_amount: ($("loan-amount-apply") || {}).value,
      loan_term_months: ($("loan-term-slider-apply") || {}).value,
      popia_consent: ($("popia-consent") || {}).checked,
      nca_consent: ($("nca-consent") || {}).checked,
      submitted_at: new Date().toISOString(),
    };
  }

  // ── Employment label lookup (used in email + WhatsApp) ───
  const EMP_LABELS = {
    employed:      "Permanently Employed",
    contract:      "Contract / Temp",
    "self-employed": "Self-Employed / Business Owner",
    pensioner:     "Pensioner / Grant Recipient",
    other:         "Other",
  };

  // ── Email notification via Web3Forms ─────────────────────
  function sendEmail(data) {
    const key = (window.VUKA && window.VUKA.web3forms_key) || "";
    if (!key) return;

    const income    = (parseFloat(data.monthly_income) || 0).toLocaleString("en-ZA");
    const amount    = (parseFloat(data.loan_amount)    || 0).toLocaleString("en-ZA");
    const submitted = new Date(data.submitted_at).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key:          key,
        subject:             "New Loan Application — " + data.full_name,
        from_name:           "SS Quick Loans Website",
        "Full Name":         data.full_name,
        "SA ID Number":      data.sa_id_number,
        "Phone":             data.phone,
        "Applicant Email":   data.email,
        "Employment Status": EMP_LABELS[data.employment_status] || data.employment_status,
        "Monthly Income":    "R" + income,
        "Loan Amount":       "R" + amount,
        "Loan Term":         data.loan_term_months + " months",
        "Submitted At":      submitted,
      }),
    }).catch(() => {});
  }

  // ── Navigation handlers ───────────────────────────────────
  function goTo(n) {
    currentStep = n;
    showStep(n);
  }

  function attachListeners() {
    // Step 1 → 2
    const next1 = $("next-1");
    if (next1) {
      next1.addEventListener("click", function () {
        if (!validateStep1()) return;
        saveStep1();
        goTo(2);
      });
    }

    // Step 2 ← / →
    const back2 = $("back-2");
    if (back2) back2.addEventListener("click", () => goTo(1));

    const next2 = $("next-2");
    if (next2) {
      next2.addEventListener("click", function () {
        if (!validateStep2()) return;
        saveStep2();
        goTo(3);
      });
    }

    // Step 3 ← / →
    const back3 = $("back-3");
    if (back3) back3.addEventListener("click", () => goTo(2));

    const next3 = $("next-3");
    if (next3) {
      next3.addEventListener("click", function () {
        if (!validateStep3()) return;
        saveStep3();
        buildSummary();
        goTo(4);
      });
    }

    // Step 4 ←
    const back4 = $("back-4");
    if (back4) back4.addEventListener("click", () => goTo(3));

    // Submit
    const submitBtn = $("submit-btn");
    if (submitBtn) {
      submitBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (!validateStep4()) return;

        const data = collectFormData();

        try {
          sessionStorage.setItem("vuka_submission", JSON.stringify(data));
        } catch (_) {}

        // Send email notification (fire-and-forget)
        sendEmail(data);

        // Visual feedback before redirect
        submitBtn.textContent = "Submitting…";
        submitBtn.disabled = true;

        setTimeout(() => {
          window.location.href = "success.html";
        }, 800);
      });
    }

    // Live calculator on step 3 inputs
    const amountApply = $("loan-amount-apply");
    const termApply = $("loan-term-slider-apply");
    if (amountApply) amountApply.addEventListener("input", updateApplyCalc);
    if (termApply) {
      termApply.addEventListener("input", function () {
        syncTermLabel(this.value);
        updateApplyCalc();
      });
    }
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    if (!$("step-1")) return; // not on apply.html

    restoreAllFields();
    showStep(1);
    attachListeners();

    // Trigger calc display if fields already populated
    updateApplyCalc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
