// Login page — uses shared auth utility from auth.js
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const otpInput = document.getElementById("otp");
const messageEl = document.getElementById("message");

const passwordLoginBtn = document.getElementById("passwordLoginBtn");
const otpLoginBtn = document.getElementById("otpLoginBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const otpSection = document.getElementById("otpSection");

// 🔐 Password login
passwordLoginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!isValidEmail(email)) {
    showMessage(messageEl, "Please enter a valid email address.");
    return;
  }
  if (!password) {
    showMessage(messageEl, "Please enter your password.");
    return;
  }

  const restore = setLoading(passwordLoginBtn, "Logging in...");
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(messageEl, data.message);
      return;
    }

    await redirectAfterLogin(data.token);
  } catch (err) {
    showMessage(messageEl, "Network error. Please try again.");
  } finally {
    restore();
  }
});

// 📩 OTP login — send OTP
otpLoginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    showMessage(messageEl, "Please enter a valid email address.");
    return;
  }

  const restore = setLoading(otpLoginBtn, "Sending OTP...");
  try {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "login" }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(messageEl, data.message);
      return;
    }

    otpSection.style.display = "block";
    showMessage(messageEl, "OTP sent to your email.", false);
  } catch (err) {
    showMessage(messageEl, "Network error. Please try again.");
  } finally {
    restore();
  }
});

// ✅ Verify OTP
verifyOtpBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const otp = otpInput.value.trim();

  if (!otp) {
    showMessage(messageEl, "Please enter the OTP.");
    return;
  }

  const restore = setLoading(verifyOtpBtn, "Verifying...");
  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, purpose: "login" }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(messageEl, data.message);
      return;
    }

    await redirectAfterLogin(data.token);
  } catch (err) {
    showMessage(messageEl, "Network error. Please try again.");
  } finally {
    restore();
  }
});
