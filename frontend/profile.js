// Profile section controller

export function renderProfileSection(user) {
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">Account Profile</h2>
        <p class="section-subtitle">Manage your account settings and preferences</p>
      </div>
    </div>

    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar">${user.name.charAt(0).toUpperCase()}</div>
        <div class="profile-info">
          <h3>${user.name}</h3>
          <p>${user.email}</p>
          <span class="role-badge">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
        </div>
      </div>

      <div class="profile-sections">
        <div class="profile-section">
          <h4>Account Information</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Full Name</span>
              <span class="value">${user.name}</span>
            </div>
            <div class="info-item">
              <span class="label">Email</span>
              <span class="value">${user.email}</span>
            </div>
            <div class="info-item">
              <span class="label">Role</span>
              <span class="value">${user.role}</span>
            </div>
            <div class="info-item">
              <span class="label">Account Status</span>
              <span class="value" style="color: #4caf50;">✓ Active</span>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h4>Update Profile</h4>
          <form class="profile-form" id="update-profile-form">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value="${user.name}" required>
            </div>

            <div class="form-divider"></div>

            <h5 style="margin-top: 24px; margin-bottom: 16px; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Change Password</h5>

            <div class="form-group">
              <label>Current Password</label>
              <input type="password" name="current_password" placeholder="Enter current password">
            </div>

            <div class="form-group">
              <label>New Password</label>
              <input type="password" name="new_password" placeholder="Leave blank to keep current password">
            </div>

            <div class="form-group">
              <label>Confirm New Password</label>
              <input type="password" name="confirm_password" placeholder="Confirm new password">
            </div>

            <div class="form-group" style="margin-top: 24px;">
              <button type="submit" class="button button-primary" data-action="save-profile">Save Changes</button>
            </div>
          </form>
        </div>

        <div class="profile-section logout-section">
          <h4>Session</h4>
          <p style="margin-bottom: 16px; color: var(--muted);">Sign out from this device</p>
          <button class="button button-danger" data-action="logout">Logout</button>
        </div>
      </div>
    </div>
  `;
}

export function setupProfileHandlers() {
  const form = document.getElementById('update-profile-form');
  if (form) {
    form.addEventListener('submit', handleUpdateProfile);
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();

  const name = document.querySelector('[name="name"]').value.trim();
  const currentPassword = document.querySelector('[name="current_password"]').value;
  const newPassword = document.querySelector('[name="new_password"]').value;
  const confirmPassword = document.querySelector('[name="confirm_password"]').value;

  if (!name) {
    alert('Name is required');
    return;
  }

  // Check password change validation
  if (newPassword || currentPassword) {
    if (!currentPassword) {
      alert('Current password is required to change password');
      return;
    }
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
  }

  const token = localStorage.getItem('token');
  const payload = {
    name,
    ...(newPassword && { current_password: currentPassword, new_password: newPassword }),
  };

  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      // Update stored user info
      const user = JSON.parse(localStorage.getItem('user'));
      user.name = name;
      localStorage.setItem('user', JSON.stringify(user));

      alert('Profile updated successfully!');
      window.location.reload();
    } else {
      alert('Error: ' + (data.error || 'Failed to update profile'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
