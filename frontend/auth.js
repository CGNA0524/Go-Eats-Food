// Authentication controller for login and signup pages

let isLoading = false;

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

const loginSubmit = document.getElementById('login-submit');
const signupSubmit = document.getElementById('signup-submit');

const switchToSignup = document.getElementById('switch-to-signup');
const switchToLogin = document.getElementById('switch-to-login');

// Show login form by default
loginForm.style.display = 'block';

// Form switching
switchToSignup.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  signupForm.style.display = 'block';
  clearMessages();
});

switchToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  signupForm.style.display = 'none';
  loginForm.style.display = 'block';
  clearMessages();
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  successMessage.classList.remove('show');
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.classList.add('show');
  errorMessage.classList.remove('show');
}

function clearMessages() {
  errorMessage.classList.remove('show');
  successMessage.classList.remove('show');
}

function setLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span>Loading...';
    isLoading = true;
  } else {
    button.disabled = false;
    button.innerHTML = button.id === 'login-submit' ? 'Sign In' : 'Create Account';
    isLoading = false;
  }
}

// Login handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isLoading) return;

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  setLoading(loginSubmit, true);
  clearMessages();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      showSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
    } else {
      showError(data.error || 'Login failed');
    }
  } catch (error) {
    showError('Connection error: ' + error.message);
  } finally {
    setLoading(loginSubmit, false);
  }
});

// Signup handler
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isLoading) return;

  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;

  if (!name || !email || !password || !confirm) {
    showError('Please fill in all fields');
    return;
  }

  if (password !== confirm) {
    showError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }

  setLoading(signupSubmit, true);
  clearMessages();

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      showSuccess('Account created! Redirecting...');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
    } else {
      showError(data.error || 'Signup failed');
    }
  } catch (error) {
    showError('Connection error: ' + error.message);
  } finally {
    setLoading(signupSubmit, false);
  }
});

// Check if already logged in
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/dashboard.html';
  }
});
