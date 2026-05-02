/**
 * SS Quick Loans — Brand Config
 * Edit BRAND below to update branding in one place.
 */

const BRAND = {
  company_name: "SS Quick Loans",
  tagline: "Personal Financial Solutions",
  primary_color: "#1B2A49",
  accent_color: "#2FA4B8",
  cta_text: "Apply Now",
  whatsapp_number: "+27615439540",
  owner_email: "mayibongweshabangu16@gmail.com",
  loan_type: "Personal Loans",
  max_amount: "R8,000",
  min_amount: "R1,000",
  interest_rate_monthly: 5.5,
  // Free key (250/month) — sign up at https://web3forms.com with mayibongweshabangu16@gmail.com then paste the access key here
  web3forms_key: "",
};

function applyBrand(config) {
  const root = document.documentElement;
  root.style.setProperty("--primary", config.primary_color);
  root.style.setProperty("--accent", config.accent_color);

  document.querySelectorAll("[data-brand='name']").forEach((el) => {
    el.textContent = config.company_name;
  });

  document.querySelectorAll("[data-brand='tagline']").forEach((el) => {
    el.textContent = config.tagline;
  });

  document.querySelectorAll("[data-brand='cta']").forEach((el) => {
    el.textContent = config.cta_text;
  });

  document.querySelectorAll("[data-brand='loan-type']").forEach((el) => {
    el.textContent = config.loan_type;
  });

  document.querySelectorAll("[data-brand='max-amount']").forEach((el) => {
    el.textContent = config.max_amount;
  });

  document.querySelectorAll("[data-brand='whatsapp-btn']").forEach((el) => {
    const num = config.whatsapp_number.replace(/\D/g, "");
    el.href = `https://wa.me/${num}?text=Hi%2C%20I%20just%20applied%20for%20a%20loan%20with%20SS%20Quick%20Loans`;
  });

  document.title = `${config.company_name} — ${config.loan_type}`;

  window.VUKA = config;
}

function loadBrand() {
  applyBrand(BRAND);

  const jsonPath =
    window.location.protocol === "file:"
      ? null
      : new URL("../config/brand.json", window.location.href).href;

  if (!jsonPath) return;

  fetch(jsonPath)
    .then((r) => r.json())
    .then((remote) => {
      const merged = Object.assign({}, BRAND, remote);
      applyBrand(merged);
    })
    .catch(() => {});
}

document.addEventListener("DOMContentLoaded", loadBrand);
