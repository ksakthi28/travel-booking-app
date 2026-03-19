// Register page — uses shared auth utility from auth.js
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const otpInput = document.getElementById("otp");

const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");

const otpSection = document.getElementById("otpSection");
const messageEl = document.getElementById("message");

// 📩 Send OTP for registration
sendOtpBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    showMessage(messageEl, "Please enter a valid email address.");
    return;
  }

  const restore = setLoading(sendOtpBtn, "Sending OTP...");
  try {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "register" }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(messageEl, data.message);
      return;
    }

    otpSection.style.display = "block";
    showMessage(messageEl, "OTP sent to your email.", false);
    sendOtpBtn.innerText = "OTP Sent ✓";
    // Keep button disabled — don't let them spam
  } catch (err) {
    showMessage(messageEl, "Network error. Please try again.");
    restore();
  }
});

// ✅ Verify OTP & Register
verifyOtpBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const otp = otpInput.value.trim();

  if (!name) { showMessage(messageEl, "Name is required."); return; }
  if (!isValidEmail(email)) { showMessage(messageEl, "Please enter a valid email."); return; }
  if (password.length < 6) { showMessage(messageEl, "Password must be at least 6 characters."); return; }
  if (!otp) { showMessage(messageEl, "Please enter the OTP."); return; }

  const restore = setLoading(verifyOtpBtn, "Registering...");
  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, otp, purpose: "register" }),
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
