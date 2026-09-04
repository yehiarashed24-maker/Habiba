/**
 * ============================================================================
 * HABIBA MOTIF GALLERY - ATELIER ADMIN ENGINE (admin.js)
 * End-to-End Cryptographic Authentication, Gallery CRUD, Dynamic Sync & Vault
 * ============================================================================
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION & CRYPTOGRAPHIC CONSTANTS
  // ---------------------------------------------------------------------------
  const STORAGE_KEY_ARTWORKS = 'hm_gallery_artworks';
  const STORAGE_KEY_AUTH_HASH = 'hm_admin_auth_hash';
  const STORAGE_KEY_AUTH_SALT = 'hm_admin_auth_salt';
  const STORAGE_KEY_SESSION = 'hm_admin_session_token';
  const STORAGE_KEY_ATTEMPTS = 'hm_auth_failed_attempts';
  const STORAGE_KEY_LOCKOUT = 'hm_auth_lockout_time';

  // Precomputed Salted SHA-256 Vault Hash
  const DEFAULT_SALT = 'HabibaMotifSecretAtelier2026';
  const DEFAULT_HASH_HEX = '72bcf7c4c859a89ea719d27755f4e1974505f8527904a7020e3a619c467bc587';

  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

  // Runtime State
  let artworksList = [];
  let lockoutInterval = null;

  // ---------------------------------------------------------------------------
  // 2. CRYPTOGRAPHIC HELPERS (Web Crypto API)
  // ---------------------------------------------------------------------------
  async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getActiveSalt() {
    return localStorage.getItem(STORAGE_KEY_AUTH_SALT) || DEFAULT_SALT;
  }

  function getActiveHash() {
    return localStorage.getItem(STORAGE_KEY_AUTH_HASH) || DEFAULT_HASH_HEX;
  }

  function generateSessionToken() {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const token = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const expiry = Date.now() + SESSION_DURATION_MS;
    const sessionData = { token, expiry };
    sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionData));
  }

  function isSessionValid() {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (!sessionRaw) return false;
    try {
      const session = JSON.parse(sessionRaw);
      if (session && session.expiry && Date.now() < session.expiry) {
        return true;
      }
    } catch (e) {}
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    return false;
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('adminPassword').value = '';
    showToast('Signed out securely');
  }

  // ---------------------------------------------------------------------------
  // 3. BRUTE-FORCE PROTECTION & RATE LIMITING
  // ---------------------------------------------------------------------------
  function checkLockout() {
    const lockoutUntil = parseInt(localStorage.getItem(STORAGE_KEY_LOCKOUT) || '0', 10);
    const now = Date.now();

    if (lockoutUntil && now < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil - now) / 1000);
      enableLockoutUI(remainingSec);
      return true;
    }

    if (lockoutUntil && now >= lockoutUntil) {
      localStorage.removeItem(STORAGE_KEY_LOCKOUT);
      localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      disableLockoutUI();
    }
    return false;
  }

  function recordFailedAttempt() {
    let attempts = parseInt(localStorage.getItem(STORAGE_KEY_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, attempts.toString());

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(STORAGE_KEY_LOCKOUT, lockoutUntil.toString());
      checkLockout();
    } else {
      const remaining = MAX_FAILED_ATTEMPTS - attempts;
      showAuthError(`Invalid password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`);
    }
  }

  function resetFailedAttempts() {
    localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEY_LOCKOUT);
  }

  function enableLockoutUI(secondsRemaining) {
    const notice = document.getElementById('lockoutNotice');
    const text = document.getElementById('lockoutText');
    const input = document.getElementById('adminPassword');
    const btn = document.getElementById('btnLogin');

    input.disabled = true;
    btn.disabled = true;
    notice.style.display = 'flex';

    clearInterval(lockoutInterval);
    let sec = secondsRemaining;

    const updateText = () => {
      const mins = Math.floor(sec / 60);
      const secs = sec % 60;
      text.textContent = `Security lockout active. Try again in ${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    updateText();
    lockoutInterval = setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(lockoutInterval);
        disableLockoutUI();
      } else {
        updateText();
      }
    }, 1000);
  }

  function disableLockoutUI() {
    const notice = document.getElementById('lockoutNotice');
    const input = document.getElementById('adminPassword');
    const btn = document.getElementById('btnLogin');

    input.disabled = false;
    btn.disabled = false;
    notice.style.display = 'none';
    hideAuthError();
  }

  function showAuthError(msg) {
    const errBox = document.getElementById('authErrorMsg');
    const errText = document.getElementById('authErrorText');
    errText.textContent = msg;
    errBox.style.display = 'flex';
  }

  function hideAuthError() {
    document.getElementById('authErrorMsg').style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // 4. AUTHENTICATION CONTROLLER
  // ---------------------------------------------------------------------------
  async function handleLogin() {
    if (checkLockout()) return;

    const input = document.getElementById('adminPassword');
    const password = input.value.trim();

    if (!password) {
      showAuthError('Please enter your security key.');
      return;
    }

    const salt = getActiveSalt();
    const expectedHash = getActiveHash();
    const computedHash = await sha256(password + salt);

    if (computedHash === expectedHash) {
      resetFailedAttempts();
      generateSessionToken();
      enterDashboard();
    } else {
      recordFailedAttempt();
    }
  }

  function enterDashboard() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    initDashboard();
  }

  // ---------------------------------------------------------------------------
  // 5. ARTWORKS DATA LAYER
  // ---------------------------------------------------------------------------
  async function loadArtworks() {
    // 1. Check local administrative vault
    const localData = localStorage.getItem(STORAGE_KEY_ARTWORKS);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          artworksList = parsed;
          return;
        }
      } catch (e) {}
    }

    // 2. Fetch seed file if local vault empty
    try {
      const response = await fetch('assets/data/artworks.json');
      if (response.ok) {
        artworksList = await response.json();
        saveArtworksLocally();
        return;
      }
    } catch (e) {
      console.warn('Could not fetch artworks.json, initializing empty or fallback:', e);
    }

    artworksList = [];
  }

  function saveArtworksLocally() {
    localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(artworksList));
    updateStats();
    autoSyncIfConfigured();
  }

  // ---------------------------------------------------------------------------
  // 6. DASHBOARD RENDERING & OPERATIONS
  // ---------------------------------------------------------------------------
  function initDashboard() {
    loadArtworks().then(() => {
      renderArtworksTable();
      updateStats();
    });
  }

  function updateStats() {
    const totalCount = artworksList.length;
    const categories = new Set(artworksList.map(a => (a.category || '').toLowerCase()));

    document.getElementById('statTotalArtworks').textContent = totalCount;
    document.getElementById('statTotalCategories').textContent = categories.size;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderArtworksTable() {
    const tbody = document.getElementById('artworksTableBody');
    const emptyState = document.getElementById('artworksEmptyState');
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';

    tbody.innerHTML = '';

    const filtered = artworksList.filter(item => {
      const matchesSearch =
        !searchVal ||
        (item.title && item.title.toLowerCase().includes(searchVal)) ||
        (item.category && item.category.toLowerCase().includes(searchVal)) ||
        (item.price && item.price.toLowerCase().includes(searchVal));

      const matchesCat = categoryFilter === 'all' || (item.category && item.category.toLowerCase() === categoryFilter);

      return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    filtered.forEach((item, index) => {
      const tr = document.createElement('tr');
      const catClass = `cat-${(item.category || '').toLowerCase()}`;
      const imgSrc = item.image || item.fallbackImage || 'assets/images/logo.jpg';
      const glowColor = item.ambientColor || '#3b2b1f';

      tr.innerHTML = `
        <td style="color: var(--admin-text-muted); font-size: 0.8rem; font-weight: 600;">${index + 1}</td>
        <td>
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title)}" class="table-art-preview" onerror="this.src='assets/images/logo.jpg'">
        </td>
        <td>
          <div class="table-art-title">${escapeHtml(item.title)}</div>
          <div class="table-art-artist">${escapeHtml(item.artist || 'Habiba maarek')}</div>
        </td>
        <td>
          <span class="cat-badge ${catClass}">${escapeHtml(item.category || 'General')}</span>
        </td>
        <td class="table-art-price">${escapeHtml(item.price || 'EGP —')}</td>
        <td>
          <span class="color-dot-preview" style="background-color: ${glowColor};" title="Ambient Lighting: ${glowColor}"></span>
        </td>
        <td>
          <div class="order-buttons">
            <button type="button" class="btn-order-arrow btn-order-up" data-id="${item.id}" title="Move Up" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>
              <i class="fa-solid fa-chevron-up"></i>
            </button>
            <button type="button" class="btn-order-arrow btn-order-down" data-id="${item.id}" title="Move Down" ${index === filtered.length - 1 ? 'disabled style="opacity:0.3"' : ''}>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>
        </td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn-action-icon btn-action-edit" data-id="${item.id}" title="Edit Artwork">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-action-icon btn-action-delete" data-id="${item.id}" title="Delete Artwork">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Rebind Action Listeners
    tbody.querySelectorAll('.btn-action-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditArtworkModal(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteArtwork(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-order-up').forEach(btn => {
      btn.addEventListener('click', () => moveArtwork(btn.getAttribute('data-id'), -1));
    });

    tbody.querySelectorAll('.btn-order-down').forEach(btn => {
      btn.addEventListener('click', () => moveArtwork(btn.getAttribute('data-id'), 1));
    });
  }

  // ---------------------------------------------------------------------------
  // 7. ARTWORK MODAL & FORM OPERATIONS
  // ---------------------------------------------------------------------------
  const artworkModal = document.getElementById('artworkModal');
  const artworkForm = document.getElementById('artworkForm');
  const inputTitle = document.getElementById('inputTitle');
  const inputCategory = document.getElementById('inputCategory');
  const inputCustomCategory = document.getElementById('inputCustomCategory');
  const customCategoryRow = document.getElementById('customCategoryRow');
  const inputPrice = document.getElementById('inputPrice');
  const inputImageUrl = document.getElementById('inputImageUrl');
  const inputFileUpload = document.getElementById('inputFileUpload');
  const imagePreviewImg = document.getElementById('imagePreviewImg');
  const imageUploadPlaceholder = document.getElementById('imageUploadPlaceholder');
  const inputLink = document.getElementById('inputLink');
  const inputAmbientColor = document.getElementById('inputAmbientColor');
  const artworkEditId = document.getElementById('artworkEditId');

  function openAddArtworkModal() {
    artworkForm.reset();
    artworkEditId.value = '';
    document.getElementById('artworkModalTitle').textContent = 'Add New Artwork';
    imagePreviewImg.style.display = 'none';
    imagePreviewImg.src = '';
    imageUploadPlaceholder.style.display = 'flex';
    customCategoryRow.style.display = 'none';
    inputAmbientColor.value = '#3b2b1f';

    artworkModal.classList.add('active');
    artworkModal.setAttribute('aria-hidden', 'false');
    inputTitle.focus();
  }

  function openEditArtworkModal(id) {
    const item = artworksList.find(a => a.id === id);
    if (!item) return;

    artworkEditId.value = item.id;
    document.getElementById('artworkModalTitle').textContent = `Edit: ${item.title}`;

    inputTitle.value = item.title || '';

    // Category handling
    const standardCategories = ['watercolor', 'cubism', 'distortion', 'realistic', 'sketches'];
    const catLower = (item.category || '').toLowerCase();
    if (standardCategories.includes(catLower)) {
      inputCategory.value = catLower;
      customCategoryRow.style.display = 'none';
    } else {
      inputCategory.value = 'custom';
      inputCustomCategory.value = item.category || '';
      customCategoryRow.style.display = 'block';
    }

    inputPrice.value = item.price || '';
    inputImageUrl.value = item.image || item.fallbackImage || '';
    inputLink.value = item.link || '';
    inputAmbientColor.value = item.ambientColor || '#3b2b1f';

    // Image preview
    const previewSrc = item.image || item.fallbackImage;
    if (previewSrc) {
      imagePreviewImg.src = previewSrc;
      imagePreviewImg.style.display = 'block';
      imageUploadPlaceholder.style.display = 'none';
    } else {
      imagePreviewImg.style.display = 'none';
      imageUploadPlaceholder.style.display = 'flex';
    }

    artworkModal.classList.add('active');
    artworkModal.setAttribute('aria-hidden', 'false');
  }

  function closeArtworkModal() {
    artworkModal.classList.remove('active');
    artworkModal.setAttribute('aria-hidden', 'true');
  }

  // Handle Category Select Change
  inputCategory?.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customCategoryRow.style.display = 'block';
      inputCustomCategory.focus();
    } else {
      customCategoryRow.style.display = 'none';
    }
  });

  // Handle URL Image Input live preview
  inputImageUrl?.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      imagePreviewImg.src = url;
      imagePreviewImg.style.display = 'block';
      imageUploadPlaceholder.style.display = 'none';
    } else {
      imagePreviewImg.style.display = 'none';
      imageUploadPlaceholder.style.display = 'flex';
    }
  });

  // Client-Side Image Compression & Upload Preview
  inputFileUpload?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize resolution: max 1200x1200px
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        inputImageUrl.value = compressedDataUrl;
        imagePreviewImg.src = compressedDataUrl;
        imagePreviewImg.style.display = 'block';
        imageUploadPlaceholder.style.display = 'none';
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Ambient Presets Click
  document.getElementById('ambientPresetsRow')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.ambient-preset-btn');
    if (btn) {
      inputAmbientColor.value = btn.getAttribute('data-color');
    }
  });

  // Save Artwork (Create or Update)
  artworkForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = inputTitle.value.trim();
    let category = inputCategory.value;
    if (category === 'custom') {
      category = inputCustomCategory.value.trim() || 'Custom';
    }

    let price = inputPrice.value.trim();
    if (price && !price.toUpperCase().includes('EGP')) {
      price = `EGP ${price}`;
    }

    const image = inputImageUrl.value.trim();
    const link = inputLink.value.trim();
    const ambientColor = inputAmbientColor.value;
    const editId = artworkEditId.value;

    if (!title || !image) {
      alert('Please provide both artwork title and an image.');
      return;
    }

    if (editId) {
      // Update
      const index = artworksList.findIndex(a => a.id === editId);
      if (index !== -1) {
        artworksList[index] = {
          ...artworksList[index],
          title,
          category,
          price,
          image,
          link,
          ambientColor
        };
        showToast(`Updated "${title}" successfully`);
      }
    } else {
      // Create
      const newArtwork = {
        id: `art-${Date.now()}`,
        title,
        category,
        artist: 'Habiba maarek',
        price,
        image,
        fallbackImage: '',
        link,
        ambientColor,
        order: artworksList.length + 1
      };
      artworksList.push(newArtwork);
      showToast(`Added "${title}" to gallery`);
    }

    saveArtworksLocally();
    renderArtworksTable();
    closeArtworkModal();
  });

  function deleteArtwork(id) {
    const item = artworksList.find(a => a.id === id);
    if (!item) return;

    if (confirm(`Are you sure you want to remove "${item.title}" from the gallery?`)) {
      artworksList = artworksList.filter(a => a.id !== id);
      saveArtworksLocally();
      renderArtworksTable();
      showToast(`Removed "${item.title}"`);
    }
  }

  function moveArtwork(id, direction) {
    const index = artworksList.findIndex(a => a.id === id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= artworksList.length) return;

    const temp = artworksList[index];
    artworksList[index] = artworksList[newIndex];
    artworksList[newIndex] = temp;

    // Recalculate order numbers
    artworksList.forEach((a, i) => (a.order = i + 1));

    saveArtworksLocally();
    renderArtworksTable();
  }

  // ---------------------------------------------------------------------------
  // 8. CHANGE SECURITY KEY MODAL
  // ---------------------------------------------------------------------------
  const securityModal = document.getElementById('securityModal');
  const securityForm = document.getElementById('securityForm');

  function openSecurityModal() {
    securityForm.reset();
    document.getElementById('securityErrorMsg').style.display = 'none';
    securityModal.classList.add('active');
    securityModal.setAttribute('aria-hidden', 'false');
  }

  function closeSecurityModal() {
    securityModal.classList.remove('active');
    securityModal.setAttribute('aria-hidden', 'true');
  }

  securityForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currPw = document.getElementById('currentPasswordInput').value.trim();
    const newPw = document.getElementById('newPasswordInput').value.trim();
    const confPw = document.getElementById('confirmPasswordInput').value.trim();
    const errBox = document.getElementById('securityErrorMsg');

    if (newPw !== confPw) {
      errBox.textContent = 'New passwords do not match.';
      errBox.style.display = 'flex';
      return;
    }

    if (newPw.length < 8) {
      errBox.textContent = 'New password must be at least 8 characters long.';
      errBox.style.display = 'flex';
      return;
    }

    const salt = getActiveSalt();
    const currHash = await sha256(currPw + salt);

    if (currHash !== getActiveHash()) {
      errBox.textContent = 'Current password verification failed.';
      errBox.style.display = 'flex';
      return;
    }

    // Generate new salt and new hash
    const newSalt = `HabibaSalt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const newHash = await sha256(newPw + newSalt);

    localStorage.setItem(STORAGE_KEY_AUTH_SALT, newSalt);
    localStorage.setItem(STORAGE_KEY_AUTH_HASH, newHash);

    closeSecurityModal();
    showToast('Master security key updated successfully!');
  });

  // ---------------------------------------------------------------------------
  // 9. PUBLISH & DEPLOY MODAL
  // ---------------------------------------------------------------------------
  const publishModal = document.getElementById('publishModal');

  function openPublishModal() {
    const savedToken = localStorage.getItem(STORAGE_KEY_GITHUB_TOKEN);
    const tokenInput = document.getElementById('githubTokenInput');
    const statusMsg = document.getElementById('githubStatusMsg');
    if (savedToken && tokenInput) {
      tokenInput.value = savedToken;
      if (statusMsg) {
        statusMsg.style.color = '#34d399';
        statusMsg.textContent = '✓ Token connected! Auto-sync is active for all additions & deletions.';
      }
    }
    publishModal.classList.add('active');
    publishModal.setAttribute('aria-hidden', 'false');
  }

  function closePublishModal() {
    publishModal.classList.remove('active');
    publishModal.setAttribute('aria-hidden', 'true');
  }

  // Download artworks.json file
  document.getElementById('btnDownloadJson')?.addEventListener('click', () => {
    const jsonStr = JSON.stringify(artworksList, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'artworks.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('artworks.json downloaded!');
  });

  // Copy JSON to clipboard
  document.getElementById('btnCopyJson')?.addEventListener('click', async () => {
    const jsonStr = JSON.stringify(artworksList, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      showToast('JSON data copied to clipboard!');
    } catch (e) {
      alert('Could not copy automatically. Please download file instead.');
    }
  });

  const STORAGE_KEY_GITHUB_TOKEN = 'hm_github_token';

  async function pushToGithubWithToken(token) {
    const repoOwner = 'yehiarashed24-maker';
    const repoName = 'Habiba';
    const filePath = 'assets/data/artworks.json';
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    // 1. Get current file sha
    let currentSha = '';
    const getRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getRes.ok) {
      const fileInfo = await getRes.json();
      currentSha = fileInfo.sha;
    }

    // 2. Put updated content
    const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(artworksList, null, 2))));
    const commitRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Curator Atelier: Auto-sync gallery artworks (${Date.now()})`,
        content: contentBase64,
        sha: currentSha || undefined
      })
    });

    return commitRes;
  }

  async function autoSyncIfConfigured() {
    const savedToken = localStorage.getItem(STORAGE_KEY_GITHUB_TOKEN);
    if (!savedToken) return;

    try {
      showToast('Syncing changes to live website...');
      const res = await pushToGithubWithToken(savedToken);
      if (res.ok) {
        showToast('✓ Synced to live website automatically!');
      } else {
        console.warn('Auto-sync notice: token might need renewal');
      }
    } catch (err) {
      console.warn('Auto-sync network notice:', err);
    }
  }

  // GitHub Direct Commit API (Serverless git push via user PAT)
  document.getElementById('btnGithubCommit')?.addEventListener('click', async () => {
    const tokenInput = document.getElementById('githubTokenInput');
    const statusMsg = document.getElementById('githubStatusMsg');
    const token = tokenInput.value.trim();

    if (!token) {
      statusMsg.style.color = '#f87171';
      statusMsg.textContent = 'Please enter a GitHub token with "repo" scope.';
      return;
    }

    // Save token locally so future additions and deletions sync automatically!
    localStorage.setItem(STORAGE_KEY_GITHUB_TOKEN, token);

    statusMsg.style.color = '#60a5fa';
    statusMsg.textContent = 'Connecting to GitHub repository and pushing commit...';

    try {
      const commitRes = await pushToGithubWithToken(token);

      if (commitRes.ok) {
        statusMsg.style.color = '#34d399';
        statusMsg.textContent = '✓ Success! Token saved. All future additions & deletions will now sync automatically!';
        showToast('✓ Connected & Synced to GitHub!');
      } else {
        const errData = await commitRes.json();
        statusMsg.style.color = '#f87171';
        statusMsg.textContent = `GitHub error: ${errData.message || 'Check your token permissions'}`;
      }
    } catch (err) {
      statusMsg.style.color = '#f87171';
      statusMsg.textContent = `Network error: ${err.message}`;
    }
  });

  // ---------------------------------------------------------------------------
  // 10. TOAST NOTIFICATION
  // ---------------------------------------------------------------------------
  function showToast(message) {
    const toast = document.getElementById('adminToast');
    const msgElem = document.getElementById('toastMessage');
    if (!toast) return;

    msgElem.textContent = message;
    toast.classList.add('show');
    clearTimeout(window._adminToastTimer);
    window._adminToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // ---------------------------------------------------------------------------
  // 11. INITIALIZATION & EVENT BINDINGS
  // ---------------------------------------------------------------------------
  function init() {
    // Check lockout on load
    checkLockout();

    // Check active session
    if (isSessionValid()) {
      enterDashboard();
    } else {
      document.getElementById('authScreen').style.display = 'flex';
    }

    // Login Events
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin();
    });

    document.getElementById('btnTogglePw')?.addEventListener('click', () => {
      const pwInput = document.getElementById('adminPassword');
      const icon = document.getElementById('togglePwIcon');
      if (pwInput.type === 'password') {
        pwInput.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
      } else {
        pwInput.type = 'password';
        icon.className = 'fa-regular fa-eye';
      }
    });

    // Dashboard Header Actions
    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('btnChangePassword')?.addEventListener('click', openSecurityModal);

    // Toolbar Actions
    document.getElementById('btnAddNewArtwork')?.addEventListener('click', openAddArtworkModal);
    document.getElementById('btnPublishChanges')?.addEventListener('click', openPublishModal);

    // Search & Category Filters
    document.getElementById('searchInput')?.addEventListener('input', renderArtworksTable);
    document.getElementById('categoryFilter')?.addEventListener('change', renderArtworksTable);

    // Modal Close Triggers
    document.getElementById('btnArtworkModalClose')?.addEventListener('click', closeArtworkModal);
    document.getElementById('artworkModalBackdrop')?.addEventListener('click', closeArtworkModal);
    document.getElementById('btnArtworkCancel')?.addEventListener('click', closeArtworkModal);

    document.getElementById('btnSecurityModalClose')?.addEventListener('click', closeSecurityModal);
    document.getElementById('securityModalBackdrop')?.addEventListener('click', closeSecurityModal);
    document.getElementById('btnSecurityCancel')?.addEventListener('click', closeSecurityModal);

    document.getElementById('btnPublishModalClose')?.addEventListener('click', closePublishModal);
    document.getElementById('publishModalBackdrop')?.addEventListener('click', closePublishModal);

    // Escape Key to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeArtworkModal();
        closeSecurityModal();
        closePublishModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
