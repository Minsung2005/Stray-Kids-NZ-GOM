const DEMO = {
  settings: { organiser: 'Mia K.', instagram: '@skz.nz.gos', currency: 'NZD', threshold: 0.67, paymentMethods: ['Kiwibank · 12-3456-7890123-00', 'PayPal · skz.nz.gos@email.com'], fees: { stamped: 4.5, tracked: 8.5, perCard: 0.35 } },
  orders: [
    { id: 'skzoo', name: 'SKZOO 10cm Plush', artist: 'Stray Kids', type: 'Merch', deadline: '2026-10-31', paymentDeadline: '2026-11-04', description: 'A tiny friend for your shelf. Pick your member below; orders close at midnight.', privateNote: 'Confirm JYP Shop stock before placing the batch.', status: 'open', items: [{ id: 'plush', name: 'SKZOO 10cm Original Plush', kind: 'merch', price: 42, stock: 24, claimed: 18, image: 'SKZOO', options: ['Wolf Chan', 'Leebit', 'Dwaekki', 'Jiniret', 'HAN QUOKKA', 'BbokAri', 'PuppyM', 'FoxI.N'] }] },
    { id: 'ate', name: 'ATE Album Vol. 2', artist: 'Stray Kids', type: 'Album', deadline: '2026-11-04', paymentDeadline: '2026-11-06', description: 'Member versions from Ktown4u. Album photocards are random.', status: 'open', items: [{ id: 'versions', name: 'Member Version', kind: 'set', price: 31.5, totalSlots: 3, threshold: 0.67, claims: { 'Bang Chan': 2, 'Lee Know': 1, Changbin: 1, Hyunjin: 0, Han: 0, Felix: 2, Seungmin: 0, 'I.N': 0 }, options: ['Bang Chan', 'Lee Know', 'Changbin', 'Hyunjin', 'Han', 'Felix', 'Seungmin', 'I.N'] }, { id: 'pob', name: 'Ktown4u POB Set', kind: 'batch', price: 12, batchSize: 5, claimed: 4, options: ['Any member'] }] },
    { id: 'season', name: '2025 Season’s Greetings', artist: 'Stray Kids', type: 'Merch', deadline: '2026-09-10', paymentDeadline: '2026-09-12', description: 'Closed order. Check your claim in My orders.', status: 'closed', items: [{ id: 'season-set', name: 'Season’s Greetings', kind: 'merch', price: 88, stock: 14, claimed: 14, options: ['Standard set'] }] },
    { id: 'itzy', name: 'GOLD Album + POB', artist: 'ITZY', type: 'Album', deadline: '2026-11-12', paymentDeadline: '2026-11-14', description: 'Album and first press benefit bundle.', status: 'open', items: [{ id: 'itzy-album', name: 'Member version', kind: 'set', price: 28, totalSlots: 2, threshold: 0.67, claims: { Yeji: 1, Lia: 0, Ryujin: 2, Chaeryeong: 0, Yuna: 0 }, options: ['Yeji', 'Lia', 'Ryujin', 'Chaeryeong', 'Yuna'] }] }
  ],
  shop: [{ id: 'shop-1', name: 'Lee Know lucky draw', category: 'Photocard', price: 14, stock: 1, description: 'One official lucky draw card.' }, { id: 'shop-2', name: 'SKZ light stick pouch', category: 'Accessories', price: 18, stock: 3, description: 'Protective zip pouch.' }],
  rules: `# House rules\n\n**Claiming**\nClaims are binding. Please check the item, member and quantity before submitting.\n\n**Securing**\nA set secures when it reaches the minimum share shown on the item. Unsecured claims may be released after the GO closes.\n\n**Payment**\nPayment is due by the date shown. Include your Instagram username in the reference.\n\n**Shipping**\nNZ domestic shipping is stamped or tracked. Combine your claims where possible to save on postage.\n\n**Communication**\nUpdates happen through Instagram DMs and the group chat. Please reply promptly to payment and address requests.\n\n**Blocking**\nRepeated unpaid claims, chargebacks or harassment can result in a block from future GOs.`,
  payments: [{ id: 1, username: 'livskz', go: 'SKZOO 10cm Plush', amount: 42, method: 'Bank transfer', reference: 'LIV-026', submitted: '12 minutes ago', status: 'Pending' }, { id: 2, username: 'stayjinnie', go: 'ATE Album Vol. 2', amount: 31.5, method: 'PayPal', reference: 'ATE-JIN', submitted: '2 hours ago', status: 'Pending' }],
  storeOrders: [{ id: 1, username: 'livskz', vendor: 'JYP Shop', description: 'SKZOO 10cm Plush · Wolf Chan', amountOwed: 42, status: 'Awaiting payment' }, { id: 2, username: 'stayjinnie', vendor: 'Ktown4u', description: 'ATE Album Vol. 2 · Felix version', amountOwed: 31.5, status: 'Paid' }],
  claims: [{ username: 'livskz', goId: 'skzoo', itemId: 'plush', selections: { 'Wolf Chan': 1 }, amount: 42, status: 'Paid', credit: 0 }, { username: 'stayjinnie', goId: 'ate', itemId: 'versions', selections: { Felix: 1 }, amount: 31.5, status: 'Secured', credit: 0 }]
};

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const STORE_KEY = 'go-manager-demo-v2';
const ADMIN_PASSWORD = 'Jaeger14';
const supabaseClient = window.supabase && window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey
  ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey)
  : null;
let cloudReady = false;
let cloudSaving = false;
let userAccountsReady = Promise.resolve();
function dedupePayments(payments = []) {
  const seen = new Set();
  return payments.filter((payment) => {
    const key = [payment.username, payment.go, payment.amount, payment.method, payment.reference]
      .map((value) => String(value ?? '').trim().toLowerCase())
      .join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const isAdminUnlocked = () => sessionStorage.getItem('go-manager-admin') === 'unlocked';
const publicState = () => ({ settings: state.settings, orders: state.orders, shop: state.shop, rules: state.rules, claims: state.claims });
let state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || DEMO;
state.storeOrders ||= structuredClone(DEMO.storeOrders);
state.payments ||= structuredClone(DEMO.payments);
state.payments = dedupePayments(state.payments);
state.claims ||= structuredClone(DEMO.claims);
state.userAccounts ||= {};
state.shop ||= structuredClone(DEMO.shop);
state.settings ||= structuredClone(DEMO.settings);
state.orders.forEach((go) => {
  go.setsOnHand ??= 0;
  go.items ||= [];
  go.items.forEach((item, index) => {
    item.sortOrder ??= index;
    if (item.kind === 'set') {
      item.secureThreshold = 0.6;
      item.claimedSets ??= Math.max(0, ...Object.values(item.claims || {}));
    }
  });
  go.items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
});
localStorage.setItem(STORE_KEY, JSON.stringify(state));
async function loadUserAccounts() {
  if (!supabaseClient) return;
  const result = await supabaseClient.from('user_accounts').select('username,password_hash,password_salt,created_at');
  if (result.error) {
    if (!['42P01', 'PGRST205'].includes(result.error.code)) notify(`Account sync failed: ${result.error.message}`);
    return;
  }
  state.userAccounts = Object.fromEntries(result.data.map((account) => [account.username, {
    salt: account.password_salt,
    hash: account.password_hash,
    createdAt: account.created_at
  }]));
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
async function saveUserAccount(username, account) {
  if (!supabaseClient) return;
  const result = await supabaseClient.from('user_accounts').upsert({
    username,
    password_hash: account.hash,
    password_salt: account.salt,
    created_at: account.createdAt
  });
  if (result.error) {
    if (['42P01', 'PGRST205'].includes(result.error.code)) return;
    throw new Error(`Account save failed: ${result.error.message}`);
  }
}
let activeArtist = 'All';
let expandedItems = new Set(['versions']);
let adminTab = 'GOs';
const money = (value) => new Intl.NumberFormat('en-NZ', { style: 'currency', currency: state.settings.currency }).format(value);
const date = (value) => new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
const save = () => {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  if (supabaseClient && cloudReady && isAdminUnlocked()) {
    cloudSaving = true;
    return Promise.all([
      supabaseClient.from('app_public_state').upsert({ id: 'main', state: publicState(), updated_at: new Date().toISOString() }),
      supabaseClient.from('app_private_state').upsert({ id: 'main', state, updated_at: new Date().toISOString() })
    ]).then(([publicResult, privateResult]) => {
      const error = publicResult.error || privateResult.error;
        cloudSaving = false;
        if (error) {
          document.querySelector('.sync')?.classList.remove('live');
          notify(`Cloud save failed: ${error.message}`);
        } else {
          document.querySelector('.sync')?.classList.add('live');
        }
      }).catch((error) => {
        cloudSaving = false;
        document.querySelector('.sync')?.classList.remove('live');
        notify(`Cloud save failed: ${error.message}`);
        throw error;
      });
  }
  return Promise.resolve();
};
async function saveToLiveSite() {
  if (!supabaseClient) {
    notify('Supabase is not configured.');
    return;
  }
  if (!isAdminUnlocked() || !cloudReady) {
    notify('Sign in to Supabase before saving to the live site.');
    return;
  }
  const button = document.querySelector('[data-action="save-live"]');
  if (button) { button.disabled = true; button.textContent = 'Saving…'; }
  try {
    await publishLocalClaims();
    await save();
    notify('Saved to the live site.');
  } catch {
    // save() already reports the database error.
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Save to live site'; }
  }
}
async function loadCloudState() {
  if (!supabaseClient) return;
  const publicResult = await supabaseClient.from('app_public_state').select('state').eq('id', 'main').maybeSingle();
  if (publicResult.error) {
    notify(`Cloud load failed: ${publicResult.error.message}`);
    return;
  }
  if (isAdminUnlocked()) {
    const privateResult = await supabaseClient.from('app_private_state').select('state').eq('id', 'main').maybeSingle();
    if (privateResult.error) {
      notify(`Private cloud load failed: ${privateResult.error.message}`);
      return;
    }
    if (privateResult.data?.state) {
      state = privateResult.data.state;
      state.payments = dedupePayments(state.payments);
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      render();
    }
  } else if (publicResult.data?.state) {
    state = { ...state, ...publicResult.data.state };
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    render();
  }
  await loadClaimEvents();
  await loadUserAccounts();
  cloudReady = true;
  document.querySelector('.sync')?.classList.add('live');
}
async function loadClaimEvents() {
  if (!supabaseClient) return;
  const result = await supabaseClient.from('claim_events').select('id,go_id,item_id,instagram_username,selections,amount,status,created_at').order('created_at', { ascending: true });
  if (result.error) {
    if (result.error.code !== '42P01') notify(`Claim sync failed: ${result.error.message}`);
    return;
  }
  const unpublishedClaims = isAdminUnlocked() ? state.claims.filter((claim) => !claim.cloudClaimId) : [];
  state.claims = result.data.map((claim) => ({
    cloudClaimId: claim.id,
    username: claim.instagram_username,
    goId: claim.go_id,
    itemId: claim.item_id,
    selections: claim.selections || {},
    amount: Number(claim.amount),
    status: claim.status,
    credit: 0,
    createdAt: claim.created_at
  })).concat(unpublishedClaims);
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  render();
}
async function publishLocalClaims() {
  if (!supabaseClient || !isAdminUnlocked()) return;
  const claims = state.claims.filter((claim) => !claim.cloudClaimId);
  if (!claims.length) return;
  const result = await supabaseClient.from('claim_events').insert(claims.map((claim) => ({
    go_id: claim.goId,
    item_id: claim.itemId,
    instagram_username: claim.username,
    selections: claim.selections || {},
    amount: claim.amount,
    status: claim.status
  }))).select('id');
  if (result.error && result.error.code !== '42P01') throw new Error(`Claim publish failed: ${result.error.message}`);
}
const notify = (message) => { toast.textContent = message; toast.classList.add('show'); window.clearTimeout(notify.timeout); notify.timeout = window.setTimeout(() => toast.classList.remove('show'), 2600); };
const basket = () => JSON.parse(localStorage.getItem('go-manager-basket') || '[]');
const saveBasket = (items) => localStorage.setItem('go-manager-basket', JSON.stringify(items));
function downloadFile(filename, contents, type = 'text/plain') { const blob = new Blob([contents], { type }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href); }
function readPhoto(file) { return file && file.size ? new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }) : Promise.resolve(null); }
function closeModal() { document.querySelector('.modal-backdrop')?.remove(); }
function openModal(title, body) { closeModal(); document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" data-modal><div class="modal" role="dialog" aria-modal="true"><button class="modal-close" data-action="close-modal" aria-label="Close">×</button>${body}</div></div>`); document.querySelector('.modal-backdrop input')?.focus(); }
const goById = (id) => state.orders.find((go) => go.id === id);
const tagClass = (type) => type.toLowerCase();
const route = () => window.location.hash.replace(/^#/, '') || 'orders';

function shell(content, current = 'orders') {
  return `<header class="site-header"><a class="logo" href="#orders"><span>⚡</span> GO MANAGER</a><nav class="main-nav" aria-label="Main navigation">
    ${[['orders', 'Group orders'], ['shop', 'Shop'], ['my-orders', 'My orders'], ['rules', 'Rules']].map(([href, label]) => `<a class="${current === href ? 'active' : ''}" href="#${href}">${label}</a>`).join('')}
  </nav><div class="header-actions"><span class="sync"><i></i> Synced.</span><a class="admin-link" href="#admin">Admin <span>↗</span></a><button class="menu-button" data-action="menu" aria-label="Open menu">☰</button></div></header><main class="page">${content}</main><footer><span>GO MANAGER · NZ</span><span>Organised with care for fans, by fans.</span></footer>`;
}

function pageHeading(eyebrow, title, copy = '') { return `<div class="page-heading"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${copy ? `<p class="lede">${copy}</p>` : ''}</div>`; }
function filterChips(artists) { return `<div class="chip-row" role="tablist">${['All', ...artists].map((artist) => `<button class="chip ${activeArtist === artist ? 'active' : ''}" data-action="artist" data-artist="${artist}">${artist}</button>`).join('')}</div>`; }
function orderCard(go) { const securedSets = securedSetsForGo(go); return `<a class="go-card" href="#go/${go.id}">${go.image ? `<div class="go-cover" style="background-image:url('${go.image}')"></div>` : ''}<div class="card-top"><span class="category ${tagClass(go.type)}">${go.type}</span><span class="open-pill">● ${go.status === 'open' ? 'Open' : 'Closed'}</span></div><h3>${go.name}</h3><div class="card-detail"><span>🗓 Closes ${date(go.deadline)}</span><span>${go.items.length} ${go.items.length === 1 ? 'item' : 'items'}${go.setsOnHand ? ` · ${go.setsOnHand} sets on hand` : ''}</span></div>${securedSets ? `<div class="secured-summary"><strong>${securedSets} set${securedSets === 1 ? '' : 's'} secured</strong><span>60% member fill reached</span></div>` : ''}<div class="card-bottom"><span>${go.description}</span><b>View GO ↗</b></div></a>`; }

function ordersView() {
  const active = state.orders.filter((go) => go.status === 'open' && (activeArtist === 'All' || go.artist === activeArtist));
  const closed = state.orders.filter((go) => go.status === 'closed' && (activeArtist === 'All' || go.artist === activeArtist));
  const artists = [...new Set(state.orders.map((go) => go.artist))];
  const groups = [...new Set(active.map((go) => go.artist))];
  return shell(`<div class="container">${pageHeading('WELCOME TO GO MANAGER', 'Active group orders', 'Join a New Zealand group order, pick your member and keep your costs tidy.')}${filterChips(artists)}<div class="order-groups">${groups.map((artist) => `<section class="artist-section"><div class="section-title"><h2>${artist}</h2><span>${active.filter((go) => go.artist === artist).length} open</span></div><div class="go-grid">${active.filter((go) => go.artist === artist).map(orderCard).join('')}</div></section>`).join('')}</div><details class="closed-section"><summary>▸ Closed (${closed.length})</summary><div class="go-grid">${closed.map(orderCard).join('')}</div></details><div class="note-banner"><span>✦</span><div><strong>New here?</strong><p>Choose an order, claim your spot, then check <a href="#my-orders">My orders</a> for payment and shipping updates.</p></div></div></div>`, 'orders');
}

function itemProgress(item) {
  const claimed = item.kind === 'set' ? Object.values(item.claims).reduce((a, b) => a + b, 0) : item.claimed;
  const total = item.kind === 'set' ? item.options.length * item.totalSlots : item.stock || item.batchSize * 2;
  return { claimed, total };
}
function availableSets(item) {
  if (item.kind !== 'set') return 0;
  const setCount = item.setCount ?? item.totalSlots ?? 0;
  const options = item.options || Object.keys(item.claims || {});
  if (!options.length) return setCount;
  return Math.max(0, Math.min(...options.map((option) => setCount - (item.claims?.[option] || 0))));
}
function availableOptionStock(item, option) {
  if (item.kind !== 'set') return 0;
  const setCount = item.setCount ?? item.totalSlots ?? 0;
  return Math.max(0, setCount - (item.claims?.[option] || 0));
}
function setRecords(item) {
  if (item.kind !== 'set' || !item.options.length) return [];
  const setCount = item.setCount ?? item.totalSlots ?? 0;
  const requiredMembers = Math.ceil(item.options.length * (item.secureThreshold ?? 0.6));
  const holders = Object.fromEntries(item.options.map((member) => [member, []]));
  [...state.claims].reverse().forEach((claim) => {
    Object.entries(claim.selections || {}).forEach(([key, quantity]) => {
      if (!key.startsWith(`${item.id}-`)) return;
      const member = key.slice(`${item.id}-`.length);
      if (!holders[member]) return;
      for (let count = 0; count < quantity; count += 1) holders[member].push(['Paid', 'Supplied'].includes(claim.status) ? 'Claimed' : `@${claim.username}`);
    });
  });
  return Array.from({ length: setCount }, (_, index) => {
    const setNumber = index + 1;
    const members = Object.fromEntries(item.options.map((member) => [member, holders[member][index] || 'Still available']));
    const filledMembers = Object.values(members).filter((holder) => holder !== 'Still available').length;
    return { number: setNumber, members, secured: filledMembers >= requiredMembers };
  });
}
function securedSetCount(item) {
  if (item.kind !== 'set' || !item.options.length) return 0;
  const setCount = item.setCount ?? item.totalSlots ?? 0;
  const requiredMembers = Math.ceil(item.options.length * (item.secureThreshold ?? 0.6));
  return Array.from({ length: setCount }, (_, index) => index + 1)
    .filter((setNumber) => item.options.filter((member) => (item.claims?.[member] || 0) >= setNumber).length >= requiredMembers)
    .length;
}
function setSecured(item, member) { return (item.claims?.[member] || 0) >= Math.ceil(item.totalSlots * (item.secureThreshold ?? 0.6)); }
function itemIsSecured(item) { return securedSetCount(item) > 0; }
function securedSetsForGo(go) { return go.items.reduce((total, item) => total + securedSetCount(item), 0); }
function itemRow(go, item) {
  const open = expandedItems.has(item.id); const progress = itemProgress(item); const securedSets = securedSetCount(item); const progressText = item.kind === 'batch' ? `${progress.claimed} claimed · batches of ${item.batchSize}` : item.kind === 'merch' ? `${progress.claimed} claimed · ${item.stock - progress.claimed} left` : `${securedSets} set${securedSets === 1 ? '' : 's'} secured · ${availableSets(item)} available`;
  return `<section class="item-card ${open ? 'expanded' : ''} ${itemIsSecured(item) ? 'secured-item' : ''}">${item.image ? `<div class="item-image"><img src="${item.image}" alt="${item.name}" /></div>` : ''}<button class="item-head" data-action="toggle-item" data-item="${item.id}"><span class="item-index">${String(go.items.indexOf(item) + 1).padStart(2, '0')}</span><span class="item-info"><strong>${item.name} ${itemIsSecured(item) ? '<em class="secured-label">Secured</em>' : ''}</strong><span>${item.kind === 'set' ? 'Set-based item · 60% of members secures a set' : item.kind === 'batch' ? 'Batch item · repeats allowed' : 'Quantity item'} · ${money(item.price)} each</span></span><span class="item-progress"><b>${progressText}</b><i><em style="width:${Math.min(100, (progress.claimed / progress.total) * 100)}%"></em></i></span><span class="chevron">${open ? '−' : '+'}</span></button>${open ? `<div class="item-body">${claimPicker(go, item)}</div>` : ''}</section>`;
}
function claimPicker(go, item) {
  if (item.kind === 'merch') return `<div class="merch-picker"><div><strong>How many?</strong><p>Stock is limited to ${item.stock} pieces.</p></div><div class="stepper"><button data-action="adjust-claim" data-item="${item.id}" data-option="Standard set" data-delta="-1">−</button><b data-count="${item.id}-Standard set">0</b><button data-action="adjust-claim" data-item="${item.id}" data-option="Standard set" data-delta="1">+</button></div></div>`;
  if (item.kind === 'batch') return `<div class="batch-picker"><div><strong>Pick any member</strong><p>Member choice only affects sorting priority. Repeats are allowed.</p></div><select data-batch-select="${item.id}">${item.options.map((option) => `<option>${option}</option>`).join('')}</select><div class="stepper"><button data-action="adjust-claim" data-item="${item.id}" data-option="Any member" data-delta="-1">−</button><b data-count="${item.id}-Any member">0</b><button data-action="adjust-claim" data-item="${item.id}" data-option="Any member" data-delta="1">+</button></div></div>`;
  const records = setRecords(item);
  return `<div><div class="set-availability"><strong>${availableSets(item)} set${availableSets(item) === 1 ? '' : 's'} still available</strong><span>Select the members you want in your set.</span></div><div class="set-records">${records.map((record) => `<div class="set-record ${record.secured ? 'secured' : ''}"><strong>Set ${record.number} · ${record.secured ? 'Secured' : 'Still available'}</strong><div>${Object.entries(record.members).map(([member, holder]) => `<span class="${holder === 'Still available' ? 'member-available' : ''}">${member}: ${holder}</span>`).join('')}</div></div>`).join('')}</div><div class="member-grid">${item.options.map((member) => { const claimed = item.claims[member] || 0; const secured = setSecured(item, member); const remaining = availableOptionStock(item, member); return `<div class="member-tile ${secured ? 'secured' : ''}"><div class="member-name"><strong>${member}</strong><span>${remaining} ${remaining === 1 ? 'set' : 'sets'} available</span></div><div class="stepper"><button data-action="adjust-claim" data-item="${item.id}" data-option="${member}" data-delta="-1">−</button><b data-count="${item.id}-${member}">0</b><button data-action="adjust-claim" data-item="${item.id}" data-option="${member}" data-delta="1" ${remaining < 1 ? 'disabled' : ''}>+</button></div></div>`; }).join('')}<div class="member-tile ot-tile"><div class="member-name"><strong>All members</strong><span>Full set · ${money(item.price * item.options.length)}</span></div><button class="ot-button" data-action="ot-claim" data-item="${item.id}" ${item.options.some((option) => availableOptionStock(item, option) < 1) ? 'disabled' : ''}>Add full set</button></div></div></div>`;
}
function detailView(id) {
  const go = goById(id); if (!go) return notFound();
  const securedSets = securedSetsForGo(go);
  return shell(`<div class="container narrow"><a class="back-link" href="#orders">← Back to group orders</a><div class="detail-heading"><div><span class="category ${tagClass(go.type)}">${go.type}</span><h1>${go.name}</h1><p>${go.description}</p>${securedSets ? `<div class="secured-summary"><strong>${securedSets} set${securedSets === 1 ? '' : 's'} secured</strong><span>60% member fill reached</span></div>` : ''}</div><div class="detail-dates"><span>🗓️ Closes <b>${date(go.deadline)}</b></span><span>💸 Payment due <b>${date(go.paymentDeadline)}</b></span></div></div><div class="claim-layout"><div class="items-column">${go.items.map((item) => itemRow(go, item)).join('')}</div><aside class="claim-sidebar"><div class="summary-card"><p class="eyebrow">YOUR CLAIM</p><h2>Ready when you are.</h2><div id="claim-summary"><p class="muted">Your selected items will appear here.</p></div><form id="claim-form"><label>Instagram username<input name="username" required placeholder="@yourusername" autocomplete="off" /></label><label class="check-label"><input type="checkbox" required /> I have checked my member and quantity.</label><button class="primary-button" type="submit">Submit claim <span>↗</span></button></form></div><div class="help-card"><strong>How securing works</strong><p>One set includes one of each member. A set is marked secured when at least 60% of its member choices are filled.</p><a href="#rules">Read all rules →</a></div></aside></div></div>`, 'orders');
}

function shopView() { const categories = ['Album', 'Photocard', 'Merch', 'Accessories']; const itemsInBasket = basket(); const basketTotal = itemsInBasket.reduce((sum, item) => sum + item.price * item.quantity, 0); return shell(`<div class="container">${pageHeading('LEFTOVERS & EXTRAS', 'The shop', 'First come, first served. Domestic shipping can be combined with your GO claims.')}${itemsInBasket.length ? `<div class="basket-bar"><strong>${itemsInBasket.reduce((sum, item) => sum + item.quantity, 0)} item${itemsInBasket.length > 1 ? 's' : ''} in your basket</strong><span>${money(basketTotal)}</span><button class="primary-button" data-action="checkout-shop">Checkout ↗</button></div>` : ''}${categories.map((category) => { const items = state.shop.filter((item) => item.category === category && item.stock > 0); return items.length ? `<section class="shop-section"><div class="section-title"><h2>${category}</h2><span>${items.length} listing${items.length > 1 ? 's' : ''}</span></div><div class="shop-grid">${items.map((item) => { const inBasket = itemsInBasket.find((entry) => entry.id === item.id)?.quantity || 0; return `<article class="shop-card"><div class="shop-art ${tagClass(category)}" ${item.image ? `style="background-image:url('${item.image}')"` : ''}>${item.image ? '' : category.slice(0, 3).toUpperCase()}</div><div><span class="category ${tagClass(category)}">${category}</span><h3>${item.name}</h3><p>${item.description}</p><div class="shop-meta"><strong>${money(item.price)}</strong><span>${item.stock - inBasket} available</span></div><button class="secondary-button" data-action="shop-add" data-shop="${item.id}">${inBasket ? `In basket · ${inBasket}` : 'Add to order'} <span>+</span></button></div></article>`; }).join('')}</div></section>` : ''; }).join('')}<div class="empty-state"><span>✦</span><h2>Nothing for sale right now?</h2><p>Check back after a GO closes. Leftover stock lands here first.</p></div></div>`, 'shop'); }

function myOrdersView() {
  const username = sessionStorage.getItem('go-manager-username') || '';
  const claims = username ? state.claims.filter((claim) => claim.username.toLowerCase() === username) : [];
  const shippedClaims = claims.filter((claim) => claim.trackingNumber);
  const lookup = `<div class="lookup-card"><div class="lookup-icon">◎</div><h2>Find your orders</h2><p>Enter your Instagram username and password. The first time you visit, create a password for your account.</p><form id="lookup-form"><label>Instagram username<input name="username" required placeholder="@yourusername" autocomplete="username" /></label><label>Password<input name="password" type="password" minlength="6" required placeholder="6+ characters" autocomplete="current-password" /></label><label class="check-label"><input name="createAccount" type="checkbox" /> I am visiting for the first time and want to create a password</label><button class="primary-button" type="submit">View my orders <span>↗</span></button></form></div>`;
  if (!username) return shell(`<div class="container narrow">${pageHeading('YOUR PRIVATE VIEW', 'My orders', 'Look up your claims, payments and shipments with your Instagram username.')}${lookup}</div>`, 'my-orders');
  if (!claims.length) return shell(`<div class="container narrow">${pageHeading('YOUR PRIVATE VIEW', 'My orders', 'Look up your claims, payments and shipments with your Instagram username.')}<div class="lookup-card"><div class="lookup-icon">◎</div><h2>No orders found</h2><p>No claims were found for <strong>@${username}</strong>. Check the spelling and try again.</p>${lookup}<button class="secondary-button" data-action="orders-logout">Use a different username</button></div></div>`, 'my-orders');
  return shell(`<div class="container narrow">${pageHeading('YOUR PRIVATE VIEW', 'My orders', 'Look up your claims, payments and shipments with your Instagram username.')}<div class="member-profile"><div class="profile-avatar">${username.slice(0, 1).toUpperCase()}</div><div><strong>@${username}</strong><span>${claims.length} active claim${claims.length > 1 ? 's' : ''} · $0.00 credit</span></div><button class="secondary-button" data-action="orders-logout">Change username</button><button class="secondary-button" data-action="refresh">↻ Refresh</button></div><div class="order-status-card"><div class="status-card-head"><div><p class="eyebrow">ACTIVE CLAIMS</p><h2>Your order trail</h2></div><span class="status-dot-label"><i></i> Live</span></div>${claims.map((claim) => { const go = goById(claim.goId); return `<article class="claim-status"><div><span class="category ${tagClass(go.type)}">${go.type}</span><h3>${go.name}</h3><p>${Object.entries(claim.selections).map(([key, value]) => `${key} × ${value}`).join(', ')}</p></div><div class="claim-right"><span class="claim-pill ${claim.status.toLowerCase()}">${claim.status}</span><strong>${money(claim.amount)}</strong><span>Due ${date(go.paymentDeadline)}</span>${claim.trackingNumber ? `<span>${claim.carrier || 'Carrier'} · ${claim.trackingNumber}</span>` : ''}</div></article>`; }).join('')}</div><div class="action-grid"><button class="action-card" data-action="pay"><span>↗</span><strong>Pay a balance</strong><p>Submit one transfer for one or more GOs.</p></button><button class="action-card" data-action="shipping"><span>⌁</span><strong>Request shipping</strong><p>Available when your items are Ready.</p></button></div><div class="shipping-card"><div><p class="eyebrow">YOUR SHIPMENTS</p>${shippedClaims.length ? `<h2>Your shipment tracking</h2><div class="shipment-list">${shippedClaims.map((claim) => { const go = goById(claim.goId); const carrier = claim.carrier || 'Carrier'; return `<p><strong>${go?.name || 'Group order'}</strong> · <span class="claim-pill ${claim.status.toLowerCase()}">${claim.status}</span> · ${carrier} · <a href="https://www.google.com/search?q=${encodeURIComponent(`${carrier} ${claim.trackingNumber}`)}" target="_blank" rel="noopener">${claim.trackingNumber}</a></p>`; }).join('')}</div>` : '<h2>Nothing in transit yet</h2><p class="muted">Your tracking links will appear here once a package is marked shipped.</p>'}</div><span class="shipping-icon">⌁</span></div><details class="archive"><summary>Past orders (1)</summary><p>2025 Season’s Greetings · Arrived</p></details></div>`, 'my-orders');
}

function rulesView() { return shell(`<div class="container rules-page">${pageHeading('PLEASE READ BEFORE CLAIMING', 'House rules', 'A little clarity keeps every group order smooth.')}${state.rules.split('\n').map((line) => line.startsWith('# ') ? `<h2>${line.slice(2)}</h2>` : line.startsWith('**') ? `<h3>${line.replaceAll('**', '')}</h3>` : line ? `<p>${line}</p>` : '').join('')}<div class="note-banner"><span>✦</span><div><strong>Still unsure?</strong><p>Send a DM to <b>@blbabe_05</b> before submitting a claim.</p></div></div></div>`, 'rules'); }

function adminLoginView() { return shell(`<div class="container narrow admin-login-page"><div class="lookup-card"><div class="lookup-icon">⌁</div><p class="eyebrow">PRIVATE WORKSPACE</p><h2>Admin mode</h2><p>${supabaseClient ? 'Sign in with the organiser account connected to Supabase.' : 'Enter the organiser password to manage GOs, products, payments and shipping.'}</p><form id="admin-login-form">${supabaseClient ? '<label>Email<input name="email" type="email" autocomplete="username" required placeholder="you@example.com" /></label>' : ''}<label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Enter password" /></label><button class="primary-button" type="submit">Unlock admin mode <span>↗</span></button></form></div></div>`, 'admin'); }
function adminView() { const outstanding = state.claims.reduce((sum, claim) => sum + (claim.status === 'Paid' ? 0 : claim.amount), 0); const tabs = ['GOs', 'Shop', 'Store orders', 'Payments', 'Shipping']; return shell(`<div class="container admin-page"><div class="admin-heading"><div>${pageHeading('ORGANISER CONSOLE', 'Admin dashboard', 'A practical view of the work behind the fan-facing page.')}</div><div class="admin-heading-actions"><button class="primary-button" data-action="save-live">Save to live site</button><span class="admin-badge">ADMIN MODE</span></div></div><div class="admin-tabs">${tabs.map((tab) => `<button type="button" class="admin-tab ${adminTab === tab ? 'active' : ''}" data-action="admin-tab" data-tab="${tab}">${tab}</button>`).join('')}<button type="button" class="admin-tab settings-tab ${adminTab === 'Settings' ? 'active' : ''}" data-action="admin-tab" data-tab="Settings" aria-label="Open admin settings">⚙ Settings</button></div>${adminTab === 'GOs' ? adminGos() : adminTab === 'Shop' ? adminShop() : adminTab === 'Store orders' ? adminStoreOrders() : adminTab === 'Payments' ? adminPayments() : adminTab === 'Shipping' ? adminShipping() : adminTab === 'Settings' ? adminSettings() : adminGeneric(adminTab, outstanding)}</div>`, 'admin'); }
function adminSettings() { return `<div class="settings-page"><div class="admin-toolbar"><div><h2>Settings</h2><p class="muted">Manage organiser details and customer account access.</p></div></div><section class="settings-section settings-panel"><p class="eyebrow">WORKSPACE SETTINGS</p><h3>Organiser settings</h3><form data-form="settings"><label>Organiser name<input name="organiser" value="${state.settings.organiser}" /></label><label>Instagram handle<input name="instagram" value="${state.settings.instagram}" /></label><label>Secure threshold<input name="threshold" type="number" min="0.5" max="1" step="0.01" value="${state.settings.threshold}" /></label><button class="primary-button" type="submit">Save settings ↗</button></form></section>${passwordManagerSection()}</div>`; }
function adminGos() { const metrics = financeMetrics(); return `<div class="admin-toolbar"><div><h2>Group orders</h2><p class="muted">${state.orders.filter((go) => go.status === 'open').length} active · ${state.orders.filter((go) => go.status === 'closed').length} closed</p></div><button class="primary-button" data-action="new-go">+ New group order</button></div><div class="admin-go-list">${state.orders.map((go) => `<article class="admin-go-row"><div class="admin-go-mark">${go.artist.slice(0, 2).toUpperCase()}</div><div><strong>${go.name}</strong><span>${go.artist} · ${go.items.length} items · ${go.setsOnHand || 0} sets on hand${securedSetsForGo(go) ? ` · ${securedSetsForGo(go)} secured` : ''} · closes ${date(go.deadline)}</span></div><span class="open-pill ${go.status === 'closed' ? 'closed' : ''}">● ${go.status}</span><button class="secondary-button" data-action="manage-go" data-go="${go.id}">Manage ↗</button></article>`).join('')}</div><div class="enhancement-grid"><article><span>↗</span><strong>Profit / cost tracker</strong><b>${money(metrics.margin)}</b><p>${money(metrics.projectedValue)} projected order value</p><button data-action="profit">Open tracker</button></article><article><span>▣</span><strong>Exports</strong><b>${metrics.exportCount} ready</b><p>Vendor sheet · roster · CSV</p><button data-action="export">Export this GO</button></article></div></div>`; }
function owedRows() { return state.claims.map((claim, index) => { const go = goById(claim.goId); const payment = state.payments.find((entry) => entry.username === claim.username && (!go || entry.go === go.name)); const paid = claim.status === 'Paid' || claim.status === 'Supplied' || payment?.status === 'Paid' || payment?.status === 'Supplied'; return { index, username: claim.username, go: go?.name || 'Unknown GO', amount: claim.amount, status: paid ? 'Paid' : 'Unpaid' }; }); }
function restoreClaimStock(claim) {
  const go = goById(claim.goId);
  Object.entries(claim.selections || {}).forEach(([key, quantity]) => {
    const item = go?.items.find((candidate) => key.startsWith(`${candidate.id}-`));
    if (!item) return;
    const option = key.slice(`${item.id}-`.length);
    if (item.kind === 'set') item.claims[option] = Math.max(0, (item.claims[option] || 0) - quantity);
    if (item.kind === 'merch' || item.kind === 'batch') item.claimed = Math.max(0, (item.claimed || 0) - quantity);
  });
}
function financeMetrics() { const rows = owedRows(); const projectedValue = state.orders.reduce((sum, go) => sum + go.items.reduce((itemSum, item) => { const claimed = item.kind === 'set' ? Object.values(item.claims || {}).reduce((total, count) => total + count, 0) : item.claimed || 0; return itemSum + item.price * claimed; }, 0), 0); const outstanding = rows.filter((row) => row.status === 'Unpaid').reduce((sum, row) => sum + row.amount, 0); const paid = rows.filter((row) => row.status === 'Paid').reduce((sum, row) => sum + row.amount, 0); const loggedCosts = state.storeOrders.reduce((sum, order) => sum + order.amountOwed, 0); return { outstanding, paid, projectedValue, loggedCosts, margin: projectedValue - loggedCosts, unpaidClaims: rows.filter((row) => row.status === 'Unpaid').length, exportCount: state.orders.length * 3 }; }
function owedSpreadsheet() { const rows = owedRows().filter((row) => row.status === 'Unpaid'); const total = rows.reduce((sum, row) => sum + row.amount, 0); return `<section class="owed-sheet"><div class="sheet-heading"><div><p class="eyebrow">COLLECTION SPREADSHEET</p><h2>Who owes me</h2><p class="muted">${rows.length} unpaid claim${rows.length === 1 ? '' : 's'} · ${money(total)} outstanding</p></div><div class="sheet-actions"><button class="secondary-button" data-action="export-roster">Payment roster CSV</button><button class="secondary-button" data-action="export-vendor">Vendor sheet CSV</button><button class="primary-button" data-action="export-all">Export everything</button></div></div><div class="table-card"><table><thead><tr><th>Joiner</th><th>Group order</th><th>Amount owed</th><th>Status</th><th></th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td><button class="table-action admin-username" data-action="view-customer" data-username="${row.username}">@${row.username}</button></td><td>${row.go}</td><td><strong>${money(row.amount)}</strong></td><td><span class="claim-pill">${row.status}</span></td><td><button class="table-action" data-action="edit-claim" data-claim="${row.index}">Adjust amount</button> <button class="reject-action" data-action="delete-claim" data-claim="${row.index}">Delete claim</button></td></tr>`).join('') : '<tr><td colspan="5" class="muted">Everyone is paid. No outstanding claims.</td></tr>'}</tbody></table></div></section>`; }
function adminShop() { return `<div class="admin-toolbar"><div><h2>Shop products</h2><p class="muted">${state.shop.length} listings · ${state.shop.reduce((sum, item) => sum + item.stock, 0)} units in stock</p></div><button class="primary-button" data-action="new-product">+ Add product</button></div><div class="table-card"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Public status</th><th></th></tr></thead><tbody>${state.shop.map((item) => `<tr><td><strong>${item.name}</strong><br><span class="muted">${item.description}</span></td><td><span class="category ${tagClass(item.category)}">${item.category}</span></td><td>${money(item.price)}</td><td>${item.stock}</td><td><span class="open-pill ${item.stock ? '' : 'closed'}">● ${item.stock ? 'Live' : 'Sold out'}</span></td><td><button class="table-action" data-action="edit-product" data-product="${item.id}">Edit</button><button class="reject-action" data-action="delete-product" data-product="${item.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`; }
function adminStoreOrders() { const owing = state.storeOrders.filter((order) => order.status !== 'Paid').reduce((sum, order) => sum + order.amountOwed, 0); return `<div class="admin-toolbar"><div><h2>Store orders</h2><p class="muted">Track vendor purchases and what each joiner owes.</p></div><span class="queue-count">${money(owing)} outstanding</span></div><div class="store-order-form"><div><p class="eyebrow">ADD STORE ORDER</p><h2>Log a purchase</h2></div><form data-form="store-order"><div class="form-row"><label>Instagram username<input name="username" required placeholder="@username" /></label><label>Vendor<input name="vendor" required placeholder="JYP Shop" /></label></div><div class="form-row"><label>Order details<input name="description" required placeholder="Item · member/version" /></label><label>Amount owed<input name="amountOwed" type="number" min="0" step="0.01" required placeholder="42.00" /></label></div><label>Status<select name="status"><option>Awaiting payment</option><option>Paid</option></select></label><button class="primary-button" type="submit">Add store order ↗</button></form></div><div class="table-card"><table><thead><tr><th>Joiner</th><th>Vendor</th><th>Order</th><th>Amount owed</th><th>Status</th><th></th></tr></thead><tbody>${state.storeOrders.length ? state.storeOrders.map((order) => `<tr><td><button class="table-action admin-username" data-action="view-customer" data-username="${order.username}">@${order.username}</button></td><td>${order.vendor}</td><td>${order.description}</td><td><strong>${money(order.amountOwed)}</strong></td><td><span class="claim-pill ${order.status === 'Paid' ? 'paid' : ''}">${order.status}</span></td><td><button class="reject-action" data-action="delete-store-order" data-order="${order.id}">Delete</button></td></tr>`).join('') : '<tr><td colspan="6" class="muted">No store orders logged yet.</td></tr>'}</tbody></table></div>`; }
function claimsByUsername() {
  const groups = new Map();
  state.claims.forEach((claim, index) => {
    const key = claim.username.toLowerCase();
    if (!groups.has(key)) groups.set(key, { username: claim.username, claims: [], total: 0, unpaid: 0 });
    const group = groups.get(key);
    group.claims.push({ claim, index });
    if (claim.status !== 'Paid' && claim.status !== 'Supplied') {
      group.total += claim.amount;
      group.unpaid += 1;
    }
  });
  return [...groups.values()];
}
function packingSlipForClaims(username, claims) {
  const lines = [`GO MANAGER PACKING SLIP`, `Joiner: @${username}`, ''];
  claims.forEach(({ claim }) => {
    const go = goById(claim.goId);
    lines.push(`${go?.name || 'Unknown group order'}:`);
    Object.entries(claim.selections || {}).forEach(([selection, quantity]) => lines.push(`- ${selection} x ${quantity}`));
    lines.push('');
  });
  return lines.join('\n');
}
function adminCustomerOrders(username) {
  const claims = state.claims.map((claim, index) => ({ claim, index })).filter(({ claim }) => claim.username.toLowerCase() === username.toLowerCase());
  const storeOrders = state.storeOrders.filter((order) => order.username.toLowerCase() === username.toLowerCase());
  const payments = state.payments.filter((payment) => payment.username.toLowerCase() === username.toLowerCase());
  openModal(`@${username}'s orders`, `<p class="eyebrow">CUSTOMER ORDER HISTORY</p><h2>@${username}</h2><p class="modal-copy">${claims.length} GO claim${claims.length === 1 ? '' : 's'} · ${storeOrders.length} store order${storeOrders.length === 1 ? '' : 's'}</p><div class="customer-order-list">${claims.length ? claims.map(({ claim, index }) => { const go = goById(claim.goId); return `<article class="customer-order"><div><strong>${go?.name || 'Unknown group order'}</strong><span>${Object.entries(claim.selections || {}).map(([selection, quantity]) => `${selection} × ${quantity}`).join(', ')}</span></div><div><b>${money(claim.amount)}</b><span class="claim-pill ${claim.status.toLowerCase()}">${claim.status}</span></div><button class="table-action" data-action="mark-claim-paid" data-claim="${index}">Mark paid</button></article>`; }).join('') : '<p class="muted">No GO claims found.</p>'}${storeOrders.map((order) => `<article class="customer-order"><div><strong>${order.vendor}</strong><span>${order.description}</span></div><div><b>${money(order.amountOwed)}</b><span class="claim-pill ${order.status === 'Paid' ? 'paid' : ''}">${order.status}</span></div></article>`).join('')}</div>${payments.length ? `<div class="customer-payments"><p class="eyebrow">PAYMENT HISTORY</p>${payments.map((payment) => `<p><strong>${money(payment.amount)}</strong> · ${payment.method} · ${payment.reference} · ${payment.status}</p>`).join('')}</div>` : ''}`);
}
function openGoPaymentGroups() {
  return state.orders
    .filter((go) => go.status === 'open')
    .map((go) => {
      const claims = state.claims
        .map((claim, index) => ({ claim, index }))
        .filter(({ claim }) => claim.goId === go.id && !['Paid', 'Supplied'].includes(claim.status));
      return {
        go,
        claims,
        total: claims.reduce((sum, { claim }) => sum + Number(claim.amount || 0), 0)
      };
    });
}
function adminPayments() {
  const goGroups = openGoPaymentGroups();
  const outstanding = goGroups.reduce((sum, group) => sum + group.claims.length, 0);
  const firstUnpaidIndex = goGroups.findIndex((group) => group.claims.length);
  const search = '<label class="admin-search"><span>Search</span><input type="search" data-admin-search="payments" placeholder="Username, GO or reference" autocomplete="off" /></label>';
  const goSections = goGroups.map(({ go, claims, total }, index) => `<details class="payment-go-group" ${claims.length && index === firstUnpaidIndex ? 'open' : ''}><summary><span><strong>${go.name}</strong><small>${claims.length} unpaid claim${claims.length === 1 ? '' : 's'}</small></span><b>${money(total)}</b></summary><div class="table-card"><table><thead><tr><th>Joiner</th><th>Amount owed</th><th>Status</th><th></th></tr></thead><tbody>${claims.length ? claims.map(({ claim, index: claimIndex }) => `<tr data-admin-search-row="payments" data-search-text="${claim.username} ${go.name}"><td><button class="table-action admin-username" data-action="view-customer" data-username="${claim.username}">@${claim.username}</button></td><td><strong>${money(claim.amount)}</strong></td><td><span class="claim-pill">${claim.status}</span></td><td><button class="table-action" data-action="edit-claim" data-claim="${claimIndex}">Adjust amount</button> <button class="table-action" data-action="mark-claim-paid" data-claim="${claimIndex}">Mark paid</button> <button class="table-action" data-action="packing-claim" data-claim="${claimIndex}">Packing slip</button></td></tr>`).join('') : '<tr><td colspan="4" class="muted">Everyone is paid for this GO.</td></tr>'}</tbody></table></div></details>`).join('');
  const paymentRows = dedupePayments(state.payments);
  return `<div class="admin-toolbar"><div><h2>Payments</h2><p class="muted">Open group orders are separated below so you can work through each GO.</p></div>${search}<button class="primary-button" data-action="manual-payment">+ Add payment</button><span class="queue-count">${outstanding} outstanding</span></div><section class="payment-claims"><div class="sheet-heading"><div><p class="eyebrow">WHO OWES ME</p><h2>Open group orders</h2><p class="muted">Expand a GO to see its unpaid joiners.</p></div></div><div class="payment-go-list">${goSections || '<div class="table-card"><p class="muted">No open group orders.</p></div>'}</div></section><section class="payment-history"><div class="sheet-heading"><div><p class="eyebrow">RECEIVED PAYMENTS</p><h2>Payment history</h2><p class="muted">Each payment is listed once.</p></div></div><div class="table-card"><table><thead><tr><th>Joiner</th><th>Amount</th><th>Method / ref</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>${paymentRows.map((payment) => `<tr data-admin-search-row="payments" data-search-text="${payment.username} ${payment.go} ${payment.method} ${payment.reference} ${payment.status}"><td><button class="table-action admin-username" data-action="view-customer" data-username="${payment.username}">@${payment.username}</button></td><td>${money(payment.amount)}</td><td>${payment.method}<br><span class="muted">${payment.reference}</span></td><td><span class="claim-pill ${payment.status.toLowerCase()}">${payment.status}</span></td><td>${payment.submitted}</td><td><button class="reject-action" data-action="delete-payment" data-payment="${payment.id}">Delete</button></td></tr>`).join('')}</tbody></table></div></section>`;
}
function adminShipping() { const shippingClaims = state.claims.map((claim, index) => ({ claim, index })).filter(({ claim }) => ['Paid', 'Ready', 'Shipped'].includes(claim.status)); const search = '<label class="admin-search"><span>Search</span><input type="search" data-admin-search="shipping" placeholder="Username, GO or tracking" autocomplete="off" /></label>'; return `<div class="admin-toolbar"><div><h2>Shipping queue</h2><p class="muted">Paid claims remain here until marked delivered.</p></div>${search}<button class="secondary-button" data-action="packing">Generate packing list</button></div><div class="table-card"><table><thead><tr><th>Joiner</th><th>Group order</th><th>Amount</th><th>Tracking</th><th>Status</th><th></th></tr></thead><tbody>${shippingClaims.length ? shippingClaims.map(({ claim, index }) => { const go = goById(claim.goId); return `<tr data-admin-search-row="shipping" data-search-text="${claim.username} ${go?.name || ''} ${claim.trackingNumber || ''} ${claim.status}"><td><strong>@${claim.username}</strong></td><td>${go?.name || 'Unknown GO'}</td><td>${money(claim.amount)}</td><td>${claim.trackingNumber ? `${claim.carrier || 'Carrier'} · ${claim.trackingNumber}` : '<span class="muted">Not added</span>'}</td><td><span class="claim-pill ${claim.status.toLowerCase()}">${claim.status}</span></td><td><button class="table-action" data-action="packing-claim" data-claim="${index}">Packing slip</button>${claim.trackingNumber ? `<button class="table-action" data-action="delivered" data-claim="${index}">Mark delivered</button>` : ''}<button class="table-action" data-action="tracking" data-claim="${index}">${claim.trackingNumber ? 'Edit tracking' : 'Add tracking'}</button></td></tr>`; }).join('') : '<tr><td colspan="6" class="muted">No claims are waiting for shipping.</td></tr>'}</tbody></table></div>`; }
function adminGeneric(tab, outstanding) { return `<div class="generic-admin"><h2>${tab}</h2><p class="muted">This workspace is ready for live Supabase data.</p><div class="stats-row"><div><span>Total outstanding</span><strong>${money(outstanding)}</strong></div><div><span>Store orders</span><strong>04</strong></div><div><span>Blocked users</span><strong>01</strong></div></div><button class="primary-button" data-action="settings">Open settings</button></div>`; }
function openPasswordManager() {
  const accounts = Object.keys(state.userAccounts).sort();
  openModal('Customer password manager', `<p class="eyebrow">CUSTOMER ACCESS</p><h2>Manage passwords</h2><p class="modal-copy">Passwords are stored as salted hashes. Reset access if a customer forgets their password.</p><div class="table-card"><table><thead><tr><th>Username</th><th>Created</th><th></th></tr></thead><tbody>${accounts.length ? accounts.map((username) => `<tr><td><strong>@${username}</strong></td><td>${new Date(state.userAccounts[username].createdAt).toLocaleDateString('en-NZ')}</td><td><button class="table-action" data-action="reset-password" data-username="${username}">Reset</button> <button class="reject-action" data-action="remove-password" data-username="${username}">Remove</button></td></tr>`).join('') : '<tr><td colspan="3" class="muted">No customer passwords created yet.</td></tr>'}</tbody></table></div>`);
}
function passwordManagerSection() {
  const accounts = Object.keys(state.userAccounts).sort();
  return `<section class="settings-section"><div class="settings-section-heading"><div><p class="eyebrow">CUSTOMER ACCESS</p><h3>Password manager</h3><p class="muted">${accounts.length} customer account${accounts.length === 1 ? '' : 's'} created. Reset a password if needed.</p></div><button class="secondary-button" data-action="password-manager">Open full manager</button></div>${accounts.length ? `<div class="table-card"><table><thead><tr><th>Username</th><th>Created</th><th></th></tr></thead><tbody>${accounts.map((username) => `<tr><td><strong>@${username}</strong></td><td>${new Date(state.userAccounts[username].createdAt).toLocaleDateString('en-NZ')}</td><td><button class="table-action" data-action="reset-password" data-username="${username}">Change password</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted settings-empty">No customer accounts have been created yet.</p>'}</section>`;
}
function notFound() { return shell(`<div class="container empty-state"><span>404</span><h1>That GO wandered off.</h1><a class="primary-button" href="#orders">Back to orders</a></div>`); }

function render() { const current = route(); if (current === 'orders') app.innerHTML = ordersView(); else if (current === 'shop') app.innerHTML = shopView(); else if (current === 'my-orders') app.innerHTML = myOrdersView(); else if (current === 'rules') app.innerHTML = rulesView(); else if (current === 'admin') app.innerHTML = isAdminUnlocked() ? adminView() : adminLoginView(); else if (current.startsWith('go/')) app.innerHTML = detailView(current.split('/')[1]); else app.innerHTML = notFound(); }

function claimStore() { return JSON.parse(sessionStorage.getItem('go-claim') || '{}'); }
function adjustClaim(itemId, option, delta) { const store = claimStore(); const go = goById(route().split('/')[1]); const item = go?.items.find((candidate) => candidate.id === itemId); const maximum = item?.kind === 'set' ? availableOptionStock(item, option) : item?.kind === 'merch' ? Math.max(0, (item.stock || 0) - (item.claimed || 0)) : 10; const key = `${itemId}-${option}`; store[key] = Math.max(0, Math.min(maximum, (store[key] || 0) + delta)); sessionStorage.setItem('go-claim', JSON.stringify(store)); const count = document.querySelector(`[data-count="${CSS.escape(key)}"]`); if (count) count.textContent = store[key]; updateSummary(); }
function updateSummary() { const summary = document.querySelector('#claim-summary'); if (!summary) return; const values = Object.entries(claimStore()).filter(([, value]) => value > 0); const go = goById(route().split('/')[1]); let total = 0; summary.innerHTML = values.length ? values.map(([key, value]) => { const item = go.items.find((candidate) => key.startsWith(`${candidate.id}-`)); total += item.price * value; return `<div class="summary-line"><span>${key.split('-').slice(1).join('-')} × ${value}</span><b>${money(item.price * value)}</b></div>`; }).join('') + `<div class="summary-total"><span>Total</span><b>${money(total)}</b></div>` : '<p class="muted">Your selected items will appear here.</p>'; }

document.addEventListener('click', async (event) => { const button = event.target.closest('[data-action]'); if (!button) return; const action = button.dataset.action;
  if (action === 'close-modal') { closeModal(); return; }
  if (action === 'menu') { document.querySelector('.main-nav')?.classList.toggle('menu-open'); return; }
  if (action === 'artist') { activeArtist = button.dataset.artist; render(); }
  if (action === 'toggle-item') { expandedItems.has(button.dataset.item) ? expandedItems.delete(button.dataset.item) : expandedItems.add(button.dataset.item); render(); updateSummary(); }
  if (action === 'adjust-claim') adjustClaim(button.dataset.item, button.dataset.option, Number(button.dataset.delta));
  if (action === 'ot-claim') { const go = goById(route().split('/')[1]); const item = go.items.find((candidate) => candidate.id === button.dataset.item); if (availableSets(item) > 0) item.options.forEach((option) => adjustClaim(item.id, option, 1)); }
  if (action === 'shop-add') { const listing = state.shop.find((item) => item.id === button.dataset.shop); const items = basket(); const existing = items.find((item) => item.id === listing.id); if (existing) existing.quantity = Math.min(listing.stock, existing.quantity + 1); else items.push({ id: listing.id, name: listing.name, price: listing.price, quantity: 1 }); saveBasket(items); render(); notify(`${listing.name} added to your basket.`); }
  if (action === 'checkout-shop') openModal('Shop checkout', `<p class="eyebrow">BASKET READY</p><h2>Complete your shop order</h2><p class="modal-copy">Your items can be combined with a GO shipment later.</p><form data-form="shop-checkout"><label>Instagram username<input name="username" required placeholder="@yourusername" /></label><label>Notes for organiser<textarea name="notes" rows="3" placeholder="Optional"></textarea></label><button class="primary-button" type="submit">Place shop order ↗</button></form>`);
  if (action === 'refresh') { state = JSON.parse(localStorage.getItem(STORE_KEY) || JSON.stringify(DEMO)); render(); notify('Your order view is up to date.'); }
  if (action === 'orders-logout') { sessionStorage.removeItem('go-manager-username'); render(); }
  if (action === 'password-manager') openPasswordManager();
  if (action === 'reset-password') openModal('Reset customer password', `<p class="eyebrow">PASSWORD MANAGER</p><h2>Reset @${button.dataset.username}</h2><form data-form="reset-password" data-username="${button.dataset.username}"><label>New password<input name="password" type="password" minlength="6" required placeholder="6+ characters" /></label><button class="primary-button" type="submit">Save new password ↗</button></form>`);
  if (action === 'remove-password') { const username = button.dataset.username.toLowerCase(); if (window.confirm(`Remove the password for @${button.dataset.username}? They will need to create a new password next time.`)) { if (supabaseClient) { const result = await supabaseClient.from('user_accounts').delete().eq('username', username); if (result.error) { notify(`Password removal failed: ${result.error.message}`); return; } } delete state.userAccounts[username]; save(); openPasswordManager(); notify('Customer password removed.'); } }
  if (action === 'pay') openModal('Pay a balance', `<p class="eyebrow">PAYMENT PROOF</p><h2>Submit a payment</h2><p class="modal-copy">One transfer ID can cover several GOs.</p><form data-form="payment"><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required placeholder="42.00" /></label><label>Payment method<select name="method"><option>Bank transfer</option><option>PayPal</option></select></label><label>Transaction ID<input name="reference" required placeholder="Your bank reference" /></label><label>Screenshot<input name="screenshot" type="file" accept="image/*" /></label><button class="primary-button" type="submit">Submit proof ↗</button></form>`);
  if (action === 'shipping') openModal('Request shipping', `<p class="eyebrow">SHIPMENT REQUEST</p><h2>Where should it go?</h2><p class="modal-copy">Demo claims are not Ready yet, but you can preview the request form.</p><form data-form="shipping"><div class="form-row"><label>Name<input name="name" required /></label><label>Postal code<input name="postcode" required /></label></div><label>Address<input name="address" required /></label><div class="form-row"><label>City<input name="city" required /></label><label>Method<select name="method"><option>Stamped · $4.50</option><option>Tracked · $8.50</option></select></label></div><label><input name="combine" type="checkbox" checked /> Combine GO claims and shop orders</label><button class="primary-button" type="submit">Request shipping ↗</button></form>`);
  if (action === 'view-customer') { adminCustomerOrders(button.dataset.username); return; }
  if (action === 'admin-tab') { adminTab = button.dataset.tab; render(); return; }
  if (action === 'save-live') { saveToLiveSite(); return; }
  if (action === 'confirm-payment') { const payment = state.payments.find((entry) => entry.id === Number(button.dataset.payment)); payment.status = 'Confirmed'; save(); notify(`Payment from @${payment.username} confirmed.`); render(); }
  if (action === 'reject-payment') { const payment = state.payments.find((entry) => entry.id === Number(button.dataset.payment)); payment.status = 'Rejected'; save(); notify('Payment proof rejected.'); render(); }
  if (action === 'delete-payment') {
    const paymentId = Number(button.dataset.payment);
    const payment = state.payments.find((entry) => entry.id === paymentId);
    if (payment && window.confirm(`Delete the payment from @${payment.username}?`)) {
      state.payments = state.payments.filter((entry) => entry.id !== paymentId);
      save();
      render();
      notify('Payment deleted.');
    }
  }
  if (action === 'mark-paid') { const payment = state.payments.find((entry) => entry.id === Number(button.dataset.payment)); const go = state.orders.find((entry) => entry.name === payment.go); payment.status = 'Paid'; const linkedClaims = state.claims.filter((claim) => claim.username === payment.username && (!go || claim.goId === go.id)); linkedClaims.forEach((claim) => { claim.status = 'Paid'; }); save(); render(); notify(`${linkedClaims.length ? linkedClaims.length : 'No'} claim${linkedClaims.length === 1 ? '' : 's'} for @${payment.username} marked paid.`); }
  if (action === 'mark-claim-paid') { const claim = state.claims[Number(button.dataset.claim)]; if (claim) { claim.status = 'Paid'; save(); render(); notify(`@${claim.username} marked paid.`); } }
  if (action === 'mark-user-paid') { const username = button.dataset.username.toLowerCase(); state.claims.filter((claim) => claim.username.toLowerCase() === username && claim.status !== 'Supplied').forEach((claim) => { claim.status = 'Paid'; }); save(); render(); notify(`@${button.dataset.username} claims marked paid.`); }
  if (action === 'packing-user') { const group = claimsByUsername().find((entry) => entry.username.toLowerCase() === button.dataset.username.toLowerCase()); if (group) downloadFile(`packing-slip-${group.username}.txt`, packingSlipForClaims(group.username, group.claims)); }
  if (action === 'packing-claim') { const claim = state.claims[Number(button.dataset.claim)]; if (claim) { downloadFile(`packing-slip-${claim.username}-${claim.goId}.txt`, packingSlipForClaims(claim.username, [{ claim }])); notify(`Packing slip downloaded for @${claim.username}.`); } }
  if (action === 'manual-payment') openModal('Add payment', `<p class="eyebrow">ADMIN PAYMENT</p><h2>Record a payment</h2><p class="modal-copy">Add an offline payment and optionally mark all matching claims paid.</p><form data-form="manual-payment"><label>Instagram username<input name="username" required placeholder="@username" /></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label><label>Payment method<select name="method"><option>Bank transfer</option><option>PayPal</option><option>Cash</option><option>Other</option></select></label><label>Reference<input name="reference" required placeholder="Receipt or transaction reference" /></label><label><input name="markPaid" type="checkbox" checked /> Mark this username’s unpaid claims as paid</label><button class="primary-button" type="submit">Add payment ↗</button></form>`);
  if (action === 'delete-claim') { const index = Number(button.dataset.claim); const claim = state.claims[index]; if (claim && window.confirm(`Delete @${claim.username}'s claim? This will return the reserved stock.`)) { restoreClaimStock(claim); if (claim.cloudClaimId && supabaseClient) { const result = await supabaseClient.from('claim_events').delete().eq('id', claim.cloudClaimId); if (result.error) { notify(`Claim delete failed: ${result.error.message}`); return; } } state.claims.splice(index, 1); save(); render(); notify('Claim deleted and stock restored.'); } }
  if (action === 'mark-supplied') { const payment = state.payments.find((entry) => entry.id === Number(button.dataset.payment)); const go = state.orders.find((entry) => entry.name === payment.go); payment.status = 'Supplied'; state.claims.filter((claim) => claim.username === payment.username && (!go || claim.goId === go.id)).forEach((claim) => { claim.status = 'Supplied'; }); save(); render(); notify(`${payment.go} marked supplied.`); }
  if (action === 'new-product') openModal('New product', `<p class="eyebrow">SHOP LISTING</p><h2>Add a product</h2><form data-form="product"><label>Product name<input name="name" required placeholder="e.g. Felix lucky draw" /></label><div class="form-row"><label>Category<select name="category"><option>Album</option><option>Photocard</option><option>Merch</option><option>Accessories</option></select></label><label>Price<input name="price" type="number" min="0" step="0.01" required placeholder="14.00" /></label></div><label>Stock<input name="stock" type="number" min="0" step="1" required value="1" /></label><label>Description<textarea name="description" rows="3" placeholder="What is included?"></textarea></label><label class="photo-field">Product photo<input class="photo-input" name="image" type="file" accept="image/*" /><span class="photo-preview">Choose an image to preview it here.</span></label><button class="primary-button" type="submit">Add product ↗</button></form>`);
  if (action === 'edit-product') { const product = state.shop.find((item) => item.id === button.dataset.product); openModal('Edit product', `<p class="eyebrow">SHOP LISTING</p><h2>Edit product</h2><form data-form="product" data-product="${product.id}"><label>Product name<input name="name" required value="${product.name}" /></label><div class="form-row"><label>Category<select name="category"><option ${product.category === 'Album' ? 'selected' : ''}>Album</option><option ${product.category === 'Photocard' ? 'selected' : ''}>Photocard</option><option ${product.category === 'Merch' ? 'selected' : ''}>Merch</option><option ${product.category === 'Accessories' ? 'selected' : ''}>Accessories</select></label><label>Price<input name="price" type="number" min="0" step="0.01" required value="${product.price}" /></label></div><label>Stock<input name="stock" type="number" min="0" step="1" required value="${product.stock}" /></label><label>Description<textarea name="description" rows="3">${product.description}</textarea></label><label class="photo-field">Product photo<input class="photo-input" name="image" type="file" accept="image/*" /><span class="photo-preview">${product.image ? `<img src="${product.image}" alt="Current product photo" />` : 'Choose a new image or keep the current one.'}</span></label><button class="primary-button" type="submit">Save changes ↗</button></form>`); }
  if (action === 'delete-product') { const product = state.shop.find((item) => item.id === button.dataset.product); if (window.confirm(`Delete ${product.name}?`)) { state.shop = state.shop.filter((item) => item.id !== product.id); save(); render(); notify(`${product.name} deleted.`); } }
  if (action === 'delete-store-order') { const order = state.storeOrders.find((item) => item.id === Number(button.dataset.order)); if (window.confirm(`Delete the store order for @${order.username}?`)) { state.storeOrders = state.storeOrders.filter((item) => item.id !== order.id); save(); render(); notify('Store order deleted.'); } }
  if (action === 'edit-claim') { const claim = state.claims[Number(button.dataset.claim)]; if (claim) openModal('Adjust amount owed', `<p class="eyebrow">CLAIM ADJUSTMENT</p><h2>@${claim.username}</h2><p class="modal-copy">${goById(claim.goId)?.name || 'Unknown group order'}</p><form data-form="edit-claim" data-claim="${button.dataset.claim}"><label>Amount owed<input name="amount" type="number" min="0" step="0.01" required value="${Number(claim.amount).toFixed(2)}" /></label><p class="form-help">Use this to add fees, discounts, credits, or correct the calculated amount.</p><button class="primary-button" type="submit">Save amount ↗</button></form>`); }
  if (action === 'new-go') openModal('New group order', `<p class="eyebrow">GO BUILDER</p><h2>Create a group order</h2><form data-form="new-go"><label>GO name<input name="name" required placeholder="e.g. HOP album set" /></label><div class="form-row"><label>Artist<input name="artist" required placeholder="Stray Kids" /></label><label>Type<select name="type"><option>Photocard</option><option>Album</option><option>Merch</option></select></label></div><div class="form-row"><label>Closes<input name="deadline" type="date" required /></label><label>Payment due<input name="paymentDeadline" type="date" required /></label></div><label>Sets on hand<input name="setsOnHand" type="number" min="0" step="1" value="0" required /><small class="form-help">The number of complete photocard sets available for this GO.</small></label><label>Description<textarea name="description" rows="3"></textarea></label><label class="photo-field">GO cover photo<input class="photo-input" name="image" type="file" accept="image/*" /><span class="photo-preview">Choose an image to preview it here.</span></label><button class="primary-button" type="submit">Create GO ↗</button></form>`);
  if (action === 'manage-go') { const go = goById(button.dataset.go); openModal('Manage group order', `<p class="eyebrow">${go.artist.toUpperCase()}</p><h2>${go.name}</h2><p class="modal-copy">${go.items.length} dropdown${go.items.length === 1 ? '' : 's'} · ${go.status} · closes ${date(go.deadline)}</p><div class="managed-items"><h3>Dropdowns in this GO</h3>${go.items.map((item, index) => `<div class="managed-item">${item.image ? `<img src="${item.image}" alt="" />` : '<span class="managed-item-placeholder">▣</span>'}<span><strong>${item.name}</strong><small>${item.kind === 'set' ? `${item.setCount ?? item.totalSlots} sets · ` : ''}${item.kind} · ${money(item.price)}</small></span><button class="table-action" data-action="move-item" data-go="${go.id}" data-index="${index}" data-direction="-1" ${index === 0 ? 'disabled' : ''} aria-label="Move ${item.name} up">↑</button><button class="table-action" data-action="move-item" data-go="${go.id}" data-index="${index}" data-direction="1" ${index === go.items.length - 1 ? 'disabled' : ''} aria-label="Move ${item.name} down">↓</button><button class="table-action" data-action="edit-item" data-go="${go.id}" data-item="${item.id}">Edit</button><button class="reject-action" data-action="delete-item" data-go="${go.id}" data-item="${item.id}">Delete</button></div>`).join('')}</div><div class="modal-actions"><button class="primary-button" data-action="new-item" data-go="${go.id}">+ Add dropdown</button><button class="secondary-button" data-action="edit-go" data-go="${go.id}">Edit details</button><button class="secondary-button" data-action="duplicate-go" data-go="${go.id}">Duplicate</button><button class="primary-button" data-action="toggle-go" data-go="${go.id}">${go.status === 'open' ? 'Close GO' : 'Reopen GO'}</button><button class="danger-button" data-action="delete-go" data-go="${go.id}">Delete GO</button></div>`); }
  if (action === 'delete-item') { const go = goById(button.dataset.go); const item = go.items.find((candidate) => candidate.id === button.dataset.item); if (item && window.confirm(`Delete ${item.name}? Existing claims for this dropdown will also be removed.`)) { go.items = go.items.filter((candidate) => candidate.id !== item.id); go.items.forEach((candidate, index) => { candidate.sortOrder = index; }); state.claims = state.claims.filter((claim) => claim.itemId !== item.id); save(); closeModal(); render(); notify(`${item.name} deleted.`); } }
  if (action === 'edit-item') { const go = goById(button.dataset.go); const item = go.items.find((candidate) => candidate.id === button.dataset.item); if (item) openModal('Edit dropdown', `<p class="eyebrow">${go.name.toUpperCase()}</p><h2>Edit dropdown</h2><form data-form="edit-item" data-go="${go.id}" data-item="${item.id}"><label>Dropdown name<input name="name" required value="${item.name}" /></label><div class="form-row"><label>Type<select name="kind"><option value="set" ${item.kind === 'set' ? 'selected' : ''}>Set</option><option value="batch" ${item.kind === 'batch' ? 'selected' : ''}>Batch</option><option value="merch" ${item.kind === 'merch' ? 'selected' : ''}>Quantity</option></select></label><label>Price<input name="price" type="number" min="0" step="0.01" required value="${item.price}" /></label></div><div class="form-row"><label>Slots / stock<input name="stock" type="number" min="1" step="1" value="${item.setCount ?? item.batchSize ?? item.stock ?? 1}" required /></label><label>Options<input name="options" value="${(item.options || []).join(', ')}" placeholder="Bang Chan, Lee Know, Felix" /></label></div><label>Description<textarea name="description" rows="2">${item.description || ''}</textarea></label><label class="photo-field">Dropdown picture<input class="photo-input" name="image" type="file" accept="image/*" /><span class="photo-preview">${item.image ? `<img src="${item.image}" alt="Current dropdown picture" />` : 'Choose a new image or keep the current one.'}</span></label><button class="primary-button" type="submit">Save dropdown ↗</button></form>`); }
  if (action === 'new-item') { const go = goById(button.dataset.go); openModal('Add dropdown', `<p class="eyebrow">${go.name.toUpperCase()}</p><h2>Add a dropdown</h2><p class="modal-copy">Each dropdown appears as a separate expandable item under this group order.</p><form data-form="new-item" data-go="${go.id}"><label>Dropdown name<input name="name" required placeholder="e.g. Member version" /></label><div class="form-row"><label>Type<select name="kind"><option value="set">Set</option><option value="batch">Batch</option><option value="merch">Quantity</option></select></label><label>Price<input name="price" type="number" min="0" step="0.01" required placeholder="31.50" /></label></div><div class="form-row"><label>Slots / stock<input name="stock" type="number" min="1" step="1" value="1" required /></label><label>Options<input name="options" placeholder="Bang Chan, Lee Know, Felix" /></label></div><label>Description<textarea name="description" rows="2" placeholder="Optional details"></textarea></label><label class="photo-field">Dropdown picture<input class="photo-input" name="image" type="file" accept="image/*" /><span class="photo-preview">Choose an image to show on this dropdown.</span></label><button class="primary-button" type="submit">Add dropdown ↗</button></form>`); }
  if (action === 'move-item') { const go = goById(button.dataset.go); const index = Number(button.dataset.index); const next = index + Number(button.dataset.direction); if (next >= 0 && next < go.items.length) { [go.items[index], go.items[next]] = [go.items[next], go.items[index]]; go.items.forEach((item, itemIndex) => { item.sortOrder = itemIndex; }); save(); openModal('Manage group order', `<p class="eyebrow">${go.artist.toUpperCase()}</p><h2>${go.name}</h2><p class="modal-copy">Dropdown order updated. Use the arrows to arrange this GO.</p><div class="modal-actions"><button class="primary-button" data-action="manage-go" data-go="${go.id}">Manage dropdowns ↗</button></div>`); notify('Dropdown order updated.'); } }
  if (action === 'edit-go') { const go = goById(button.dataset.go); openModal('Edit group order', `<p class="eyebrow">GO DETAILS</p><h2>Edit group order</h2><form data-form="edit-go" data-go="${go.id}"><label>GO name<input name="name" required value="${go.name}" /></label><div class="form-row"><label>Artist<input name="artist" required value="${go.artist}" /></label><label>Type<select name="type"><option ${go.type === 'Photocard' ? 'selected' : ''}>Photocard</option><option ${go.type === 'Album' ? 'selected' : ''}>Album</option><option ${go.type === 'Merch' ? 'selected' : ''}>Merch</option></select></label></div><div class="form-row"><label>Closes<input name="deadline" type="date" required value="${go.deadline}" /></label><label>Payment due<input name="paymentDeadline" type="date" required value="${go.paymentDeadline}" /></label></div><label>Public description<textarea name="description" rows="3">${go.description}</textarea></label><label class="photo-field">GO cover photo<input class="photo-input" name="image" type="file" accept="image/*" /><span class="photo-preview">${go.image ? `<img src="${go.image}" alt="Current GO cover" />` : 'Choose a new image or keep the current one.'}</span></label><button class="primary-button" type="submit">Save GO details ↗</button></form>`); }
  if (action === 'toggle-go') { const go = goById(button.dataset.go); go.status = go.status === 'open' ? 'closed' : 'open'; save(); closeModal(); render(); notify(`${go.name} is now ${go.status}.`); }
  if (action === 'delete-go') { const go = goById(button.dataset.go); if (window.confirm(`Delete ${go.name}? This also removes its demo claims.`)) { state.orders = state.orders.filter((item) => item.id !== go.id); state.claims = state.claims.filter((claim) => claim.goId !== go.id); save(); closeModal(); render(); notify(`${go.name} deleted.`); } }
  if (action === 'duplicate-go') { const original = goById(button.dataset.go); const duplicate = structuredClone(original); duplicate.id = `${original.id}-copy-${Date.now()}`; duplicate.name = `${original.name} · copy`; duplicate.status = 'open'; state.orders.push(duplicate); save(); closeModal(); render(); notify('GO duplicated.'); }
  if (action === 'reminders') {
    const reminders = [
      ['Instagram · friendly', 'Kia ora! Friendly reminder that your GO payment is due soon. Please send your payment proof when ready.'],
      ['Instagram · final reminder', 'Hi! This is a final reminder that your GO payment is due soon. Please send payment proof or message us if you need help.'],
      ['Discord · group reminder', '📣 **GO payment reminder**\n\nKia ora everyone! If you have an unpaid claim, please send your payment by the deadline and submit your payment proof. Please check your Instagram username and amount before paying.'],
      ['Discord · closing soon', '⏰ **GO closing soon**\n\nThis group order is closing soon. Please check your claim, confirm your member/quantity, and complete payment if you have not already. DM the organiser with any questions.']
    ];
    openModal('Reminder messages', `<p class="eyebrow">COPY-READY TEMPLATES</p><h2>Instagram & Discord reminders</h2><p class="modal-copy">Choose a message, then copy it to post or send.</p><div class="reminder-list">${reminders.map(([title, message], index) => `<article class="reminder-option"><div><strong>${title}</strong><pre>${message}</pre></div><button class="secondary-button" data-action="copy-reminder" data-reminder="${index}">Copy message</button></article>`).join('')}</div>`);
  }
  if (action === 'copy-reminder') {
    const messages = [
      'Kia ora! Friendly reminder that your GO payment is due soon. Please send your payment proof when ready.',
      'Hi! This is a final reminder that your GO payment is due soon. Please send payment proof or message us if you need help.',
      '📣 **GO payment reminder**\n\nKia ora everyone! If you have an unpaid claim, please send your payment by the deadline and submit your payment proof. Please check your Instagram username and amount before paying.',
      '⏰ **GO closing soon**\n\nThis group order is closing soon. Please check your claim, confirm your member/quantity, and complete payment if you have not already. DM the organiser with any questions.'
    ];
    const message = messages[Number(button.dataset.reminder)];
    if (message) navigator.clipboard?.writeText(message).then(() => notify('Reminder copied.')).catch(() => notify('Could not copy reminder.'));
  }
  if (action === 'profit') { const metrics = financeMetrics(); openModal('Profit tracker', `<p class="eyebrow">MARGIN SNAPSHOT</p><h2>Track your costs</h2><p class="modal-copy">Projected value is pulled from current item prices and claimed quantities.</p><form data-form="profit"><label>Projected order value<input name="revenue" type="number" step="0.01" value="${metrics.projectedValue.toFixed(2)}" /></label><label>Logged vendor costs<input name="vendor" type="number" step="0.01" value="${metrics.loggedCosts.toFixed(2)}" /></label><label>EMS / shipping fees<input name="shipping" type="number" step="0.01" value="0" /></label><label>Other fees<input name="fees" type="number" step="0.01" value="0" /></label><button class="primary-button" type="submit">Calculate margin ↗</button></form>`); }
  if (action === 'export-roster') { const rows = [['Username', 'GO', 'Amount owed', 'Status'], ...state.claims.map((claim) => { const go = goById(claim.goId); const payment = state.payments.find((entry) => entry.username === claim.username && (!go || entry.go === go.name)); const paid = claim.status === 'Paid' || claim.status === 'Supplied' || payment?.status === 'Paid' || payment?.status === 'Supplied'; return [claim.username, go?.name || 'Unknown GO', claim.amount, paid ? 'Paid' : 'Unpaid']; })]; downloadFile('payment-roster.csv', rows.map((row) => row.join(',')).join('\n'), 'text/csv'); notify('Payment roster exported.'); }
  if (action === 'export-vendor') { const rows = [['GO', 'Artist', 'Status', 'Deadline', 'Items'], ...state.orders.map((go) => [go.name, go.artist, go.status, go.deadline, go.items.map((item) => item.name).join(' | ')] )]; downloadFile('vendor-order-sheet.csv', rows.map((row) => row.join(',')).join('\n'), 'text/csv'); notify('Vendor sheet exported.'); }
  if (action === 'export-all') { const rows = [['Export', 'Username', 'GO', 'Amount', 'Status'], ...state.claims.map((claim) => { const go = goById(claim.goId); const payment = state.payments.find((entry) => entry.username === claim.username && (!go || entry.go === go.name)); const paid = claim.status === 'Paid' || claim.status === 'Supplied' || payment?.status === 'Paid' || payment?.status === 'Supplied'; return ['Payment roster', claim.username, go?.name || 'Unknown GO', claim.amount, paid ? 'Paid' : 'Unpaid']; })]; downloadFile('go-manager-export.csv', rows.map((row) => row.join(',')).join('\n'), 'text/csv'); notify('Everything exported.'); }
  if (action === 'export') { const rows = [['GO', 'Artist', 'Status', 'Deadline', 'Items'], ...state.orders.map((go) => [go.name, go.artist, go.status, go.deadline, go.items.length])]; downloadFile('go-manager-orders.csv', rows.map((row) => row.join(',')).join('\n'), 'text/csv'); notify('GO CSV downloaded.'); }
  if (action === 'packing') { downloadFile('packing-list.txt', 'GO MANAGER PACKING LIST\n\n@livskz\n- SKZOO 10cm Plush × 1\n\n@stayjinnie\n- ATE Album Vol. 2 × 1'); notify('Packing list downloaded.'); }
  if (action === 'tracking') { const claim = button.dataset.claim === undefined ? null : state.claims[Number(button.dataset.claim)]; openModal('Add tracking', `<p class="eyebrow">SHIPMENT UPDATE</p><h2>${claim ? `@${claim.username}` : 'Add tracking number'}</h2><form data-form="tracking" data-claim="${button.dataset.claim ?? ''}"><label>Tracking number<input name="tracking" required value="${claim?.trackingNumber || ''}" placeholder="NZ Post tracking number" /></label><label>Carrier<select name="carrier"><option ${claim?.carrier === 'NZ Post' ? 'selected' : ''}>NZ Post</option><option ${claim?.carrier === 'CourierPost' ? 'selected' : ''}>CourierPost</option></select></label><button class="primary-button" type="submit">Save tracking ↗</button></form>`); }
  if (action === 'delivered') { const claim = state.claims[Number(button.dataset.claim)]; if (claim?.trackingNumber && window.confirm(`Mark @${claim.username}'s order as delivered?`)) { claim.status = 'Delivered'; save(); render(); notify(`Order marked delivered for @${claim.username}.`); } }
  if (action === 'settings') openModal('Settings', `<p class="eyebrow">WORKSPACE SETTINGS</p><h2>Organiser settings</h2><form data-form="settings"><label>Organiser name<input name="organiser" value="${state.settings.organiser}" /></label><label>Instagram handle<input name="instagram" value="${state.settings.instagram}" /></label><label>Secure threshold<input name="threshold" type="number" min="0.5" max="1" step="0.01" value="${state.settings.threshold}" /></label><button class="primary-button" type="submit">Save settings ↗</button></form>${passwordManagerSection()}`);
});

document.addEventListener('input', (event) => {
  const input = event.target.closest('[data-admin-search]');
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  document.querySelectorAll(`[data-admin-search-row="${input.dataset.adminSearch}"]`).forEach((row) => {
    row.hidden = query && !row.dataset.searchText.toLowerCase().includes(query);
  });
});

document.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === 'admin-login-form') {
    if (supabaseClient) {
      const { error } = await supabaseClient.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
      if (error) { notify(`Admin sign-in failed: ${error.message}`); return; }
      sessionStorage.setItem('go-manager-admin', 'unlocked');
      render();
      await loadCloudState();
      save();
      notify('Admin mode unlocked.');
    } else if (form.password.value === ADMIN_PASSWORD) {
      sessionStorage.setItem('go-manager-admin', 'unlocked');
      render();
      notify('Admin mode unlocked.');
    } else {
      form.password.value = '';
      form.password.focus();
      notify('Incorrect admin password.');
    }
    return;
  }
  if (form.id === 'claim-form') { const values = claimStore(); if (!Object.values(values).some((value) => value > 0)) { notify('Choose at least one item first.'); return; } const goId = route().split('/')[1]; const go = goById(goId); const username = form.username.value.trim().replace(/^@/, ''); const selections = Object.fromEntries(Object.entries(values).filter(([, value]) => value > 0)); const selectedItems = new Set(); const amount = Object.entries(selections).reduce((sum, [key, value]) => { const item = go.items.find((candidate) => key.startsWith(`${candidate.id}-`)); selectedItems.add(item.id); if (item.kind === 'set') { const option = key.slice(`${item.id}-`.length); item.claims[option] = (item.claims[option] || 0) + value; } else item.claimed = (item.claimed || 0) + value; return sum + item.price * value; }, 0); const firstItem = go.items.find((item) => Object.keys(selections).some((key) => key.startsWith(`${item.id}-`))); const claim = { username, goId, itemId: firstItem?.id || go.items[0].id, selections, amount, status: 'Pending', credit: 0 }; state.claims.unshift(claim); if (supabaseClient) { const result = await supabaseClient.from('claim_events').insert({ go_id: claim.goId, item_id: claim.itemId, instagram_username: claim.username, selections: claim.selections, amount: claim.amount, status: claim.status }).select('id').single(); if (result.error) { notify(`Claim sync failed: ${result.error.message}`); return; } claim.cloudClaimId = result.data.id; } save(); sessionStorage.setItem('go-manager-username', username.toLowerCase()); sessionStorage.removeItem('go-claim'); notify('Claim submitted. Check My orders for updates.'); window.location.hash = '#my-orders'; return; }
  if (form.id === 'lookup-form') {
    await Promise.race([userAccountsReady.catch(() => undefined), new Promise((resolve) => setTimeout(resolve, 3000))]);
    const username = form.elements.namedItem('username').value.trim().replace(/^@/, '').toLowerCase();
    const password = form.elements.namedItem('password').value;
    const createAccount = form.elements.namedItem('createAccount').checked;
    if (!username || !password) { notify('Enter your username and password.'); return; }
    const account = state.userAccounts[username];
    if (createAccount) {
      if (account) { notify('That username already has a password. Please sign in.'); return; }
      if (password.length < 6) { notify('Password must be at least 6 characters.'); return; }
      const salt = randomSalt();
      const newAccount = { salt, hash: await hashPassword(password, salt), createdAt: new Date().toISOString() };
      if (supabaseClient) {
        try { await saveUserAccount(username, newAccount); } catch (error) { notify(error.message); return; }
      }
      state.userAccounts[username] = newAccount;
      save();
      sessionStorage.setItem('go-manager-username', username);
      render();
      notify('Password created. Welcome to My orders.');
      return;
    }
    if (!account) { notify('No password found. Tick the first-time option to create one.'); return; }
    if (await hashPassword(password, account.salt) !== account.hash) { notify('Incorrect password.'); return; }
    sessionStorage.setItem('go-manager-username', username);
    render();
    return;
  }
  const data = new FormData(form);
  if (form.dataset.form === 'store-order') { state.storeOrders.unshift({ id: Date.now(), username: data.get('username').replace(/^@/, ''), vendor: data.get('vendor'), description: data.get('description'), amountOwed: Number(data.get('amountOwed')), status: data.get('status') }); save(); render(); notify('Store order added.'); return; }
  if (form.dataset.form === 'edit-claim') { const claim = state.claims[Number(form.dataset.claim)]; const amount = Number(data.get('amount')); if (!claim || !Number.isFinite(amount) || amount < 0) { notify('Enter a valid non-negative amount.'); return; } claim.amount = amount; save(); closeModal(); render(); notify(`Amount owed for @${claim.username} updated.`); return; }
  if (form.dataset.form === 'product') { const existing = form.dataset.product ? state.shop.find((item) => item.id === form.dataset.product) : null; const image = await readPhoto(data.get('image')); const product = { id: form.dataset.product || `shop-${Date.now()}`, name: data.get('name'), category: data.get('category'), price: Number(data.get('price')), stock: Number(data.get('stock')), description: data.get('description') || '', image: image || existing?.image || '' }; if (form.dataset.product) state.shop = state.shop.map((item) => item.id === form.dataset.product ? product : item); else state.shop.push(product); save(); closeModal(); render(); notify(form.dataset.product ? 'Product updated.' : 'Product added to the shop.'); return; }
  if (form.dataset.form === 'edit-go') { const go = goById(form.dataset.go); const image = await readPhoto(data.get('image')); go.name = data.get('name'); go.artist = data.get('artist'); go.type = data.get('type'); go.deadline = data.get('deadline'); go.paymentDeadline = data.get('paymentDeadline'); go.description = data.get('description') || ''; if (image) go.image = image; save(); closeModal(); render(); notify(`${go.name} updated.`); return; }
  if (form.dataset.form === 'new-item') { const go = goById(form.dataset.go); const image = await readPhoto(data.get('image')); const kind = data.get('kind'); const stock = Number(data.get('stock')); const options = String(data.get('options') || '').split(',').map((option) => option.trim()).filter(Boolean); const id = `${go.id}-item-${Date.now()}`; const item = { id, name: data.get('name'), kind, price: Number(data.get('price')), description: data.get('description') || '', image: image || '', sortOrder: go.items.length, options: options.length ? options : ['Standard set'] }; if (kind === 'set') { item.setCount = stock; item.totalSlots = stock; item.secureThreshold = 0.6; item.claims = Object.fromEntries(item.options.map((option) => [option, 0])); } else if (kind === 'batch') { item.batchSize = stock; item.claimed = 0; } else { item.stock = stock; item.claimed = 0; } go.items.push(item); save(); closeModal(); render(); notify(`${item.name} added to ${go.name}.`); return; }
  if (form.dataset.form === 'edit-item') { const go = goById(form.dataset.go); const item = go?.items.find((candidate) => candidate.id === form.dataset.item); if (!item) return; const image = await readPhoto(data.get('image')); const kind = data.get('kind'); const stock = Number(data.get('stock')); const options = String(data.get('options') || '').split(',').map((option) => option.trim()).filter(Boolean); const nextOptions = options.length ? options : ['Standard set']; const previousClaims = item.claims || {}; item.name = data.get('name'); item.kind = kind; item.price = Number(data.get('price')); item.description = data.get('description') || ''; item.options = nextOptions; if (image) item.image = image; delete item.setCount; delete item.totalSlots; delete item.batchSize; delete item.stock; if (kind === 'set') { item.setCount = stock; item.totalSlots = stock; item.secureThreshold = 0.6; item.claims = Object.fromEntries(nextOptions.map((option) => [option, previousClaims[option] || 0])); item.claimedSets = Math.min(item.claimedSets || 0, stock); } else if (kind === 'batch') { item.batchSize = stock; item.claimed = item.claimed || 0; delete item.claims; } else { item.stock = stock; item.claimed = item.claimed || 0; delete item.claims; } save(); closeModal(); render(); notify(`${item.name} updated.`); return; }
  if (form.dataset.form === 'shop-checkout') { const items = basket(); state.shop.forEach((listing) => { const ordered = items.find((item) => item.id === listing.id); if (ordered) listing.stock = Math.max(0, listing.stock - ordered.quantity); }); save(); saveBasket([]); closeModal(); render(); notify('Shop order submitted. We will message you for payment.'); }
  if (form.dataset.form === 'payment') { state.payments.unshift({ id: Date.now(), username: 'demo-joiner', go: 'Multiple GOs', amount: Number(data.get('amount')), method: data.get('method'), reference: data.get('reference'), submitted: 'Just now', status: 'Pending' }); save(); closeModal(); notify('Payment proof submitted for review.'); }
  if (form.dataset.form === 'manual-payment') { const username = data.get('username').trim().replace(/^@/, ''); const amount = Number(data.get('amount')); if (!username || !Number.isFinite(amount) || amount <= 0) { notify('Enter a valid username and amount.'); return; } state.payments.unshift({ id: Date.now(), username, go: 'Manual payment', amount, method: data.get('method'), reference: data.get('reference'), submitted: 'Just now', status: 'Paid' }); if (data.get('markPaid') === 'on') state.claims.filter((claim) => claim.username.toLowerCase() === username.toLowerCase() && claim.status !== 'Supplied').forEach((claim) => { claim.status = 'Paid'; }); save(); closeModal(); render(); notify(`Payment for @${username} added.`); return; }
  if (form.dataset.form === 'shipping') { closeModal(); notify('Shipping request submitted.'); }
  if (form.dataset.form === 'tracking') { const claim = form.dataset.claim === '' ? null : state.claims[Number(form.dataset.claim)]; if (claim) { claim.trackingNumber = data.get('tracking'); claim.carrier = data.get('carrier'); claim.status = 'Shipped'; save(); closeModal(); render(); notify(`Tracking saved for @${claim.username}.`); } else { closeModal(); notify(`Tracking saved: ${data.get('tracking')}.`); } }
  if (form.dataset.form === 'profit') { const margin = Number(data.get('revenue')) - Number(data.get('vendor')) - Number(data.get('shipping')) - Number(data.get('fees')); closeModal(); notify(`Estimated margin: ${money(margin)}.`); }
  if (form.dataset.form === 'settings') { state.settings.organiser = data.get('organiser'); state.settings.instagram = data.get('instagram'); state.settings.threshold = Number(data.get('threshold')); save(); closeModal(); notify('Settings saved.'); }
  if (form.dataset.form === 'reset-password') { const username = form.dataset.username.toLowerCase(); const password = data.get('password'); if (password.length < 6) { notify('Password must be at least 6 characters.'); return; } const salt = randomSalt(); const account = { salt, hash: await hashPassword(password, salt), createdAt: state.userAccounts[username]?.createdAt || new Date().toISOString() }; try { await saveUserAccount(username, account); } catch (error) { notify(error.message); return; } state.userAccounts[username] = account; save(); closeModal(); notify(`Password reset for @${username}.`); }
  if (form.dataset.form === 'new-go') { const id = data.get('name').toLowerCase().replace(/[^a-z0-9]+/g, '-'); const image = await readPhoto(data.get('image')); state.orders.unshift({ id, name: data.get('name'), artist: data.get('artist'), type: data.get('type'), deadline: data.get('deadline'), paymentDeadline: data.get('paymentDeadline'), setsOnHand: Number(data.get('setsOnHand')), description: data.get('description') || 'New group order.', image: image || '', status: 'open', items: [{ id: `${id}-item`, name: 'First item', kind: 'merch', price: 0, stock: 0, claimed: 0, options: ['Standard set'] }] }); save(); closeModal(); render(); notify('New group order created.'); }
});

window.addEventListener('hashchange', render);
render();
if (supabaseClient) {
  supabaseClient.channel('go-manager-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_public_state' }, (payload) => {
      if (!cloudSaving && payload.new?.state) {
        state = { ...state, ...payload.new.state };
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        render();
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'claim_events' }, () => {
      loadClaimEvents();
    })
    .subscribe();
  userAccountsReady = loadCloudState();
}
