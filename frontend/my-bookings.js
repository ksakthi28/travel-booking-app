console.log("🔥 my-bookings.js loaded");

const token = localStorage.getItem("token");
const bookingList = document.getElementById("bookingList");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

async function loadBookings() {
  try {
    const res = await fetch("/api/bookings/my", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (res.status === 401) {
      message.innerText = "Session expired. Please login again.";
      localStorage.removeItem("token");
      return;
    }

    const bookings = await res.json();

    console.log("Bookings from API:", bookings);

    if (!bookings.length) {
      message.innerText = "No bookings found.";
      return;
    }

    bookings.forEach(b => {
      const li = document.createElement("li");
      li.innerText =
        "Car: " + b.carName +
        " | Pickup: " + b.pickupDate +
        " | Drop: " + b.dropDate;

      bookingList.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    message.innerText = "Failed to load bookings.";
  }
}

loadBookings();
