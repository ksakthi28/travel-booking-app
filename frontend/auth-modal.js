(() => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'auth-modal.css';
  document.head.appendChild(link);

  const modalHTML = `
  <div id="authModal" class="auth-modal-overlay" style="display:none;">
    <div class="auth-modal-content">
      <span class="auth-modal-close" onclick="closeAuthModal()">&times;</span>
      <div class="auth-modal-tabs">
        <button id="tabLogin" class="auth-tab active" onclick="switchAuthTab('login')">Login</button>
        <button id="tabRegister" class="auth-tab" onclick="switchAuthTab('register')">Register</button>
      </div>

      <!-- Login Form -->
      <div id="loginFormContainer" style="text-align: left;">
        <h2 class="text-center mb-4">Welcome Back</h2>
        <div class="form-group">
          <label for="modalLoginEmail">Email Address</label>
          <input type="email" id="modalLoginEmail" placeholder="name@example.com" />
        </div>
        <div class="form-group">
          <label for="modalLoginPassword">Password</label>
          <input type="password" id="modalLoginPassword" placeholder="••••••••" />
        </div>
        <button id="modalLoginBtn" class="btn" onclick="handleModalLogin()">Login</button>
        <p id="modalLoginMessage" class="message"></p>
      </div>

      <!-- Register Form -->
      <div id="registerFormContainer" style="display:none; text-align: left;">
        <h2 class="text-center mb-4">Create Account</h2>
        <div class="form-group">
          <label for="modalRegName">Full Name</label>
          <input type="text" id="modalRegName" placeholder="John Doe" />
        </div>
        <div class="form-group">
          <label for="modalRegEmail">Email Address</label>
          <input type="email" id="modalRegEmail" placeholder="name@example.com" />
        </div>
        <div class="form-group">
          <label for="modalRegMobile">Mobile Number</label>
          <input type="text" id="modalRegMobile" placeholder="9876543210" />
        </div>
        <div class="form-group">
          <label for="modalRegPassword">Password</label>
          <input type="password" id="modalRegPassword" placeholder="Min. 6 characters" />
        </div>
        <button id="modalRegBtn" class="btn" onclick="handleModalRegister()">Register</button>
        <p id="modalRegMessage" class="message"></p>
      </div>
    </div>
  </div>`;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
})();

window.openAuthModal = function(tab = 'login') {
  document.getElementById('authModal').style.display = 'flex';
  switchAuthTab(tab);
};

window.closeAuthModal = function() {
  document.getElementById('authModal').style.display = 'none';
};

window.switchAuthTab = function(tab) {
  if (tab === 'login') {
    document.getElementById('loginFormContainer').style.display = 'block';
    document.getElementById('registerFormContainer').style.display = 'none';
    document.getElementById('tabLogin').classList.add('active');
    document.getElementById('tabRegister').classList.remove('active');
  } else {
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('registerFormContainer').style.display = 'block';
    document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('tabRegister').classList.add('active');
  }
};

window.handleModalLogin = async function() {
  const email = document.getElementById("modalLoginEmail").value.trim();
  const password = document.getElementById("modalLoginPassword").value;
  const messageEl = document.getElementById("modalLoginMessage");

  if (!email || !password) {
    showMessage(messageEl, "Please fill in all fields.");
    return;
  }

  const btn = document.getElementById("modalLoginBtn");
  const restore = setLoading(btn, "Logging in...");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      showMessage(messageEl, data.message || "Login failed.");
      return;
    }

    showMessage(messageEl, "Login successful!", false);
    setTimeout(() => {
      // Just reload the current page to reflect logged-in state
      localStorage.setItem("token", data.token);
      window.location.reload(); 
    }, 1000);

  } catch (err) {
    showMessage(messageEl, "Network error.");
  } finally {
    restore();
  }
};

window.handleModalRegister = async function() {
  const name = document.getElementById("modalRegName").value.trim();
  const email = document.getElementById("modalRegEmail").value.trim();
  const mobile = document.getElementById("modalRegMobile").value.trim();
  const password = document.getElementById("modalRegPassword").value;
  const messageEl = document.getElementById("modalRegMessage");

  if (!name || !email || !mobile || !password) {
    showMessage(messageEl, "Please fill in all fields.");
    return;
  }

  if (!/^[6-9]\\d{9}$/.test(mobile)) {
    showMessage(messageEl, "Enter a valid 10-digit mobile number.");
    return;
  }

  const btn = document.getElementById("modalRegBtn");
  const restore = setLoading(btn, "Registering...");

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, mobile, password })
    });

    const data = await res.json();
    if (!res.ok) {
      showMessage(messageEl, data.message || "Registration failed.");
      return;
    }

    showMessage(messageEl, "Registration successful! You can now login.", false);
    setTimeout(() => {
      switchAuthTab('login');
      document.getElementById("modalLoginEmail").value = email;
    }, 1500);

  } catch (err) {
    showMessage(messageEl, "Network error.");
  } finally {
    restore();
  }
};
