/**
 * Vuka Engine — Loan Calculator
 *
 * Formula: standard amortization (PMT)
 *   M = P × [r(1+r)^n] / [(1+r)^n − 1]
 *   where r = monthly interest rate (decimal), n = number of months
 *
 * Default rate: 5.5% per month — set per product configuration.
 * Override by setting window.VUKA.interest_rate_monthly before this script runs.
 */

(function () {
  const DEFAULT_RATE = 5.5; // % per month

  function getMonthlyRate() {
    return ((window.VUKA && window.VUKA.interest_rate_monthly) || DEFAULT_RATE) / 100;
  }

  function formatZAR(value) {
    return "R" + Math.round(value).toLocaleString("en-ZA");
  }

  function calcMonthlyPayment(principal, months) {
    const r = getMonthlyRate();
    if (r === 0) return principal / months;
    const factor = Math.pow(1 + r, months);
    return (principal * r * factor) / (factor - 1);
  }

  function updateDisplay() {
    const amountEl = document.getElementById("loan-amount");
    const monthlyEl = document.getElementById("monthly-repayment");
    const totalEl = document.getElementById("total-repayment");
    const amountDisplay = document.getElementById("amount-display");
    const termDisplay = document.getElementById("term-display");

    if (!amountEl || !monthlyEl) return;

    const principal = parseFloat(amountEl.value) || 5000;
    const termSlider = document.getElementById("loan-term-slider");
    const months = termSlider ? parseInt(termSlider.value, 10) : 6;

    if (amountDisplay) amountDisplay.textContent = formatZAR(principal);
    if (termDisplay) termDisplay.textContent = months + (months === 1 ? " month" : " months");

    const monthly = calcMonthlyPayment(principal, months);
    const total = monthly * months;

    monthlyEl.textContent = formatZAR(monthly);
    if (totalEl) totalEl.textContent = formatZAR(total);

    // Persist amount so apply.html can pre-fill the loan amount field
    try {
      sessionStorage.setItem("vuka_loan_amount", String(Math.round(principal)));
      sessionStorage.setItem("vuka_loan_months", String(months));
    } catch (_) {}

    // Update the apply button href with a query param as well
    const applyBtn = document.getElementById("calc-apply-btn");
    if (applyBtn) {
      applyBtn.href = `apply.html?amount=${Math.round(principal)}&months=${months}`;
    }
  }

  function init() {
    const amountSlider = document.getElementById("loan-amount");
    if (!amountSlider) return; // not on a page with the calculator

    // Restore from sessionStorage if available
    const savedAmount = sessionStorage.getItem("vuka_loan_amount");
    if (savedAmount) {
      const v = parseInt(savedAmount, 10);
      if (v >= amountSlider.min && v <= amountSlider.max) {
        amountSlider.value = v;
      }
    }

    amountSlider.addEventListener("input", updateDisplay);

    const termSlider = document.getElementById("loan-term-slider");
    if (termSlider) {
      // Restore saved term
      const savedMonths = sessionStorage.getItem("vuka_loan_months");
      if (savedMonths) {
        const v = parseInt(savedMonths, 10);
        if (v >= parseInt(termSlider.min, 10) && v <= parseInt(termSlider.max, 10)) {
          termSlider.value = v;
        }
      }
      termSlider.addEventListener("input", updateDisplay);
    }

    updateDisplay();
  }

  // Run after config.js has had a chance to set window.VUKA
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for use by form.js
  window.VukaCalc = { calcMonthlyPayment, formatZAR };
})();
