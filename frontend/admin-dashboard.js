document.addEventListener("DOMContentLoaded", () => {
  loadBookings();
  loadUsers();
});

function switchTab(tabName) {
  // Update UI tabs
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');

  // Switch Sections
  document.getElementById('section-bookings').style.display = tabName === 'bookings' ? 'block' : 'none';
  document.getElementById('section-users').style.display = tabName === 'users' ? 'block' : 'none';
}

// ─── USERS MANAGEMENT ─────────────────────────────────────────
async function loadUsers() {
  const token = getToken();
  const tbody = document.getElementById("usersBody");

  try {
    const res = await fetch("/api/auth/users", {
      headers: { Authorization: "Bearer " + token }
    });
    
    const users = await res.json();
    
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center error-text">${users.message || "Failed to load"}</td></tr>`;
      return;
    }

    if (!Array.isArray(users) || users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    
    users.forEach(u => {
      const dateJoined = new Date(u.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
      const roleBadge = u.role === 'admin' 
        ? `<span class="status-badge" style="background:#4a0d30; color:#fff;">Admin</span>`
        : `<span class="status-badge" style="background:#e0e0e0; color:#333;">User</span>`;
        
      const verifiedFormat = u.isVerified 
        ? `<span style="color:var(--success)">✓ Verified</span>` 
        : `<span style="color:var(--text-muted)">Unverified</span>`;

      tbody.innerHTML += `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td>${u.mobile || "N/A"}</td>
          <td>${roleBadge}</td>
          <td>${verifiedFormat}</td>
          <td>${dateJoined}</td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center error-text">Network error loading users</td></tr>`;
  }
}

// ─── BOOKINGS MANAGEMENT ──────────────────────────────────────
let allBookings = [];

async function loadBookings() {
  const token = getToken();
  const tbody = document.getElementById("bookingsBody");

  try {
    const res = await fetch("/api/bookings/all", {
      headers: { Authorization: "Bearer " + token }
    });
    
    allBookings = await res.json();
    
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center error-text">${allBookings.message}</td></tr>`;
      return;
    }
    
    renderBookings("all");

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center error-text">Network Error</td></tr>`;
  }
}

function renderBookings(statusFilter) {
  const tbody = document.getElementById("bookingsBody");
  
  const filtered = allBookings.filter(b => 
    statusFilter === "all" ? true : b.status === statusFilter
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">No bookings found for this filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  
  filtered.forEach(b => {
    // b.user is populated object { _id, name, email }
    const userName = b.user ? b.user.name : "Unknown User";
    const userEmail = b.user ? b.user.email : "";
    
    const pickupFormatted = b.pickupDate 
      ? new Date(b.pickupDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) 
      : "—";

    const isPending = b.status === "pending";
    const statusClass = b.status.toLowerCase();

    // The backend uses string formats for currency/distance if approved, else generic
    const distText = b.distance ? `${b.distance} km` : "—";
    const amtText = b.amount ? `₹${b.amount}` : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div style="font-weight:600;">${userName}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">${userEmail}</div>
      </td>
      <td>
        <div style="font-weight:600;">${b.seats} Seater</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">${b.peopleCount} pax</div>
      </td>
      <td>${b.fromPlace} → ${b.toPlace}</td>
      <td>${pickupFormatted}</td>
      <td>${distText}</td>
      <td>${amtText}</td>
      <td><span class="status-badge ${statusClass}">${b.status}</span></td>
      <td>
        ${isPending ? `
          <button class="action-btn btn-approve" onclick="openApproveModal('${b._id}')">Approve</button>
          <button class="action-btn btn-reject" onclick="changeStatus('${b._id}', 'cancelled')">Reject</button>
        ` : '—'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── FILTERING ────────────────────────────────────────────────
document.querySelectorAll(".btn-filter").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    renderBookings(e.target.getAttribute("data-filter"));
  });
});

// ─── STATUS UPDATES (REJECT/APPROVE) ──────────────────────────
async function changeStatus(bookingId, newStatus, extraData = {}) {
  if (newStatus === 'cancelled' && !confirm("Are you sure you want to reject this booking?")) return;
  
  const token = getToken();

  // We reuse the user-level cancel route for admin rejection, or create specific admin ones
  // It's cleaner to have a specific admin endpoint, e.g. /api/bookings/:id/admin-update
  try {
    const res = await fetch(`/api/bookings/${bookingId}/admin-update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ status: newStatus, ...extraData })
    });

    if (res.ok) {
      loadBookings(); // refresh list
    } else {
      const data = await res.json();
      alert(data.message || "Failed to update status");
    }
  } catch (err) {
    alert("Network Error");
  }
}

// ─── MODAL LOGIC ──────────────────────────────────────────────
const modal = document.getElementById("approveModal");

function openApproveModal(id) {
  document.getElementById("approveBookingId").value = id;
  document.getElementById("approveDistance").value = "";
  document.getElementById("approveAmount").value = "";
  modal.classList.add("show");
}

function closeApproveModal() {
  modal.classList.remove("show");
}

document.getElementById("closeApproveModal").addEventListener("click", closeApproveModal);

document.getElementById("approveForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("approveBookingId").value;
  const distance = document.getElementById("approveDistance").value;
  const amount = document.getElementById("approveAmount").value;
  
  changeStatus(id, "approved", { distance, amount });
  closeApproveModal();
});
