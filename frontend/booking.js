document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken(); // from auth.js

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Auto-fill name and mobile from logged-in user if available
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: "Bearer " + token }
    });

    const user = await res.json();
    if (res.ok) {
      if (user.name) document.getElementById("bookingName").value = user.name;
      // If we had mobile in user model, we'd pre-fill it here
    }
  } catch (err) {
    console.error("Failed to load user profile");
  }
});

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = getToken(); // from auth.js
  const messageEl = document.getElementById("message");
  const submitBtn = document.getElementById("submitBookingBtn");

  // Get values safely using document.getElementById to avoid variable shadowing bugs
  const bookingName = document.getElementById("bookingName").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const seats = document.getElementById("seats").value;
  const fromPlace = document.getElementById("fromPlace").value.trim();
  const toPlace = document.getElementById("toPlace").value.trim();
  const pickupDate = document.getElementById("pickupDate").value;
  
  const peopleCount = Number(document.getElementById("peopleCount").value);
  const menCount = Number(document.getElementById("menCount").value) || 0;
  const womenCount = Number(document.getElementById("womenCount").value) || 0;
  const childrenCount = Number(document.getElementById("childrenCount").value) || 0;

  // Validation
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    showMessage(messageEl, "Please enter a valid 10-digit mobile number.");
    return;
  }

  if (menCount + womenCount + childrenCount !== peopleCount) {
    showMessage(messageEl, "Men + Women + Children must equal Total People.");
    return;
  }

  const restore = setLoading(submitBtn, "Processing Request...");

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        bookingName,
        mobile,
        seats,
        fromPlace,
        toPlace,
        pickupDate,
        peopleCount,
        menCount,
        womenCount,
        childrenCount
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(messageEl, data.message || "Booking failed to process.");
      return;
    }

    showMessage(messageEl, "Booking placed successfully! Redirecting...", false);
    
    // Auto-redirect to My Bookings after successful booking
    setTimeout(() => {
      window.location.href = "my-bookings.html";
    }, 1500);

  } catch (err) {
    showMessage(messageEl, "Network error. Please try again.");
  } finally {
    restore();
  }
});

// Auto-calculate Total People based on M/W/C inputs
const inputs = ["menCount", "womenCount", "childrenCount"];
inputs.forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    const m = Number(document.getElementById("menCount").value) || 0;
    const w = Number(document.getElementById("womenCount").value) || 0;
    const c = Number(document.getElementById("childrenCount").value) || 0;
    document.getElementById("peopleCount").value = m + w + c;
  });
});
