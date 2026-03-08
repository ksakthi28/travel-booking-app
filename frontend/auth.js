/**
 * auth.js — Shared frontend auth utility
 * Centralises: token management, redirect-after-login, and button loading states
 */

const API = "/api/auth";

/** Save token and redirect to booking or admin dashboard based on role */
async function redirectAfterLogin(token) {
  localStorage.setItem("token", token);

  try {
    const res = await fetch(`${API}/me`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (res.ok) {
      const user = await res.json();
      window.location.href = user.role === "admin" ? "admin-dashboard.html" : "booking.html";
      return;
    }
  } catch (_) {}
  window.location.href = "booking.html";
}

/** Display an error message in an element */
function showMessage(el, msg, isError = true) {
  if (!el) return;
  el.innerText = msg;
  el.style.color = isError ? "#dc3545" : "#198754";
}

/** Set a button into loading state, return restore function */
function setLoading(btn, loadingText = "Please wait...") {
  const original = btn.innerText;
  btn.disabled = true;
  btn.innerText = loadingText;
  return () => {
    btn.disabled = false;
    btn.innerText = original;
  };
}

/** Basic email format check */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Get stored token */
function getToken() {
  return localStorage.getItem("token");
}

/** Logout */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/**
 * protectPage() — Call at top of any authenticated page.
 * Redirects unauthenticated users to login.
 * Pass isAdmin=true to also redirect non-admins.
 */
async function protectPage(isAdmin = false) {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  if (isAdmin) {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: "Bearer " + token },
      });
      const user = await res.json();
      if (!res.ok || user.role !== "admin") {
        window.location.href = "booking.html";
      }
    } catch (_) {
      window.location.href = "login.html";
    }
  }
}

/**
 * protectServerAccess() — Call on login/register pages.
 * Redirects already-logged-in users to booking page.
 */
function protectServerAccess() {
  const token = getToken();
  if (token) {
    window.location.href = "booking.html";
  }
}

