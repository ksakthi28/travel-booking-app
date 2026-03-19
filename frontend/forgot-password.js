const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const newPasswordInput = document.getElementById("newPassword");

const sendOtpBtn = document.getElementById("sendOtpBtn");
const resetBtn = document.getElementById("resetBtn");

const otpSection = document.getElementById("otpSection");
const message = document.getElementById("message");

// 📩 Send OTP
sendOtpBtn.addEventListener("click", async () => {
  const email = emailInput.value;

  if (!email) {
    message.innerText = "Email is required";
    return;
  }

  sendOtpBtn.disabled = true;

  const res = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "forgot_password" })
  });

  const data = await res.json();

  if (!res.ok) {
    message.innerText = data.message;
    sendOtpBtn.disabled = false;
    return;
  }

  otpSection.style.display = "block";
  message.innerText = "OTP sent. Check email preview.";
  sendOtpBtn.innerText = "OTP Sent";
});

// 🔐 Reset Password
resetBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const otp = otpInput.value;
  const newPassword = newPasswordInput.value;

  if (!otp || !newPassword) {
    message.innerText = "OTP and new password required";
    return;
  }

  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      otp,
      newPassword,
      purpose: "forgot_password"
    })
  });

  const data = await res.json();

  if (!res.ok) {
    message.innerText = data.message;
    return;
  }

  message.innerText = "Password reset successful. Redirecting to login...";
  setTimeout(() => {
    window.location.href = "login.html";
  }, 2000);
});
