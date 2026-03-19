window.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch("/api/auth/me", {
    headers: { Authorization: "Bearer " + token },
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("message").innerText = "Failed to load profile. Please login again.";
    return;
  }

  document.getElementById("name").innerText = data.name;
  document.getElementById("email").innerText = data.email;
});
