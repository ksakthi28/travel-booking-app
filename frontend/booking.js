console.log("✅ booking.js loaded");

// 🔒 PROTECT PAGE
const token = localStorage.getItem("token");

if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

// 👤 LOAD USER
async function loadUser() {
  try {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const user = await res.json();

    document.getElementById("userInfo").innerText =
      "Welcome, " + user.name;

  } catch (err) {
    console.error("LOAD USER ERROR:", err);
  }
}

loadUser();

// 🚗 CREATE BOOKING
document.getElementById("bookingForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const carName = document.getElementById("carName").value;
  const pickupDate = document.getElementById("pickupDate").value;
  const dropDate = document.getElementById("dropDate").value;

  const res = await fetch("http://localhost:5000/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ carName, pickupDate, dropDate })
  });

  const data = await res.json();
  document.getElementById("message").innerText = data.message;
});

// 🚪 LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  alert("Logged out successfully");
  window.location.href = "login.html";
});
