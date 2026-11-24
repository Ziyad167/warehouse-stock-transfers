// INVENTORY_API comes from js/config.js (loaded first).

const apiStatus = document.querySelector('#api-status');
const message = document.querySelector('#message');
const warehouseSelect = document.querySelector('#warehouse-select');
const stockList = document.querySelector('#stock-list');
const addForm = document.querySelector('#add-form');
const addItem = document.querySelector('#add-item');
const addQuantity = document.querySelector('#add-quantity');
const checkForm = document.querySelector('#check-form');
const checkItem = document.querySelector('#check-item');
const checkQuantity = document.querySelector('#check-quantity');
const checkResult = document.querySelector('#check-result');
const searchForm = document.querySelector('#search-form');
const searchText = document.querySelector('#search-text');
const itemsList = document.querySelector('#items-list');
const loginPanel = document.querySelector('#login-panel');
const loginForm = document.querySelector('#login-form');
const loginUsername = document.querySelector('#login-username');
const loginPassword = document.querySelector('#login-password');
const appSection = document.querySelector('#app');
const userBar = document.querySelector('#user-bar');
const userInfo = document.querySelector('#user-info');
const logoutButton = document.querySelector('#logout-button');
const addSection = document.querySelector('#add-section');

// Lab 8: the login token is kept in localStorage, so a page refresh stays logged in
let authToken = localStorage.getItem('authToken');

// Send a request, read the JSON answer, and throw if the status is not 2xx.
// If we are logged in, the token is added to every request.
async function apiRequest(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(url, { ...options, headers });

  let body = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  }

  // 401 while logged in means the token is not valid any more: log in again
  if (response.status === 401 && authToken) {
    clearLogin();
    showLogin('Your session ended. Please log in again.');
  }

  if (!response.ok) {
    // Our API errors look like { error: { code, message } }
    const text = body?.error?.message || `Request failed (${response.status})`;
    throw new Error(text);
  }

  return body;
}

// Puts one <option> into a <select> for each entry
function fillSelect(select, entries) {
  select.replaceChildren();
  entries.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.value;
    option.textContent = entry.label;
    select.append(option);
  });
}

// GET /api/warehouses -> fill the warehouse list, then show its stock
async function loadWarehouses() {
  try {
    const warehouses = await apiRequest(`${INVENTORY_API}/api/warehouses`);
    fillSelect(warehouseSelect, warehouses.map((warehouse) => ({
      value: warehouse.warehouseId,
      label: `${warehouse.name} (${warehouse.location})`
    })));
    await loadStock();
  } catch (error) {
    console.error(error);
    message.textContent = `Could not load warehouses: ${error.message}`;
  }
}

// GET /api/items -> fill the two item lists
async function loadItems() {
  try {
    const items = await apiRequest(`${INVENTORY_API}/api/items`);
    const entries = items.map((item) => ({
      value: item.itemId,
      label: `${item.name} (${item.sku})`
    }));
    fillSelect(addItem, entries);
    fillSelect(checkItem, entries);
  } catch (error) {
    console.error(error);
    message.textContent = `Could not load items: ${error.message}`;
  }
}

// GET /api/warehouses/:id/inventory -> show the stock of the chosen warehouse
async function loadStock() {
  try {
    const data = await apiRequest(
      `${INVENTORY_API}/api/warehouses/${warehouseSelect.value}/inventory`);
    renderStock(data.stock);
  } catch (error) {
    console.error(error);
    message.textContent = `Could not load stock: ${error.message}`;
  }
}

function renderStock(stock) {
  stockList.replaceChildren();

  if (stock.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No stock in this warehouse yet.';
    stockList.append(empty);
    return;
  }

  stock.forEach((record) => {
    const card = document.createElement('article');
    card.className = 'stock-card';

    const heading = document.createElement('h3');
    heading.textContent = record.itemName;

    const details = document.createElement('p');
    details.textContent = `SKU: ${record.sku} | Quantity: ${record.quantity}`;

    const changeInput = document.createElement('input');
    changeInput.type = 'number';
    changeInput.placeholder = 'e.g. 10 to add, -5 to remove';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Apply Change';
    button.addEventListener('click', () =>
      updateStock(record.inventoryId, Number(changeInput.value)));

    card.append(heading, details, changeInput, button);
    stockList.append(card);
  });
}

// When the user picks another warehouse, show its stock
warehouseSelect.addEventListener('change', loadStock);

// PATCH /api/inventory/:id -> add or remove stock
async function updateStock(inventoryId, change) {
  try {
    await apiRequest(`${INVENTORY_API}/api/inventory/${inventoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change })
    });
    await loadStock();
    message.textContent = 'Stock updated.';
  } catch (error) {
    console.error(error);
    message.textContent = `Could not update stock: ${error.message}`;
  }
}

// POST /api/inventory -> add an item to the chosen warehouse
addForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    warehouseId: warehouseSelect.value,
    itemId: addItem.value,
    quantity: Number(addQuantity.value)
  };

  try {
    await apiRequest(`${INVENTORY_API}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    addForm.reset();
    await loadStock();
    message.textContent = 'Item added to the warehouse.';
  } catch (error) {
    console.error(error);
    message.textContent = `Could not add item: ${error.message}`;
  }
});

// GET /api/inventory/availability -> is there enough stock?
checkForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const url = `${INVENTORY_API}/api/inventory/availability` +
    `?warehouseId=${encodeURIComponent(warehouseSelect.value)}` +
    `&itemId=${encodeURIComponent(checkItem.value)}` +
    `&quantity=${encodeURIComponent(checkQuantity.value)}`;

  try {
    const result = await apiRequest(url);
    if (result.isAvailable) {
      checkResult.textContent =
        `Yes: ${result.availableQuantity} in stock, ${result.requestedQuantity} needed.`;
    } else {
      checkResult.textContent =
        `No: only ${result.availableQuantity} in stock, ${result.requestedQuantity} needed.`;
    }
  } catch (error) {
    console.error(error);
    checkResult.textContent = `Could not check: ${error.message}`;
  }
});

// GET /api/items?search= -> show matching items
searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await searchItems(searchText.value.trim());
});

async function searchItems(text) {
  try {
    const items = await apiRequest(
      `${INVENTORY_API}/api/items?search=${encodeURIComponent(text)}`);
    itemsList.replaceChildren();
    if (items.length === 0) {
      const none = document.createElement('li');
      none.textContent = 'No items found.';
      itemsList.append(none);
    }
    items.forEach((item) => {
      const line = document.createElement('li');
      line.textContent = `${item.name} | ${item.sku} | ${item.category}`;
      itemsList.append(line);
    });
  } catch (error) {
    console.error(error);
    message.textContent = `Could not search: ${error.message}`;
  }
}

// Shows in the header if the API is reachable
async function checkApi() {
  try {
    const health = await apiRequest(`${INVENTORY_API}/api/health`);
    apiStatus.textContent = `API online (${health.environment})`;
    apiStatus.className = 'api-status online';
  } catch (error) {
    console.error(error);
    apiStatus.textContent = 'API not reachable: is the backend running?';
    apiStatus.className = 'api-status offline';
  }
}

// ---------- Login and logout ----------

// Forgets the token in this browser
function clearLogin() {
  authToken = null;
  localStorage.removeItem('authToken');
}

// Shows the login form and hides the app
function showLogin(text) {
  appSection.hidden = true;
  userBar.hidden = true;
  loginPanel.hidden = false;
  message.textContent = text || '';
}

// Shows the app for a logged-in user; only managers see the "Add Item" form
async function showApp(user) {
  loginPanel.hidden = true;
  appSection.hidden = false;
  userBar.hidden = false;
  userInfo.textContent = `Logged in as ${user.username} (${user.role})`;
  addSection.hidden = user.role !== 'manager';
  message.textContent = '';

  await loadItems();
  await loadWarehouses();
  await searchItems('');
}

// POST /api/auth/login -> save the token, then show the app
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const user = await apiRequest(`${INVENTORY_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginUsername.value.trim(),
        password: loginPassword.value
      })
    });
    authToken = user.token;
    localStorage.setItem('authToken', authToken);
    loginForm.reset();
    await showApp(user);
  } catch (error) {
    console.error(error);
    message.textContent = `Could not log in: ${error.message}`;
  }
});

// POST /api/auth/logout -> the token stops working on the server too
logoutButton.addEventListener('click', async () => {
  try {
    await apiRequest(`${INVENTORY_API}/api/auth/logout`, { method: 'POST' });
  } catch (error) {
    console.error(error);
  }
  clearLogin();
  showLogin('You are logged out.');
});

// When the page opens: if a token is saved, ask the server who we are
async function startPage() {
  await checkApi();

  if (!authToken) {
    showLogin();
    return;
  }
  try {
    const user = await apiRequest(`${INVENTORY_API}/api/auth/me`);
    await showApp(user);
  } catch (error) {
    console.error(error);
    clearLogin();
    showLogin();
  }
}

startPage();