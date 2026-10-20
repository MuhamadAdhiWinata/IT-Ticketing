// Uji alur API Perusahaan/Divisi/Pengguna end-to-end terhadap server dev yang berjalan.
// Jalankan: npx tsx scripts/smoke-org.ts [BASE_URL]
const BASE = process.argv[2] || 'http://localhost:3001';

let failures = 0;
let authCookie = '';

function check(label: string, ok: boolean, extra?: unknown) {
  if (ok) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}`, extra !== undefined ? JSON.stringify(extra) : '');
  }
}

async function req(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(authCookie ? { cookie: authCookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  for (const c of setCookie) {
    const pair = c.split(';')[0] ?? '';
    const name = pair.split('=')[0] ?? '';
    authCookie = authCookie
      .split('; ')
      .filter(p => p && p.split('=')[0] !== name)
      .concat(pair)
      .join('; ');
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* body kosong */ }
  return { status: res.status, data };
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'rina.wulandari@company.co.id', password: 'password123' }),
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  authCookie = setCookie.map(c => c.split(';')[0]).join('; ');
  const data: any = await res.json().catch(() => null);
  return res.status === 200 && !!data?.data?.id;
}

async function main() {
  console.log(`[SMOKE] Target: ${BASE}\n`);

  // ── 0. Autentikasi (tickets.created_by ber-FK ke users) ──
  console.log('0. Login');
  const loggedIn = await login();
  check('login sebagai USER_NON_IT', loggedIn);
  if (!loggedIn) {
    console.log('\n[SMOKE] Login gagal, pengujian dihentikan.');
    process.exit(1);
  }

  // ── 1. Master kosong di awal ──
  console.log('\n1. Kondisi awal');
  const comp0 = await req('/api/companies');
  const div0 = await req('/api/divisions');
  const startCompanies = Array.isArray(comp0.data?.data) ? comp0.data.data : [];
  const startDivisions = Array.isArray(div0.data?.data) ? comp0.data?.data ?? [] : [];
  check('GET /api/companies sukses', comp0.status === 200, comp0);
  check('GET /api/divisions sukses', div0.status === 200, div0);
  console.log(`  info  perusahaan=${startCompanies.length} divisi=${(div0.data?.data || []).length}`);

  // ── 2. CRUD Perusahaan ──
  console.log('\n2. Perusahaan');
  const created = await req('/api/companies', 'POST', { id: 'SMK-C1', name: 'PT Smoke Test' });
  check('POST /api/companies membuat record', created.status === 200 && created.data?.data?.name === 'PT Smoke Test', created);

  const dupId = await req('/api/companies', 'POST', { id: 'SMK-C1', name: 'PT Lain' });
  check('duplikat ID ditolak 409', dupId.status === 409, dupId);

  const dupName = await req('/api/companies', 'POST', { id: 'SMK-C2', name: 'PT Smoke Test' });
  check('duplikat nama ditolak 409', dupName.status === 409, dupName);

  const renamed = await req('/api/companies/SMK-C1', 'PUT', { name: 'PT IONS' });
  check('PUT memperbarui nama', renamed.status === 200 && renamed.data?.data?.name === 'PT IONS', renamed);

  // ── 3. CRUD Divisi ──
  console.log('\n3. Divisi');
  const divCreated = await req('/api/divisions', 'POST', { id: 'SMK-D1', company_id: 'SMK-C1', name: 'Finance' });
  check('POST /api/divisions membuat record', divCreated.status === 200 && divCreated.data?.data?.company_id === 'SMK-C1', divCreated);

  const divBadCompany = await req('/api/divisions', 'POST', { id: 'SMK-D2', company_id: 'TIDAK-ADA', name: 'HR' });
  check('perusahaan tidak valid ditolak 404', divBadCompany.status === 404, divBadCompany);

  const divDup = await req('/api/divisions', 'POST', { id: 'SMK-D2', company_id: 'SMK-C1', name: 'Finance' });
  check('nama divisi kembar pada perusahaan sama ditolak 409', divDup.status === 409, divDup);

  const divSecond = await req('/api/divisions', 'POST', { id: 'SMK-D2', company_id: 'SMK-C1', name: 'Human Resources' });
  check('divisi kedua dibuat', divSecond.status === 200, divSecond);

  const filtered = await req('/api/divisions?companyId=SMK-C1');
  check('filter ?companyId mengembalikan 2 divisi', filtered.status === 200 && filtered.data?.data?.length === 2, filtered);

  const filteredOther = await req('/api/divisions?companyId=TIDAK-ADA');
  check('filter perusahaan kosong mengembalikan []', filteredOther.status === 200 && filteredOther.data?.data?.length === 0, filteredOther);

  // ── 4. Pengguna dengan identitas ──
  console.log('\n4. Pengguna');
  const userCreated = await req('/api/users', 'POST', {
    id: 'SMK-U1', name: 'Rina Wulandari', email: 'rina.smoke@company.co.id',
    role: 'USER_NON_IT', companyId: 'SMK-C1', divisionId: 'SMK-D1',
  });
  check('POST /api/users menerima identitas', userCreated.status === 200, userCreated);
  check('department terisi otomatis dari divisi', userCreated.data?.data?.department === 'Finance', userCreated.data?.data);
  check('companyName ikut dikirim', userCreated.data?.data?.companyName === 'PT IONS', userCreated.data?.data);
  check('divisionName ikut dikirim', userCreated.data?.data?.divisionName === 'Finance', userCreated.data?.data);

  const crossOrg = await req('/api/users', 'POST', {
    id: 'SMK-U2', name: 'Cross Org', email: 'cross.smoke@company.co.id',
    role: 'USER_NON_IT', companyId: 'SMK-C9', divisionId: 'SMK-D1',
  });
  check('perusahaan tidak valid ditolak', crossOrg.status === 404, crossOrg);

  const userUpdated = await req('/api/users/SMK-U1', 'PUT', { divisionId: 'SMK-D2' });
  check('PUT user memperbarui divisi', userUpdated.status === 200 && userUpdated.data?.data?.divisionId === 'SMK-D2', userUpdated);
  check('department ikut berubah mengikuti divisi', userUpdated.data?.data?.department === 'Human Resources', userUpdated.data?.data);

  const noOrg = await req('/api/users', 'POST', {
    id: 'SMK-U3', name: 'Tanpa Identitas', email: 'noorg.smoke@company.co.id',
    role: 'USER_NON_IT', department: 'Operasional',
  });
  check('user tanpa perusahaan/divisi tetap boleh', noOrg.status === 200 && noOrg.data?.data?.department === 'Operasional', noOrg);

  // ── 5. Tiket memuat identitas pelapor ──
  console.log('\n5. Tiket & identitas pelapor');
  // Beri identitas pada akun login (USR-001), lalu kembalikan seperti semula.
  const assignMe = await req('/api/users/USR-001', 'PUT', { companyId: 'SMK-C1', divisionId: 'SMK-D1' });
  check('identitas akun login dapat diatur', assignMe.status === 200, assignMe);

  const me = await req('/api/auth/me');
  check('/api/auth/me memuat companyName & divisionName',
    me.data?.data?.companyName === 'PT IONS' && me.data?.data?.divisionName === 'Finance', me.data?.data);

  const ticket = await req('/api/tickets', 'POST', {
    title: 'Smoke test tiket', description: 'Uji identitas pelapor',
    category: 'IT Programmer', aplikasiProject: 'Development Aplikasi / Sistem Baru',
    priority: 'LOW', shouldIssue: false,
  });
  check('POST /api/tickets sukses', ticket.status === 200 && !!ticket.data?.data?.id, ticket.status === 200 ? ticket.data?.data?.id : ticket);
  const tk = ticket.data?.data;
  check('tiket memuat requested_by_company', tk?.requested_by_company === 'PT IONS', tk?.requested_by_company);
  check('tiket memuat requested_by_division', tk?.requested_by_division === 'Finance', tk?.requested_by_division);

  const detail = tk?.id ? await req(`/api/tickets/${tk.id}`) : null;
  check('GET /api/tickets/:id memuat identitas', detail?.data?.data?.requested_by_company === 'PT IONS', detail?.data?.data);

  const list = await req('/api/tickets');
  const listItem = (list.data?.data || []).find((t: any) => t.id === tk?.id);
  check('GET /api/tickets memuat identitas', listItem?.requested_by_company === 'PT IONS', listItem);

  const search = await req('/api/tickets/search?q=Smoke');
  const searchItem = (search.data?.data || []).find((t: any) => t.id === tk?.id);
  check('GET /api/tickets/search memuat identitas', searchItem?.requested_by_company === 'PT IONS', searchItem);

  const restoreMe = await req('/api/users/USR-001', 'PUT', { companyId: null, divisionId: null, department: 'Finance & Accounting' });
  check('identitas akun login dikembalikan', restoreMe.status === 200, restoreMe);
  if (tk?.id) await req(`/api/tickets/${tk.id}`, 'DELETE').catch(() => null);

  // ── 6. Hapus aman ──
  console.log('\n6. Penghapusan');
  const delDiv = await req('/api/divisions/SMK-D2', 'DELETE');
  check('DELETE divisi sukses', delDiv.status === 200, delDiv);
  const afterDelDiv = await req('/api/users/SMK-U1');
  console.log('  info  setelah divisi dihapus, user dibiarkan (tidak ada GET /api/users/:id)');

  const delUser = await req('/api/users/SMK-U1', 'DELETE');
  check('DELETE user sukses', delUser.status === 200, delUser);
  const delUser2 = await req('/api/users/SMK-U3', 'DELETE');
  check('DELETE user kedua sukses', delUser2.status === 200, delUser2);
  const delDiv1 = await req('/api/divisions/SMK-D1', 'DELETE');
  check('DELETE divisi pertama sukses', delDiv1.status === 200, delDiv1);
  const delComp = await req('/api/companies/SMK-C1', 'DELETE');
  check('DELETE perusahaan sukses', delComp.status === 200, delComp);

  const compAfter = await req('/api/companies');
  check('perusahaan smoke test tidak tersisa', !(compAfter.data?.data || []).some((c: any) => c.id.startsWith('SMK-')), compAfter.data?.data);

  console.log(failures === 0 ? '\n[SMOKE] Semua pemeriksaan lulus.' : `\n[SMOKE] ${failures} pemeriksaan gagal.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('[SMOKE] Error:', e.message); process.exit(1); });
