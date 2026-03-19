const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const message = document.getElementById("message");

document.getElementById("changePasswordBtn").addEventListener("click", async () => {
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;

  if (!currentPassword || !newPassword) {
    message.innerText = "All fields are required";
    return;
  }

  const token = localStorage.getItem("token");

  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await res.json();

  if (!res.ok) {
    message.innerText = data.message;
    return;
  }

  message.innerText = "Password changed successfully";
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
});
