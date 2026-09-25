// State Management
let currentUser = null;
let allRestaurants = [];
let allCategories = [];
let currentCategoryFilter = '';
let currentSelectedRestaurant = null;
let cart = []; // items: { menuItemId, name, price, quantity, restaurantId, restaurantName }

// Initialize application on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check persisted user session in localStorage
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      setupAppForLoggedInUser();
      return;
    } catch (e) {
      localStorage.removeItem('currentUser');
    }
  }

  // Otherwise display Auth screen
  showAuthScreen();
});

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// AUTHENTICATION LOGIC (LOGIN / REGISTER / LOGOUT)
// ==========================================

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-container').style.display = 'none';
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tab-login-btn').classList.toggle('active', isLogin);
  document.getElementById('tab-register-btn').classList.toggle('active', !isLogin);
  document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
  document.getElementById('register-form').style.display = !isLogin ? 'block' : 'none';
}

function fillCredentials(email, password) {
  switchAuthTab('login');
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  showToast(`Credentials filled for: ${email}`, 'info');
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid credentials');

    currentUser = data.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showToast(`Welcome back, ${currentUser.name}!`, 'success');
    setupAppForLoggedInUser();

  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const address = document.getElementById('reg-address').value.trim();
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, address, password, role: 'customer' })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    currentUser = data.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showToast('Account created successfully!', 'success');
    setupAppForLoggedInUser();

  } catch (error) {
    showToast(error.message, 'error');
  }
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  cart = [];
  showToast('Logged out successfully.', 'info');
  showAuthScreen();
}

// ==========================================
// DASHBOARD INITIALIZATION BASED ON ROLE
// ==========================================

async function setupAppForLoggedInUser() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';

  // Update header profile details
  document.getElementById('nav-user-name').textContent = currentUser.name;
  const isCust = currentUser.role === 'customer';
  document.getElementById('nav-user-role-badge').innerHTML = isCust
    ? '<span style="color: #0284c7; font-weight: 700;">Customer Account</span>'
    : '<span style="color: #9333ea; font-weight: 700;">Administrator</span>';

  // Toggle Dashboards
  if (isCust) {
    document.getElementById('customer-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('header-cart-btn').style.display = 'flex';
    document.getElementById('cust-welcome-title').textContent = `Welcome back, ${currentUser.name}!`;
    await loadCustomerPortalData();
  } else {
    document.getElementById('customer-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('header-cart-btn').style.display = 'none'; // Admin does not need shopping cart
    await loadAdminDashboard();
  }
}

// ==========================================
// 1. CUSTOMER DASHBOARD FUNCTIONS
// ==========================================

async function loadCustomerPortalData() {
  try {
    const [restRes, catRes] = await Promise.all([
      fetch('/api/restaurants'),
      fetch('/api/categories')
    ]);

    allRestaurants = await restRes.json();
    allCategories = await catRes.json();

    renderCategoryChips();
    renderRestaurants(allRestaurants);
    updateCartUI();
  } catch (error) {
    console.error('Error loading customer portal data:', error);
    showToast('Failed to load menu data.', 'error');
  }
}

function switchCustomerSubtab(subtab) {
  const browseContainer = document.getElementById('subtab-browse-container');
  const ordersContainer = document.getElementById('subtab-orders-container');
  const btnBrowse = document.getElementById('cust-browse-subtab');
  const btnOrders = document.getElementById('cust-orders-subtab');

  if (subtab === 'browse') {
    browseContainer.style.display = 'block';
    ordersContainer.style.display = 'none';
    btnBrowse.classList.add('active');
    btnOrders.classList.remove('active');
  } else {
    browseContainer.style.display = 'none';
    ordersContainer.style.display = 'block';
    btnOrders.classList.add('active');
    btnBrowse.classList.remove('active');
    loadCustomerOrders();
  }
}

function renderCategoryChips() {
  const container = document.getElementById('category-filter-chips');
  container.innerHTML = `<button class="chip-btn ${currentCategoryFilter === '' ? 'active' : ''}" onclick="filterByCategory('')">All Categories</button>`;

  allCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `chip-btn ${currentCategoryFilter === cat._id ? 'active' : ''}`;
    btn.textContent = cat.name;
    btn.onclick = () => filterByCategory(cat._id);
    container.appendChild(btn);
  });
}

function filterByCategory(catId) {
  currentCategoryFilter = catId;
  renderCategoryChips();
  filterRestaurants();
}

function filterRestaurants() {
  const search = document.getElementById('restaurant-search-input').value.toLowerCase().trim();
  
  const filtered = allRestaurants.filter(r => {
    const matchesSearch = !search || 
      r.name.toLowerCase().includes(search) || 
      r.cuisine.toLowerCase().includes(search) || 
      r.location.toLowerCase().includes(search);
    return matchesSearch;
  });

  renderRestaurants(filtered);
}

function renderRestaurants(restaurants) {
  const grid = document.getElementById('restaurant-list-grid');
  grid.innerHTML = '';

  if (restaurants.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fff; border-radius: 12px; border: 1px solid var(--border);">
        <i class="fa-solid fa-utensils" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.75rem;"></i>
        <h3 style="color: #475569;">No restaurants found</h3>
        <p style="color: #94a3b8; font-size: 0.9rem;">Try adjusting your search query or clear filters.</p>
      </div>
    `;
    return;
  }

  const foodIcons = ['🍛', '🍔', '🍕', '🍰', '🍜', '🥗'];

  restaurants.forEach((r, idx) => {
    const icon = foodIcons[idx % foodIcons.length];
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.innerHTML = `
      <div class="card-img-placeholder">${icon}</div>
      <div class="card-body">
        <div class="card-title-row">
          <h3 class="card-title">${r.name}</h3>
          <span class="rating-badge">★ ${r.rating || 4.5}</span>
        </div>
        <p class="card-cuisine"><i class="fa-solid fa-bowl-rice"></i> ${r.cuisine}</p>
        <div class="card-meta">
          <span><i class="fa-solid fa-location-dot"></i> ${r.location}</span>
          <span><i class="fa-solid fa-phone"></i> ${r.phone}</span>
        </div>
        <div class="card-footer">
          <span style="font-size: 0.8rem; font-weight: 600; color: ${r.isOpen ? '#16a34a' : '#ef4444'};">
            ● ${r.isOpen ? 'Open Now' : 'Closed'}
          </span>
          <button class="btn-primary" onclick="viewRestaurantDetails('${r._id}')">
            View Menu & Reviews <i class="fa-solid fa-chevron-right" style="font-size: 0.75rem;"></i>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function viewRestaurantDetails(restaurantId) {
  try {
    const res = await fetch(`/api/restaurants/${restaurantId}`);
    const data = await res.json();
    currentSelectedRestaurant = data.restaurant;

    document.getElementById('restaurant-list-grid').style.display = 'none';
    document.querySelector('.filter-bar').style.display = 'none';
    document.getElementById('restaurant-detail-view').style.display = 'block';

    document.getElementById('detail-restaurant-name').textContent = data.restaurant.name;
    document.getElementById('detail-restaurant-cuisine').textContent = `Cuisine: ${data.restaurant.cuisine}`;
    document.getElementById('detail-restaurant-location').textContent = `Location: ${data.restaurant.location} • Phone: ${data.restaurant.phone}`;
    document.getElementById('detail-restaurant-rating').innerHTML = `★ ${data.restaurant.rating || 4.5}`;

    // Render Menu Items
    const menuGrid = document.getElementById('detail-menu-grid');
    menuGrid.innerHTML = '';

    if (data.menu.length === 0) {
      menuGrid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No menu items listed for this restaurant yet.</p>';
    } else {
      data.menu.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-card';
        itemCard.innerHTML = `
          <div class="menu-info">
            <h4>${item.name}</h4>
            <p>${item.description || 'Delicious freshly prepared dish'}</p>
          </div>
          <div class="menu-action">
            <span class="menu-price">₹${item.price}</span>
            <button class="btn-primary" onclick="addToCart('${item._id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>
        `;
        menuGrid.appendChild(itemCard);
      });
    }

    // Render Reviews
    const reviewsList = document.getElementById('detail-reviews-list');
    reviewsList.innerHTML = '';

    if (data.reviews.length === 0) {
      reviewsList.innerHTML = '<p style="color: var(--text-muted);">No reviews yet. Be the first customer to review this restaurant!</p>';
    } else {
      data.reviews.forEach(rev => {
        const revEl = document.createElement('div');
        revEl.className = 'review-item';
        const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
        revEl.innerHTML = `
          <div class="review-header">
            <span class="review-author"><i class="fa-regular fa-user"></i> ${rev.userId?.name || 'Verified Customer'}</span>
            <span style="color: #f59e0b; font-weight: 700;">${stars} (${rev.rating}/5)</span>
          </div>
          <p class="review-comment">${rev.comment}</p>
        `;
        reviewsList.appendChild(revEl);
      });
    }

  } catch (error) {
    console.error('Error fetching restaurant detail:', error);
    showToast('Failed to load restaurant details.', 'error');
  }
}

function backToRestaurantList() {
  document.getElementById('restaurant-list-grid').style.display = 'grid';
  document.querySelector('.filter-bar').style.display = 'flex';
  document.getElementById('restaurant-detail-view').style.display = 'none';
}

function addToCart(menuItemId, name, price) {
  if (!currentSelectedRestaurant) return;

  if (cart.length > 0 && cart[0].restaurantId !== currentSelectedRestaurant._id) {
    if (!confirm(`Your cart already contains items from ${cart[0].restaurantName}. Clear cart and add from ${currentSelectedRestaurant.name}?`)) {
      return;
    }
    cart = [];
  }

  const existing = cart.find(i => i.menuItemId === menuItemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      menuItemId,
      name,
      price,
      quantity: 1,
      restaurantId: currentSelectedRestaurant._id,
      restaurantName: currentSelectedRestaurant.name
    });
  }

  updateCartUI();
  showToast(`Added "${name}" to basket!`, 'success');
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById('cart-item-count').textContent = totalCount;
}

function openCartModal() {
  const container = document.getElementById('cart-items-container');
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Your cart is currently empty. Browse dishes to add!</p>';
    document.getElementById('cart-total-price').textContent = '₹0';
  } else {
    let total = 0;
    cart.forEach((item, index) => {
      total += item.price * item.quantity;
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #f1f5f9;';
      row.innerHTML = `
        <div>
          <strong style="font-size: 0.92rem;">${item.name}</strong>
          <div style="font-size: 0.8rem; color: #64748b;">₹${item.price} each</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <button class="btn-secondary" style="padding: 2px 8px;" onclick="changeCartQty(${index}, -1)">-</button>
          <span style="font-weight: 700; font-size: 0.9rem;">${item.quantity}</span>
          <button class="btn-secondary" style="padding: 2px 8px;" onclick="changeCartQty(${index}, 1)">+</button>
          <span style="font-weight: 700; min-width: 50px; text-align: right;">₹${item.price * item.quantity}</span>
        </div>
      `;
      container.appendChild(row);
    });
    document.getElementById('cart-total-price').textContent = `₹${total}`;
  }

  if (currentUser && currentUser.address) {
    document.getElementById('cart-delivery-address').value = currentUser.address;
  }

  document.getElementById('cart-modal').classList.add('active');
}

function changeCartQty(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  updateCartUI();
  openCartModal();
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.remove('active');
}

async function placeCustomerOrder() {
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  if (!currentUser) {
    showToast('Please sign in first.', 'error');
    return;
  }

  const address = document.getElementById('cart-delivery-address').value.trim();
  if (!address) {
    showToast('Please enter a delivery address.', 'error');
    return;
  }

  try {
    const orderPayload = {
      userId: currentUser._id,
      restaurantId: cart[0].restaurantId,
      items: cart.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      deliveryAddress: address
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');

    cart = [];
    updateCartUI();
    closeCartModal();
    showToast('🎉 Order placed successfully in MongoDB!', 'success');
    switchCustomerSubtab('orders');

  } catch (error) {
    console.error('Error placing order:', error);
    showToast(error.message, 'error');
  }
}

async function loadCustomerOrders() {
  if (!currentUser) return;
  try {
    const res = await fetch(`/api/orders?userId=${currentUser._id}`);
    const orders = await res.json();

    document.getElementById('user-orders-count-label').textContent = `${orders.length} Orders`;
    const tbody = document.getElementById('customer-orders-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No orders placed yet.</td></tr>';
      return;
    }

    orders.forEach(ord => {
      const itemsList = ord.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
      const dateStr = new Date(ord.orderDate || ord.createdAt).toLocaleString();
      const statusClass = `status-${ord.status.split(' ')[0]}`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><code style="font-weight: 700; color: #475569;">#${ord._id.slice(-6).toUpperCase()}</code></td>
        <td><strong>${ord.restaurantId?.name || 'Restaurant'}</strong></td>
        <td style="max-width: 280px; font-size: 0.82rem;">${itemsList}</td>
        <td><strong>₹${ord.totalAmount}</strong></td>
        <td><span class="status-pill ${statusClass}">${ord.status}</span></td>
        <td style="font-size: 0.8rem; color: #64748b;">${dateStr}</td>
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading customer orders:', error);
  }
}

function openReviewModal() {
  if (!currentUser) {
    showToast('Please sign in to write a review.', 'error');
    return;
  }
  document.getElementById('review-comment-input').value = '';
  document.getElementById('review-modal').classList.add('active');
}

function closeReviewModal() {
  document.getElementById('review-modal').classList.remove('active');
}

async function submitRestaurantReview() {
  if (!currentSelectedRestaurant || !currentUser) return;

  const rating = document.getElementById('review-rating-select').value;
  const comment = document.getElementById('review-comment-input').value.trim();

  if (!comment) {
    showToast('Please write a comment for your review.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser._id,
        restaurantId: currentSelectedRestaurant._id,
        rating,
        comment
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit review');

    closeReviewModal();
    showToast('Review submitted! Restaurant rating recalculated in MongoDB.', 'success');
    viewRestaurantDetails(currentSelectedRestaurant._id);

  } catch (error) {
    console.error('Error submitting review:', error);
    showToast(error.message, 'error');
  }
}

// ==========================================
// 2. ADMINISTRATOR DASHBOARD FUNCTIONS
// ==========================================

async function loadAdminDashboard() {
  loadAdminOverviewStats();
  loadAdminOrders();
  loadAdminRestaurants();
  loadAdminMenuItems();
  loadAdminUsers();
  loadAnalyticsPipelines();
}

async function loadAdminOverviewStats() {
  try {
    const res = await fetch('/api/analytics/overview');
    const data = await res.json();
    document.getElementById('stat-revenue').textContent = `₹${data.totalRevenue.toLocaleString()}`;
    document.getElementById('stat-orders').textContent = data.totalOrders;
    document.getElementById('stat-restaurants').textContent = data.totalRestaurants;
    document.getElementById('stat-menu-items').textContent = data.totalMenuItems;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
  }
}

function switchAdminTab(tabName) {
  const tabs = ['orders', 'restaurants', 'menu', 'users', 'analytics'];
  tabs.forEach(t => {
    const el = document.getElementById(`admin-tab-${t}`);
    if (el) el.style.display = t === tabName ? 'block' : 'none';
    const btn = document.getElementById(`admin-${t}-tab-btn`);
    if (btn) btn.classList.toggle('active', t === tabName);
  });
  if (tabName === 'analytics') {
    loadAnalyticsPipelines();
  }
}

async function loadAdminOrders() {
  const statusFilter = document.getElementById('admin-order-status-filter').value;
  let url = '/api/orders';
  if (statusFilter) url += `?status=${encodeURIComponent(statusFilter)}`;

  try {
    const res = await fetch(url);
    const orders = await res.json();
    const tbody = document.getElementById('admin-orders-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No orders found.</td></tr>';
      return;
    }

    orders.forEach(ord => {
      const itemsText = ord.items.map(i => `${i.name} (x${i.quantity})`).join(', ');

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><code>#${ord._id.slice(-6).toUpperCase()}</code></td>
        <td>
          <strong>${ord.userId?.name || 'Customer'}</strong>
          <div style="font-size: 0.75rem; color: #64748b;">${ord.userId?.phone || ''}</div>
        </td>
        <td>${ord.restaurantId?.name || 'N/A'}</td>
        <td style="max-width: 250px; font-size: 0.8rem;">${itemsText}</td>
        <td><strong>₹${ord.totalAmount}</strong></td>
        <td>
          <select class="form-control" style="font-size: 0.8rem; padding: 4px 6px;" onchange="updateOrderStatus('${ord._id}', this.value)">
            <option value="Placed" ${ord.status === 'Placed' ? 'selected' : ''}>Placed</option>
            <option value="Preparing" ${ord.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
            <option value="Out for Delivery" ${ord.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="Delivered" ${ord.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn-secondary" style="padding: 4px 8px; color: #ef4444;" onclick="deleteOrder('${ord._id}')" title="Delete Order">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Error fetching admin orders:', error);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update status');
    showToast(`Order status updated to: ${newStatus}`, 'success');
    loadAdminOverviewStats();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order?')) return;
  try {
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete order');
    showToast('Order deleted successfully', 'success');
    loadAdminOrders();
    loadAdminOverviewStats();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadAdminRestaurants() {
  try {
    const res = await fetch('/api/restaurants');
    allRestaurants = await res.json();
    const tbody = document.getElementById('admin-restaurants-tbody');
    tbody.innerHTML = '';

    allRestaurants.forEach(r => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${r.name}</strong></td>
        <td>${r.cuisine}</td>
        <td>${r.location}</td>
        <td>${r.phone}</td>
        <td><span class="rating-badge">★ ${r.rating}</span></td>
        <td><span class="status-pill ${r.isOpen ? 'status-Delivered' : 'status-Cancelled'}">${r.isOpen ? 'Open' : 'Closed'}</span></td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-secondary" style="padding: 4px 8px;" onclick="openEditRestaurantModal('${r._id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-secondary" style="padding: 4px 8px; color: #ef4444;" onclick="deleteRestaurant('${r._id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    populateAdminDropdowns();

  } catch (error) {
    console.error('Error fetching admin restaurants:', error);
  }
}

function populateAdminDropdowns() {
  const restFilter = document.getElementById('admin-menu-restaurant-filter');
  const restSelect = document.getElementById('menu-rest-select');
  const catSelect = document.getElementById('menu-cat-select');

  restFilter.innerHTML = '<option value="">All Restaurants</option>';
  restSelect.innerHTML = '';
  catSelect.innerHTML = '';

  allRestaurants.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r._id;
    opt.textContent = r.name;
    restFilter.appendChild(opt);

    const opt2 = document.createElement('option');
    opt2.value = r._id;
    opt2.textContent = r.name;
    restSelect.appendChild(opt2);
  });

  allCategories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c._id;
    opt.textContent = c.name;
    catSelect.appendChild(opt);
  });
}

function openAddRestaurantModal() {
  document.getElementById('restaurant-modal-title').textContent = 'Add New Restaurant';
  document.getElementById('edit-restaurant-id').value = '';
  document.getElementById('rest-name-input').value = '';
  document.getElementById('rest-cuisine-input').value = '';
  document.getElementById('rest-location-input').value = '';
  document.getElementById('rest-phone-input').value = '';
  document.getElementById('rest-rating-input').value = '4.5';
  document.getElementById('restaurant-modal').classList.add('active');
}

function openEditRestaurantModal(id) {
  const r = allRestaurants.find(item => item._id === id);
  if (!r) return;

  document.getElementById('restaurant-modal-title').textContent = 'Edit Restaurant Details';
  document.getElementById('edit-restaurant-id').value = r._id;
  document.getElementById('rest-name-input').value = r.name;
  document.getElementById('rest-cuisine-input').value = r.cuisine;
  document.getElementById('rest-location-input').value = r.location;
  document.getElementById('rest-phone-input').value = r.phone;
  document.getElementById('rest-rating-input').value = r.rating;
  document.getElementById('restaurant-modal').classList.add('active');
}

function closeRestaurantModal() {
  document.getElementById('restaurant-modal').classList.remove('active');
}

async function saveRestaurant() {
  const id = document.getElementById('edit-restaurant-id').value;
  const name = document.getElementById('rest-name-input').value.trim();
  const cuisine = document.getElementById('rest-cuisine-input').value.trim();
  const location = document.getElementById('rest-location-input').value.trim();
  const phone = document.getElementById('rest-phone-input').value.trim();
  const rating = document.getElementById('rest-rating-input').value;

  if (!name || !cuisine || !location || !phone) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  const payload = { name, cuisine, location, phone, rating: Number(rating) };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/restaurants/${id}` : '/api/restaurants';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save restaurant');

    closeRestaurantModal();
    showToast(id ? 'Restaurant updated!' : 'Restaurant added successfully!', 'success');
    loadAdminRestaurants();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteRestaurant(id) {
  if (!confirm('Are you sure you want to delete this restaurant and all its menu items?')) return;
  try {
    const res = await fetch(`/api/restaurants/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete restaurant');
    showToast('Restaurant deleted', 'success');
    loadAdminRestaurants();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadAdminMenuItems() {
  const restFilter = document.getElementById('admin-menu-restaurant-filter').value;
  let url = '/api/menu';
  if (restFilter) url += `?restaurantId=${restFilter}`;

  try {
    const res = await fetch(url);
    const items = await res.json();
    const tbody = document.getElementById('admin-menu-tbody');
    tbody.innerHTML = '';

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No menu items found.</td></tr>';
      return;
    }

    items.forEach(m => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${m.name}</strong></td>
        <td>${m.restaurantId?.name || 'N/A'}</td>
        <td><span class="status-pill status-Placed">${m.categoryId?.name || 'N/A'}</span></td>
        <td><strong>₹${m.price}</strong></td>
        <td><span class="status-pill ${m.isAvailable ? 'status-Delivered' : 'status-Cancelled'}">${m.isAvailable ? 'Available' : 'Unavailable'}</span></td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-secondary" style="padding: 4px 8px;" onclick="openEditMenuItemModal('${m._id}', '${m.name.replace(/'/g, "\\'")}', '${m.restaurantId?._id}', '${m.categoryId?._id}', ${m.price}, '${(m.description||'').replace(/'/g, "\\'")}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-secondary" style="padding: 4px 8px; color: #ef4444;" onclick="deleteMenuItem('${m._id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Error fetching admin menu:', error);
  }
}

function openAddMenuItemModal() {
  document.getElementById('menu-modal-title').textContent = 'Add New Menu Item';
  document.getElementById('edit-menu-id').value = '';
  document.getElementById('menu-name-input').value = '';
  document.getElementById('menu-desc-input').value = '';
  document.getElementById('menu-price-input').value = '';
  document.getElementById('menu-modal').classList.add('active');
}

function openEditMenuItemModal(id, name, restId, catId, price, desc) {
  document.getElementById('menu-modal-title').textContent = 'Edit Menu Item';
  document.getElementById('edit-menu-id').value = id;
  document.getElementById('menu-name-input').value = name;
  document.getElementById('menu-desc-input').value = desc;
  document.getElementById('menu-price-input').value = price;
  if (restId) document.getElementById('menu-rest-select').value = restId;
  if (catId) document.getElementById('menu-cat-select').value = catId;
  document.getElementById('menu-modal').classList.add('active');
}

function closeMenuModal() {
  document.getElementById('menu-modal').classList.remove('active');
}

async function saveMenuItem() {
  const id = document.getElementById('edit-menu-id').value;
  const restaurantId = document.getElementById('menu-rest-select').value;
  const categoryId = document.getElementById('menu-cat-select').value;
  const name = document.getElementById('menu-name-input').value.trim();
  const description = document.getElementById('menu-desc-input').value.trim();
  const price = document.getElementById('menu-price-input').value;

  if (!restaurantId || !categoryId || !name || !price) {
    showToast('Please fill all fields.', 'error');
    return;
  }

  const payload = { restaurantId, categoryId, name, description, price: Number(price) };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/menu/${id}` : '/api/menu';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save menu item');

    closeMenuModal();
    showToast(id ? 'Menu item updated!' : 'Menu item added!', 'success');
    loadAdminMenuItems();
    loadAdminOverviewStats();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;
  try {
    const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete item');
    showToast('Menu item deleted', 'success');
    loadAdminMenuItems();
    loadAdminOverviewStats();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadAdminUsers() {
  try {
    const res = await fetch('/api/auth/users');
    const users = await res.json();
    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = '';

    users.forEach(u => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td><span class="status-pill ${u.role === 'admin' ? 'status-Preparing' : 'status-Placed'}">${u.role}</span></td>
        <td>${u.address || 'N/A'}</td>
        <td style="font-size: 0.8rem; color: #64748b;">${new Date(u.createdAt).toLocaleDateString()}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
  }
}

// ==========================================
// 3. ADVANCED NOSQL & AGGREGATIONS (REVIEW 2)
// ==========================================

async function loadAnalyticsPipelines() {
  loadRevenueByRestaurantAgg();
  loadTopSellingItemsAgg();
  loadOrderStatusBreakdownAgg();
  loadRestaurantRatingsAgg();
}

async function loadRevenueByRestaurantAgg() {
  try {
    const res = await fetch('/api/analytics/revenue-by-restaurant');
    const { results } = await res.json();
    const tbody = document.getElementById('agg-revenue-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!results || results.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No data found</td></tr>';
      return;
    }

    results.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${item.restaurantName}</strong></td>
        <td>${item.cuisine}</td>
        <td><span class="status-pill status-Placed">${item.orderCount} Orders</span></td>
        <td>₹${item.avgOrderValue}</td>
        <td><strong style="color: #16a34a; font-size: 1rem;">₹${item.totalRevenue.toLocaleString()}</strong></td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading revenue aggregation:', error);
  }
}

async function loadTopSellingItemsAgg() {
  try {
    const res = await fetch('/api/analytics/top-selling-items');
    const { results } = await res.json();
    const tbody = document.getElementById('agg-top-items-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!results || results.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No data found</td></tr>';
      return;
    }

    results.forEach((item, index) => {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${medals[index] || index + 1}</strong></td>
        <td><strong>${item.itemName}</strong></td>
        <td><span class="status-pill status-Preparing">${item.totalQuantitySold} Units</span></td>
        <td><strong style="color: #16a34a;">₹${item.totalRevenue.toLocaleString()}</strong></td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading top selling aggregation:', error);
  }
}

async function loadOrderStatusBreakdownAgg() {
  try {
    const res = await fetch('/api/analytics/order-status-breakdown');
    const { results } = await res.json();
    const tbody = document.getElementById('agg-status-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    results.forEach(item => {
      const statusClass = `status-${item.status.split(' ')[0]}`;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="status-pill ${statusClass}">${item.status}</span></td>
        <td><strong>${item.count}</strong></td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading status aggregation:', error);
  }
}

async function loadRestaurantRatingsAgg() {
  try {
    const res = await fetch('/api/analytics/restaurant-ratings');
    const { results } = await res.json();
    const tbody = document.getElementById('agg-ratings-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    results.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${item.restaurantName}</strong></td>
        <td>${item.reviewCount} customer reviews</td>
        <td><span class="rating-badge">★ ${item.averageRating} / 5.0</span></td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading ratings aggregation:', error);
  }
}
