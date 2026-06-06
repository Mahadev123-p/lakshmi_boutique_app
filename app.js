/**
 * Lakshmi Boutique App - Logic Engine
 * State Management, Routing, LocalStorage Engine, Calculations, and Actions
 */

// Application State
let state = {
    customers: [],
    currentCustomerId: null,
    currentView: 'dashboard',
    currentProfileTab: 'measurements'
};

// Default Sample Customer Data for Initial App Seed
const SAMPLE_CUSTOMERS = [{
        id: "cust_sample1",
        name: "Sita Kalyani",
        phone: "9876543210",
        email: "sita.kalyani@gmail.com",
        address: "Plot 42, Jubilee Hills, Hyderabad - 500033",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        notes: "Prefers high elbow sleeves for blouses. Prefers cotton linings. Stitching delivery must be prompt.",
        measurements: {
            blouse: {
                length: "14.5",
                chest: "36.5",
                waist: "31",
                shoulder: "14.5",
                sleeveLength: "11",
                sleeveRound: "12.5",
                frontNeck: "7.5",
                backNeck: "8.5",
                armHole: "16.5"
            },
            dress: {
                kurtiLength: "44",
                bottomLength: "39",
                bust: "37",
                waist: "32",
                hips: "40",
                sleeve: "17",
                shoulder: "14.5",
                armHole: "17"
            }
        },
        purchases: [{
                id: "rec_1",
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                type: "purchase",
                items: "Kanjeevaram Silk Saree + Zardosi Maggam Work Blouse Stitching",
                total_amount: 14500,
                paid_amount: 10000,
                balance: 4500
            },
            {
                id: "rec_2",
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                type: "payment",
                items: "Payment received (GPay Reference ID: 29847120)",
                total_amount: 0,
                paid_amount: 3000,
                balance: 1500
            }
        ],
        financials: {
            total_billed: 14500,
            total_paid: 13000,
            remaining_balance: 1500
        }
    },
    {
        id: "cust_sample2",
        name: "Meenakshi Sundaram",
        phone: "8123456789",
        email: "meena.sundar@yahoo.com",
        address: "Fl. 201, Lakshmi Apartments, Secunderabad - 500003",
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
        notes: "Prefers designer piping on necklines. Wants deep boat neck style.",
        measurements: {
            blouse: {
                length: "13.8",
                chest: "34",
                waist: "29",
                shoulder: "14",
                sleeveLength: "9.5",
                sleeveRound: "11.8",
                frontNeck: "6.8",
                backNeck: "9.0",
                armHole: "15.5"
            },
            dress: {
                kurtiLength: "40",
                bottomLength: "37",
                bust: "34.5",
                waist: "30",
                hips: "38",
                sleeve: "15",
                shoulder: "14",
                armHole: "16"
            }
        },
        purchases: [{
            id: "rec_3",
            date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            type: "purchase",
            items: "Banarasi Silk Saree & Traditional Lining Stitching",
            total_amount: 8500,
            paid_amount: 8500,
            balance: 0
        }],
        financials: {
            total_billed: 8500,
            total_paid: 8500,
            remaining_balance: 0
        }
    }
];

// Firebase Configuration (Replace with your actual keys from the Firebase console)
const firebaseConfig = {
    apiKey: "AIzaSyDTEsyB-i4nj0qh9ZH1Tc5JoZe8zwWM1oY",
    authDomain: "lakshmi-boutique-39913.firebaseapp.com",
    projectId: "lakshmi-boutique-39913",
    storageBucket: "lakshmi-boutique-39913.firebasestorage.app",
    messagingSenderId: "641263902815",
    appId: "1:641263902815:web:c0fb750f144dafa1b03bea"
};

// Initialize Firebase if configured
let db = null;
if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}


function updateDashboardStats() {
    console.log("Dashboard updated");
}
// Load application and seed data if empty
firebase.auth().onAuthStateChanged(async(user) => {

    if (user) {

        document.getElementById("login-screen").style.display = "none";
        document.getElementById("app-content").style.display = "block";

        await initDatabase();
        switchPage('dashboard');

    } else {

        document.getElementById("login-screen").style.display = "block";
        document.getElementById("app-content").style.display = "none";

    }

});
// Database Operations
async function initDatabase() {
    if (db) {
        try {
            const snapshot = await db.collection("customers").get();
            if (!snapshot.empty) {
                state.customers = [];
                snapshot.forEach((doc) => {
                    state.customers.push({ id: doc.id, ...doc.data() });
                });
            } else {
                state.customers = [];
            }
        } catch (e) {
            console.error("Failed to load from Firestore, falling back to localStorage:", e);
            loadFromLocalStorage();
        }
    } else {
        loadFromLocalStorage();
    }
    updateDashboardStats();
}

function loadFromLocalStorage() {
    const localData = localStorage.getItem('lakshmi_boutique_db');
    if (localData) {
        try {
            state.customers = JSON.parse(localData);
        } catch (e) {
            console.error("Failed to parse database, resetting.", e);
            state.customers = [];
            saveDatabase();
        }
    } else {
        state.customers = [];

    }
}



async function saveDatabase() {
    localStorage.setItem('lakshmi_boutique_db', JSON.stringify(state.customers));
    updateDashboardStats();

    if (db) {
        try {
            const snapshot = await db.collection("customers").get();
            const currentIds = state.customers.map(c => c.id);

            const batch = db.batch();

            // Delete obsolete records
            snapshot.forEach(doc => {
                if (!currentIds.includes(doc.id)) {
                    batch.delete(doc.ref);
                }
            });

            // Set/update active records
            state.customers.forEach(cust => {
                const docRef = db.collection("customers").doc(cust.id);
                batch.set(docRef, cust);
            });

            await batch.commit();
        } catch (e) {
            console.error("Error saving to Firestore:", e);
        }
    }
}

// Router & Page Navigation
function switchPage(pageId, customerId = null) {
    state.currentView = pageId;

    // Hide all pages, show requested page
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(`page-${pageId}`);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Manage sidebar button highlights
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Highlight sidebar based on active section
    if (pageId === 'dashboard') {
        document.querySelector('.nav-btn[onclick="switchPage(\'dashboard\')"]').classList.add('active');
        updateDashboardStats();
    } else if (pageId === 'customers') {
        document.querySelector('.nav-btn[onclick="switchPage(\'customers\')"]').classList.add('active');
        renderCustomerDirectory();
    } else if (pageId === 'add-customer') {
        if (!customerId) {
            // Create mode
            document.querySelector('.nav-btn[onclick="switchPage(\'add-customer\')"]').classList.add('active');
            document.getElementById('add-customer-header-text').innerText = "Add New Customer";
            document.getElementById('customer-form').reset();
            document.getElementById('edit-customer-id').value = '';
        } else {
            // Edit mode
            document.getElementById('add-customer-header-text').innerText = "Edit Customer Details";
        }
    } else if (pageId === 'backup') {
        document.querySelector('.nav-btn[onclick="switchPage(\'backup\')"]').classList.add('active');
    } else if (pageId === 'customer-profile' && customerId) {
        state.currentCustomerId = customerId;
        renderCustomerProfile(customerId);
    }

    // Scroll to top of content
    window.scrollTo(0, 0);
}

// Dashboard Calculations
function updateDashboardStats() {
    const totalCustomers = state.customers.length;
    let totalBilled = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;

    state.customers.forEach(cust => {
        if (cust.financials) {
            totalBilled += cust.financials.total_billed || 0;
            totalPaid += cust.financials.total_paid || 0;
            outstandingBalance += cust.financials.remaining_balance || 0;
        }
    });

    // Safe DOM updates
    const elTotalCustomers = document.getElementById('stat-total-customers');
    if (elTotalCustomers) elTotalCustomers.innerText = totalCustomers;

    const elTotalBilled = document.getElementById('stat-total-billed');
    if (elTotalBilled) elTotalBilled.innerText = `₹${totalBilled.toLocaleString('en-IN')}`;

    const elTotalPaid = document.getElementById('stat-total-paid');
    if (elTotalPaid) elTotalPaid.innerText = `₹${totalPaid.toLocaleString('en-IN')}`;

    const elOutstandingBalance = document.getElementById('stat-outstanding-balance');
    if (elOutstandingBalance) elOutstandingBalance.innerText = `₹${outstandingBalance.toLocaleString('en-IN')}`;
}

// Render Customer Directory Page
function renderCustomerDirectory(customersList = state.customers) {
    const grid = document.getElementById('customer-cards-list');
    if (!grid) return;

    grid.innerHTML = '';

    if (customersList.length === 0) {
        grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--text-light); font-size: 1.1rem; font-weight: 500;">No matching customers found.</p>
        <p style="color: var(--text-light); font-size: 0.9rem; margin-top: 0.5rem;">Try modifying your search or filters.</p>
      </div>
    `;
        return;
    }

    customersList.forEach(cust => {
        const financials = cust.financials || { total_billed: 0, total_paid: 0, remaining_balance: 0 };
        const hasBalance = financials.remaining_balance > 0;
        const initials = getInitials(cust.name);

        const card = document.createElement('div');
        card.className = 'customer-card';
        card.setAttribute('onclick', `switchPage('customer-profile', '${cust.id}')`);
        card.innerHTML = `
      <div class="customer-card-header">
        <div>
          <h3 class="customer-name">${escapeHtml(cust.name)}</h3>
          <p class="customer-phone">${escapeHtml(cust.phone)}</p>
        </div>
        <span class="badge ${hasBalance ? 'badge-warning' : 'badge-success'}">
          ${hasBalance ? 'Pending Balance' : 'Fully Paid'}
        </span>
      </div>
      
      <div style="margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--text-light);">
        <strong>Items:</strong> 
        <span style="font-style: ${cust.purchases && cust.purchases.length > 0 ? 'normal' : 'italic'}">
          ${cust.purchases && cust.purchases.length > 0 
            ? truncateString(cust.purchases.filter(p => p.type === 'purchase').map(p => p.items).join(', '), 65) 
            : 'No purchases recorded'}
        </span>
      </div>

      <div class="customer-stats">
        <div>
          <p style="color: var(--text-light); font-size: 0.75rem; text-transform: uppercase;">Total Billed</p>
          <p class="customer-stat-val">₹${financials.total_billed.toLocaleString('en-IN')}</p>
        </div>
        <div style="text-align: right;">
          <p style="color: var(--text-light); font-size: 0.75rem; text-transform: uppercase;">Balance</p>
          <p class="customer-stat-val ${hasBalance ? 'outstanding' : ''}">₹${financials.remaining_balance.toLocaleString('en-IN')}</p>
        </div>
      </div>
    `;
        grid.appendChild(card);
    });
}

// Search and Filtering Logic
function filterCustomers() {
    const searchQuery = document.getElementById('customer-search-input').value.toLowerCase().trim();
    const balanceFilter = document.getElementById('balance-filter').value;

    const filtered = state.customers.filter(cust => {
        // Search match (name, phone, or purchased items)
        const matchesSearch =
            cust.name.toLowerCase().includes(searchQuery) ||
            cust.phone.includes(searchQuery) ||
            (cust.purchases && cust.purchases.some(p => p.items.toLowerCase().includes(searchQuery)));

        // Balance filter match
        const balance = cust.financials ? cust.financials.remaining_balance : 0;
        const matchesBalance =
            balanceFilter === 'all' ||
            (balanceFilter === 'has-balance' && balance > 0) ||
            (balanceFilter === 'fully-paid' && balance <= 0);

        return matchesSearch && matchesBalance;
    });

    renderCustomerDirectory(filtered);
}

// Save Customer (Add / Edit)
function saveCustomer(event) {
    event.preventDefault();

    const idInput = document.getElementById('edit-customer-id').value;
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const notes = document.getElementById('cust-notes').value.trim();

    if (!name || !phone) {
        alert("Please fill in the required fields (Name and Phone).");
        return;
    }

    if (idInput) {
        // Edit existing customer
        const idx = state.customers.findIndex(c => c.id === idInput);
        if (idx !== -1) {
            state.customers[idx].name = name;
            state.customers[idx].phone = phone;
            state.customers[idx].email = email;
            state.customers[idx].address = address;
            state.customers[idx].notes = notes;

            saveDatabase();
            alert("Customer details updated successfully!");
            switchPage('customer-profile', idInput);
        }
    } else {
        // Create new customer
        const newId = `cust_${Date.now()}`;
        const newCustomer = {
            id: newId,
            name: name,
            phone: phone,
            email: email,
            address: address,
            created_at: new Date().toISOString(),
            notes: notes,
            measurements: {
                blouse: { length: "", chest: "", waist: "", shoulder: "", sleeveLength: "", sleeveRound: "", frontNeck: "", backNeck: "", armHole: "" },
                dress: { kurtiLength: "", bottomLength: "", bust: "", waist: "", hips: "", sleeve: "", shoulder: "", armHole: "" }
            },
            purchases: [],
            financials: {
                total_billed: 0,
                total_paid: 0,
                remaining_balance: 0
            }
        };

        state.customers.push(newCustomer);
        saveDatabase();
        alert("New customer added successfully!");
        switchPage('customer-profile', newId);
    }
}

function editCurrentCustomer() {
    const cust = state.customers.find(c => c.id === state.currentCustomerId);
    if (!cust) return;

    document.getElementById('edit-customer-id').value = cust.id;
    document.getElementById('cust-name').value = cust.name;
    document.getElementById('cust-phone').value = cust.phone;
    document.getElementById('cust-email').value = cust.email || '';
    document.getElementById('cust-address').value = cust.address || '';
    document.getElementById('cust-notes').value = cust.notes || '';

    switchPage('add-customer', cust.id);
}

function cancelCustomerEdit() {
    if (state.currentCustomerId) {
        switchPage('customer-profile', state.currentCustomerId);
    } else {
        switchPage('customers');
    }
}

function confirmDeleteCustomer() {
    const cust = state.customers.find(c => c.id === state.currentCustomerId);
    if (!cust) return;

    const confirmMsg = `Are you absolutely sure you want to delete ${cust.name}? This will delete all their details, measurements, and billing history forever. This action cannot be undone.`;
    if (confirm(confirmMsg)) {
        state.customers = state.customers.filter(c => c.id !== cust.id);
        saveDatabase();
        alert("Customer deleted successfully.");
        state.currentCustomerId = null;
        switchPage('customers');
    }
}

// Render Customer Profile details page
function renderCustomerProfile(customerId) {
    const cust = state.customers.find(c => c.id === customerId);
    if (!cust) {
        alert("Customer not found!");
        switchPage('customers');
        return;
    }

    // Summary Sidebar elements
    document.getElementById('profile-name').innerText = cust.name;
    document.getElementById('profile-phone').innerText = cust.phone;
    document.getElementById('profile-email').innerText = cust.email || 'No email provided';
    document.getElementById('profile-avatar').innerText = getInitials(cust.name);

    if (cust.address) {
        document.getElementById('profile-address').innerText = cust.address;
        document.getElementById('profile-address-box').style.display = 'block';
    } else {
        document.getElementById('profile-address-box').style.display = 'none';
    }

    if (cust.notes) {
        document.getElementById('profile-notes').innerText = cust.notes;
        document.getElementById('profile-notes-box').style.display = 'block';
    } else {
        document.getElementById('profile-notes-box').style.display = 'none';
    }

    // Load Measurements
    const m = cust.measurements || {};
    const blouse = m.blouse || {};
    const dress = m.dress || {};

    // Blouse inputs
    document.getElementById('meas-blouse-length').value = blouse.length || '';
    document.getElementById('meas-blouse-chest').value = blouse.chest || '';
    document.getElementById('meas-blouse-waist').value = blouse.waist || '';
    document.getElementById('meas-blouse-shoulder').value = blouse.shoulder || '';
    document.getElementById('meas-blouse-sleeveLength').value = blouse.sleeveLength || '';
    document.getElementById('meas-blouse-sleeveRound').value = blouse.sleeveRound || '';
    document.getElementById('meas-blouse-frontNeck').value = blouse.frontNeck || '';
    document.getElementById('meas-blouse-backNeck').value = blouse.backNeck || '';
    document.getElementById('meas-blouse-armHole').value = blouse.armHole || '';

    // Dress inputs
    document.getElementById('meas-dress-kurtiLength').value = dress.kurtiLength || '';
    document.getElementById('meas-dress-bottomLength').value = dress.bottomLength || '';
    document.getElementById('meas-dress-bust').value = dress.bust || '';
    document.getElementById('meas-dress-waist').value = dress.waist || '';
    document.getElementById('meas-dress-hips').value = dress.hips || '';
    document.getElementById('meas-dress-shoulder').value = dress.shoulder || '';
    document.getElementById('meas-dress-sleeve').value = dress.sleeve || '';
    document.getElementById('meas-dress-armHole').value = dress.armHole || '';

    // Load Financials
    const tableBody = document.getElementById('profile-financial-records');
    tableBody.innerHTML = '';

    const records = cust.purchases || [];
    if (records.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-light); padding: 3rem;">No purchase history found. Click "Record Purchase" to add items.</td>
      </tr>
    `;
    } else {
        // Sort records chronologically (oldest first for transaction ledger style)
        const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedRecords.forEach(rec => {
                    const dateStr = formatDate(rec.date);
                    const isPurchase = rec.type === 'purchase';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
        <td style="color: var(--text-light); font-size: 0.85rem;">${dateStr}</td>
        <td>
          <span class="badge ${isPurchase ? 'badge-warning' : 'badge-success'}">
            ${isPurchase ? 'Purchase' : 'Payment'}
          </span>
        </td>
        <td style="font-weight: 500;">${escapeHtml(rec.items)}</td>
        <td style="text-align: right; font-weight: ${isPurchase ? '600' : 'normal'};">
          ${isPurchase ? `₹${rec.total_amount.toLocaleString('en-IN')}` : '-'}
        </td>
        <td style="text-align: right; color: var(--success); font-weight: ${!isPurchase ? '600' : 'normal'};">
          ₹${rec.paid_amount.toLocaleString('en-IN')}
        </td>
        <td style="text-align: right; font-weight: 600; color: ${rec.balance > 0 ? 'var(--warning)' : 'var(--text-color)'};">
          ₹${rec.balance.toLocaleString('en-IN')}
        </td>
        <td style="text-align: center;" class="no-print">
          <div style="display: flex; gap: 0.4rem; justify-content: center; align-items: center;">
            ${isPurchase ? `
              <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; min-height: auto; font-weight: 500; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.2rem;" onclick="editPurchaseRecord('${rec.id}')">
                <span>✏️</span> Edit
              </button>
            ` : ''}
            <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; min-height: auto; font-weight: 500; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.2rem;" onclick="deletePurchaseRecord('${rec.id}')">
              <span>🗑️</span> Delete
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Update Profile Financial Labels
  const fin = cust.financials || { total_billed: 0, total_paid: 0, remaining_balance: 0 };
  document.getElementById('profile-total-billed').innerText = `₹${fin.total_billed.toLocaleString('en-IN')}`;
  document.getElementById('profile-total-paid').innerText = `₹${fin.total_paid.toLocaleString('en-IN')}`;
  
  const elBal = document.getElementById('profile-remaining-balance');
  elBal.innerText = `₹${fin.remaining_balance.toLocaleString('en-IN')}`;
  if (fin.remaining_balance > 0) {
    elBal.className = 'outstanding';
  } else {
    elBal.className = '';
  }

  // Auto select measurements tab on profile open
  switchProfileTab(state.currentProfileTab);
}

// Profile Tab Switcher (Measurements vs Purchases)
function switchProfileTab(tabName) {
  state.currentProfileTab = tabName;

  document.querySelectorAll('.profile-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.profile-tab-content').forEach(cont => {
    cont.classList.remove('active');
  });

  const activeBtn = document.getElementById(`tab-btn-${tabName}`);
  const activeContent = document.getElementById(`profile-tab-${tabName}`);
  
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

// Save Measurements
function saveMeasurements(event) {
  event.preventDefault();

  const cust = state.customers.find(c => c.id === state.currentCustomerId);
  if (!cust) return;

  // Build measurements payload
  cust.measurements = {
    blouse: {
      length: document.getElementById('meas-blouse-length').value.trim(),
      chest: document.getElementById('meas-blouse-chest').value.trim(),
      waist: document.getElementById('meas-blouse-waist').value.trim(),
      shoulder: document.getElementById('meas-blouse-shoulder').value.trim(),
      sleeveLength: document.getElementById('meas-blouse-sleeveLength').value.trim(),
      sleeveRound: document.getElementById('meas-blouse-sleeveRound').value.trim(),
      frontNeck: document.getElementById('meas-blouse-frontNeck').value.trim(),
      backNeck: document.getElementById('meas-blouse-backNeck').value.trim(),
      armHole: document.getElementById('meas-blouse-armHole').value.trim()
    },
    dress: {
      kurtiLength: document.getElementById('meas-dress-kurtiLength').value.trim(),
      bottomLength: document.getElementById('meas-dress-bottomLength').value.trim(),
      bust: document.getElementById('meas-dress-bust').value.trim(),
      waist: document.getElementById('meas-dress-waist').value.trim(),
      hips: document.getElementById('meas-dress-hips').value.trim(),
      shoulder: document.getElementById('meas-dress-shoulder').value.trim(),
      sleeve: document.getElementById('meas-dress-sleeve').value.trim(),
      armHole: document.getElementById('meas-dress-armHole').value.trim()
    }
  };

  saveDatabase();
  alert("Measurements saved successfully!");
  renderCustomerProfile(cust.id);
}

// Modal Toggle Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// Record Purchase Actions
function openRecordPurchaseModal() {
  document.getElementById('purchase-form').reset();
  document.getElementById('pur-id').value = '';
  document.getElementById('pur-balance').value = '0';
  document.getElementById('purchase-modal-title').innerText = "Record New Purchase / Tailoring Work";
  document.getElementById('purchase-modal-submit-btn').innerText = "Add Purchase";
  openModal('modal-purchase');
}

function calculateModalBalance(type) {
  if (type === 'purchase') {
    const total = parseFloat(document.getElementById('pur-total').value) || 0;
    const paid = parseFloat(document.getElementById('pur-paid').value) || 0;
    const bal = Math.max(0, total - paid);
    document.getElementById('pur-balance').value = bal;
  } else if (type === 'payment') {
    const currentCust = state.customers.find(c => c.id === state.currentCustomerId);
    if (!currentCust) return;
    const curBal = currentCust.financials.remaining_balance || 0;
    const paidInput = parseFloat(document.getElementById('pay-amount').value) || 0;
    const newBal = Math.max(0, curBal - paidInput);
    document.getElementById('pay-balance').value = newBal;
  }
}

function savePurchase(event) {
  event.preventDefault();

  const cust = state.customers.find(c => c.id === state.currentCustomerId);
  if (!cust) return;

  const purId = document.getElementById('pur-id').value;
  const items = document.getElementById('pur-items').value.trim();
  const total = parseFloat(document.getElementById('pur-total').value) || 0;
  const paid = parseFloat(document.getElementById('pur-paid').value) || 0;
  const balance = Math.max(0, total - paid);

  if (!items || total < 0 || paid < 0) {
    alert("Please enter valid purchase details.");
    return;
  }

  if (purId) {
    // Edit existing purchase
    const purIdx = cust.purchases.findIndex(p => p.id === purId);
    if (purIdx !== -1) {
      cust.purchases[purIdx].items = items;
      cust.purchases[purIdx].total_amount = total;
      cust.purchases[purIdx].paid_amount = paid;
      cust.purchases[purIdx].balance = balance;
    }
  } else {
    // Add new purchase
    const newPurchase = {
      id: `rec_${Date.now()}`,
      date: new Date().toISOString(),
      type: "purchase",
      items: items,
      total_amount: total,
      paid_amount: paid,
      balance: balance
    };

    if (!cust.purchases) cust.purchases = [];
    cust.purchases.push(newPurchase);
  }

  // Recalculate customer total financials
  recalculateFinancials(cust);
  saveDatabase();
  closeModal('modal-purchase');
  
  // Reload profiles page
  state.currentProfileTab = 'purchases'; // Switch to transaction log tab
  renderCustomerProfile(cust.id);
  alert(purId ? "Purchase Updated Successfully" : "Purchase recorded and customer accounts updated!");
}

function editPurchaseRecord(recId) {
  const cust = state.customers.find(c => c.id === state.currentCustomerId);
  if (!cust) return;
  const rec = cust.purchases.find(p => p.id === recId);
  if (!rec) return;

  document.getElementById('pur-id').value = rec.id;
  document.getElementById('pur-items').value = rec.items;
  document.getElementById('pur-total').value = rec.total_amount;
  document.getElementById('pur-paid').value = rec.paid_amount;
  document.getElementById('pur-balance').value = Math.max(0, rec.total_amount - rec.paid_amount);

  document.getElementById('purchase-modal-title').innerText = "Edit Purchase Record";
  document.getElementById('purchase-modal-submit-btn').innerText = "Save Changes";

  openModal('modal-purchase');
}

function deletePurchaseRecord(recId) {
  const cust = state.customers.find(c => c.id === state.currentCustomerId);
  if (!cust) return;

  const rec = cust.purchases.find(p => p.id === recId);
  if (!rec) return;

  const isPurchase = rec.type === 'purchase';
  const typeLabel = isPurchase ? 'purchase record' : 'payment record';
  
  if (confirm(`Are you sure you want to delete this ${typeLabel}? This action cannot be undone.`)) {
    cust.purchases = cust.purchases.filter(p => p.id !== recId);
    recalculateFinancials(cust);
    saveDatabase();
    renderCustomerProfile(cust.id);
    alert(`${isPurchase ? 'Purchase' : 'Payment'} record deleted successfully.`);
  }
}

// Record Payment Actions
function openRecordPaymentModal() {
  const cust = state.customers.find(c => c.id === state.currentCustomerId);
  if (!cust) return;

  const bal = cust.financials.remaining_balance || 0;
  if (bal <= 0) {
    alert("This customer has a zero balance! No payment is due.");
    return;
  }

  document.getElementById('payment-form').reset();
  document.getElementById('payment-outstanding-max').innerText = `₹${bal.toLocaleString('en-IN')}`;
  document.getElementById('pay-balance').value = bal;
  
  // Set max limitation on amount paid
  document.getElementById('pay-amount').max = bal;
  
  openModal('modal-payment');
}

function savePayment(event) {
  event.preventDefault();

  const cust = state.customers.find(c => c.id === state.currentCustomerId);
  if (!cust) return;

  const paidAmount = parseFloat(document.getElementById('pay-amount').value) || 0;
  const method = document.getElementById('pay-method').value.trim() || 'Cash';
  const currentBalance = cust.financials.remaining_balance || 0;

  if (paidAmount <= 0) {
    alert("Payment amount must be greater than zero.");
    return;
  }

  if (paidAmount > currentBalance) {
    alert(`The payment amount (₹${paidAmount}) exceeds the outstanding balance (₹${currentBalance}). Please enter a correct amount.`);
    return;
  }

  const balanceAfterPayment = Math.max(0, currentBalance - paidAmount);

  const newPayment = {
    id: `rec_${Date.now()}`,
    date: new Date().toISOString(),
    type: "payment",
    items: `Payment received via ${method}`,
    total_amount: 0,
    paid_amount: paidAmount,
    balance: balanceAfterPayment
  };

  if (!cust.purchases) cust.purchases = [];
  cust.purchases.push(newPayment);

  // Recalculate financials
  recalculateFinancials(cust);
  saveDatabase();
  closeModal('modal-payment');

  // Reload profile page
  state.currentProfileTab = 'purchases'; // Switch to transaction log tab
  renderCustomerProfile(cust.id);
  alert("Payment recorded successfully!");
}

// Recalculation Engine
function recalculateFinancials(customer) {
  let totalBilled = 0;
  let totalPaid = 0;
  
  // Step through in chronological order to dynamically update balance for each row
  const sorted = [...customer.purchases].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let trackingBalance = 0;

  sorted.forEach(rec => {
    if (rec.type === 'purchase') {
      totalBilled += rec.total_amount || 0;
      totalPaid += rec.paid_amount || 0;
      trackingBalance += (rec.total_amount - rec.paid_amount);
    } else if (rec.type === 'payment') {
      totalPaid += rec.paid_amount || 0;
      trackingBalance -= rec.paid_amount;
    }
    
    // Set running row balance
    rec.balance = Math.max(0, trackingBalance);
  });

  customer.financials = {
    total_billed: totalBilled,
    total_paid: totalPaid,
    remaining_balance: Math.max(0, trackingBalance)
  };
}

// Backup Operations
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.customers, null, 2));
  const dlAnchorElem = document.createElement('a');
  
  const today = new Date().toISOString().split('T')[0];
  const filename = `lakshmi_boutique_backup_${today}.json`;
  
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", filename);
  dlAnchorElem.click();
}

function importData(event) {
  const input = event.target;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const parsedData = JSON.parse(e.target.result);
      
      // Basic structure validation
      if (!Array.isArray(parsedData)) {
        throw new Error("Invalid file format. Data must be an array of customers.");
      }
      
      const confirmMsg = `Are you sure you want to import this file? It will replace all ${state.customers.length} customer records with ${parsedData.length} records from the backup file. This cannot be undone.`;
      if (confirm(confirmMsg)) {
        state.customers = parsedData;
        saveDatabase();
        alert("Database restored successfully!");
        
        // Reset view to dashboard
        switchPage('dashboard');
      }
    } catch (err) {
      alert("Error importing file: " + err.message);
    }
  };
  
  reader.readAsText(file);
  
  // Clear the input value so the same file can be re-uploaded if needed
  input.value = '';
}

// Utilities
function getInitials(name) {
  if (!name) return 'LB';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncateString(str, num) {
  if (!str) return '';
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    firebase.auth()
        .signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert(error.message);
        });
}