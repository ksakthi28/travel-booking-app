document.addEventListener("DOMContentLoaded", loadBookings);

async function loadBookings() {
  const token = getToken(); // from auth.js
  const container = document.getElementById("bookingsContainer");

  if (!token) return; // protectPage() handles redirect

  try {
    const res = await fetch("/api/bookings/my", {
      headers: { Authorization: "Bearer " + token },
    });

    const bookings = await res.json();

    if (!Array.isArray(bookings) || bookings.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🌴</div>
          <h3 style="margin-bottom: 0.5rem; font-size: 1.5rem;">No trips planned yet</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Time to book your first adventure!</p>
          <a href="booking.html" class="btn" style="width: auto;">Book a Car</a>
        </div>
      `;
      // remove grid gap if empty state
      container.style.display = "block";
      return;
    }

    container.innerHTML = "";
    container.style.display = "grid"; // ensure grid is back on if they had bookings

    bookings.forEach((b) => {
      
      // Formatting
      const pickupDateObj = b.pickupDate ? new Date(b.pickupDate) : null;
      const dateFormatted = pickupDateObj 
        ? pickupDateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : "Pending";
        
      const statusClass = b.status.toLowerCase(); // pending, approved, cancelled
      const canCancel = statusClass === "pending";

      // Build HTML for the card
      const div = document.createElement("div");
      div.className = "booking-card";

      div.innerHTML = `
        <div class="card-strip strip-${statusClass}"></div>
        
        <div class="card-header">
          <div>
            <h3>${b.bookingName}</h3>
            <div class="journey">
              <span>${b.fromPlace}</span>
              <span>→</span>
              <span>${b.toPlace}</span>
            </div>
          </div>
          <span class="status-badge ${statusClass}">${b.status}</span>
        </div>
        
        <div class="card-body">
          <div class="info-group">
            <span class="info-label">Travel Date</span>
            <span class="info-value">📅 ${dateFormatted}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Car Type</span>
            <span class="info-value">🚗 ${b.seats} Seater</span>
          </div>
          <div class="info-group">
            <span class="info-label">Passengers</span>
            <span class="info-value">👥 ${b.peopleCount} Total</span>
          </div>
          <div class="info-group">
            <span class="info-label">Contact</span>
            <span class="info-value">📱 ${b.mobile}</span>
          </div>
        </div>
        
        <div class="card-footer">
          <span style="font-size: 0.8rem; color: var(--text-muted);">ID: ...${b._id.slice(-6)}</span>
          ${canCancel 
            ? `<button id="cancel-${b._id}" class="cancel-btn" onclick="cancelBooking('${b._id}', this)">Cancel Trip</button>` 
            : `<span style="font-size: 0.8rem; color: var(--text-muted);">${statusClass === 'approved' ? 'Confirmed' : 'Cancelled'}</span>`
          }
        </div>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
        <p class="error-text">Failed to load bookings. Please check your connection.</p>
      </div>
    `;
  }
}

async function cancelBooking(bookingId, btn) {
  if (!confirm("Are you sure you want to cancel this trip? This action cannot be undone.")) return;

  const originalText = btn.innerText;
  btn.disabled = true;
  btn.innerText = "Cancelling...";

  try {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + getToken() },
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to cancel booking.");
      btn.disabled = false;
      btn.innerText = originalText;
      return;
    }

    // Refresh the list to show cancelled status
    loadBookings();
    
  } catch (err) {
    alert("Network error. Please try again.");
    btn.disabled = false;
    btn.innerText = originalText;
  }
}
