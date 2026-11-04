const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
// Na CI as contas cf_* são contas demo efémeras. Localmente, com CAMPUSFIX_CREATE_ACCOUNTS=1,
// o administrador indicado cria-as pela página Utilizadores e perfis antes do percurso.
const base = process.env.CAMPUSFIX_BASE_URL || 'http://127.0.0.1:8080';
const out = process.env.CAMPUSFIX_EVIDENCIAS;
const password = process.env.CAMPUSFIX_TEST_PASSWORD;
const adminUser = process.env.CAMPUSFIX_ADMIN_USER || 'cf_admin';
const adminPassword = process.env.CAMPUSFIX_ADMIN_PASSWORD || password;
const createAccounts = process.env.CAMPUSFIX_CREATE_ACCOUNTS === '1';
const secrets = [password, adminPassword].filter(Boolean);
fs.mkdirSync(out, { recursive: true });
const results = [];
let browser;
let lastPage;
const PEDIDO = 'Computador da sala 12 não liga';
const PEDIDO2 = 'Projetor da sala 3 sem imagem';
const COMENTARIO = 'O problema começou hoje no início da aula.';
const pass = teste => results.push({ teste, resultado: 'PASS' });
const assertText = async (page, text) => {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
};
const bodyText = page => page.locator('body').innerText();
const responseText = async response => {
  const text = await response.text();
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
};
async function noErrorDialog(page, where) {
  await page.waitForTimeout(500);
  const errors = await page.locator('.mx-dialog-error, .modal-dialog, [role="dialog"]')
    .filter({ hasText: /error|erro|not allowed|não tem permiss|unauthori/i }).count();
  assert.equal(errors, 0, `Diálogo de erro em ${where}`);
}
async function login(user, secret = password) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  lastPage = page;
  const packets = [];
  page.on('request', request => {
    if (!request.url().startsWith(base + '/') || request.method() !== 'POST') return;
    try {
      const data = request.postDataJSON();
      if (data && !/login|password/i.test(JSON.stringify(data))) {
        packets.push({ data, headers: request.headers(), url: request.url(), responseBody: request.response().then(async r => { const text = r ? await r.text() : ''; try { return JSON.stringify(JSON.parse(text)); } catch { return text; } }).catch(() => '') });
      }
    } catch {}
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  const username = page.locator('input[name="username"], input#usernameInput, input[autocomplete="username"]');
  await username.first().waitFor({ timeout: 30000 });
  await username.first().fill(user);
  await page.locator('input[type="password"]').first().fill(secret);
  await page.getByRole('button', { name: /sign in|log in|iniciar sessão|entrar/i }).first().click();
  await assertText(page, 'CAMPUSFIX');
  pass(`Autenticação ${user}`);
  return { context, page, packets };
}
async function route(page, url, heading) {
  await page.goto(`${base}/p/${url}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: heading, exact: true }).waitFor({ timeout: 20000 });
}
async function screenshot(page, name) {
  await page.screenshot({ path: path.join(out, name), fullPage: true });
}
async function createAccount(page, login, fullName, role) {
  await page.getByRole('menuitem', { name: 'Utilizadores e perfis', exact: true }).click();
  await page.getByRole('button', { name: 'New local user', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New Account' });
  await dialog.getByRole('textbox', { name: 'Full name', exact: true }).fill(fullName);
  await dialog.getByRole('textbox', { name: 'User name', exact: true }).fill(login);
  await dialog.getByRole('combobox', { name: 'User role(s)', exact: true }).click();
  await page.getByRole('option', { name: role, exact: true }).click();
  await dialog.getByRole('heading', { name: 'New Account' }).click();
  await dialog.getByRole('textbox', { name: 'New password', exact: true }).fill(password);
  await dialog.getByRole('textbox', { name: 'Confirm password', exact: true }).fill(password);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await dialog.waitFor({ state: 'hidden', timeout: 20000 });
  await page.getByRole('row').filter({ hasText: login }).first().waitFor({ timeout: 20000 });
}
async function saveCategory(page, nome, descricao, ativa) {
  await page.getByLabel('Nome', { exact: true }).fill(nome);
  await page.getByLabel('Descrição', { exact: true }).fill(descricao);
  const check = page.getByLabel('Disponível para novos pedidos', { exact: true });
  if ((await check.isChecked()) !== ativa) await check.click();
  await page.getByRole('button', { name: 'Guardar categoria', exact: true }).click();
  await page.getByRole('heading', { name: 'Categorias', exact: true }).waitFor({ timeout: 20000 });
}
async function openCategory(page, nome) {
  await page.getByRole('row').filter({ hasText: nome }).getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByRole('heading', { name: 'Categoria', exact: true }).waitFor({ timeout: 20000 });
}
async function createPedido(page, titulo, descricao, local) {
  await page.getByRole('button', { name: 'Criar pedido', exact: true }).first().click();
  await page.getByLabel('Título', { exact: true }).fill(titulo);
  await page.getByLabel('Descreve o problema', { exact: true }).fill(descricao);
  await page.getByLabel('Edifício / sala (opcional)', { exact: true }).fill(local);
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).click();
  await page.getByRole('option', { name: 'Informática', exact: true }).waitFor({ timeout: 20000 });
  const inativa = await page.getByRole('option', { name: 'Mobiliário', exact: true }).count();
  await page.getByRole('option', { name: 'Informática', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar pedido', exact: true }).click();
  await page.getByRole('heading', { name: titulo, exact: true }).waitFor({ timeout: 20000 });
  return inativa;
}
async function gridShows(page, text, expected) {
  await page.waitForFunction(([t, e]) => document.body.innerText.includes(t) === e, [text, expected], { timeout: 20000 });
}
async function checkMenu(session, expected, label) {
  const { page } = session;
  await route(page, 'campusfix', 'CAMPUSFIX');
  const items = (await page.getByRole('menuitem').allInnerTexts()).map(x => x.trim()).filter(Boolean);
  assert.deepEqual(items, expected, `Menu de ${label}`);
  for (const item of expected.filter(x => !['Terminar sessão', 'Novo pedido'].includes(x))) {
    await page.getByRole('menuitem', { name: item, exact: true }).click();
    await page.waitForLoadState('networkidle');
    await noErrorDialog(page, `${label} → ${item}`);
  }
  pass(`RF01 navegação de ${label}: ${expected.join(', ')} sem erros`);
}
(async () => {
  browser = await chromium.launch({ headless: true });
  const admin = await login(adminUser, adminPassword);
  if (createAccounts) {
    await createAccount(admin.page, 'cf_aluno_a', 'Aluno A (fictício)', 'Utilizador');
    await createAccount(admin.page, 'cf_aluno_b', 'Aluno B (fictício)', 'Utilizador');
    await createAccount(admin.page, 'cf_tecnico', 'Técnico (fictício)', 'Tecnico');
    pass('Administração: administrador cria contas e atribui perfis Utilizador e Tecnico');
  }
  await route(admin.page, 'categorias', 'Categorias');
  await admin.page.getByRole('button', { name: 'Nova categoria', exact: true }).click();
  await saveCategory(admin.page, 'Informática', 'Equipamentos, rede e aplicações da escola.', true);
  await assertText(admin.page, 'Informática');
  pass('RF08 administrador cria categoria');
  await admin.page.getByRole('button', { name: 'Nova categoria', exact: true }).click();
  await saveCategory(admin.page, 'Mobiliário', 'Mesas, cadeiras e armários.', true);
  await openCategory(admin.page, 'Informática');
  await saveCategory(admin.page, 'Informática', 'Computadores, rede, projetores e aplicações da escola.', true);
  await assertText(admin.page, 'Computadores, rede, projetores e aplicações da escola.');
  pass('RF08 administrador edita categoria');
  await openCategory(admin.page, 'Mobiliário');
  await saveCategory(admin.page, 'Mobiliário', 'Mesas, cadeiras e armários.', false);
  await openCategory(admin.page, 'Mobiliário');
  assert.equal(await admin.page.getByLabel('Disponível para novos pedidos', { exact: true }).isChecked(), false, 'Desativação persistida');
  await admin.page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await admin.page.getByRole('heading', { name: 'Categorias', exact: true }).waitFor({ timeout: 20000 });
  pass('RF08 administrador desativa categoria (valor persistido reaberto)');
  await screenshot(admin.page, '05-categorias.png');

  const a = await login('cf_aluno_a');
  const inativaVisivel = await createPedido(a.page, PEDIDO, 'O computador não apresenta luzes nem inicia. A tomada funciona com outro equipamento.', 'Edifício A · Sala 12');
  assert.equal(inativaVisivel, 0, 'Categoria inativa não pode ser oferecida');
  pass('RF08 categoria inativa não aparece no formulário de novo pedido');
  await assertText(a.page, 'Categoria: Informática');
  await assertText(a.page, 'Estado: Novo');
  await assertText(a.page, 'Criado por: cf_aluno_a');
  await a.page.getByRole('button', { name: 'Acrescentar comentário', exact: true }).click();
  await a.page.getByLabel('Comentário', { exact: true }).fill(COMENTARIO);
  await a.page.getByRole('button', { name: 'Publicar comentário', exact: true }).click();
  await a.page.getByRole('heading', { name: PEDIDO, exact: true }).waitFor({ timeout: 20000 });
  await assertText(a.page, COMENTARIO);
  await assertText(a.page, 'cf_aluno_a ·');
  await screenshot(a.page, '03-detalhe-com-comentario.png');
  pass('RF02 RF03 RF06 utilizador cria, consulta e comenta; detalhe mostra categoria, estado, prioridade e autor');
  await route(a.page, 'meus-pedidos', 'Os meus pedidos');
  await assertText(a.page, PEDIDO);
  await screenshot(a.page, '02-meus-pedidos.png');
  await route(a.page, 'campusfix', 'CAMPUSFIX');
  assert.equal((await a.page.locator('.cf-kpi').first().getByRole('heading').innerText()).trim(), '1');
  await screenshot(a.page, '01-dashboard.png');

  const b = await login('cf_aluno_b');
  assert.equal((await b.page.locator('.cf-kpi').first().getByRole('heading').innerText()).trim(), '0');
  pass('RF10 dashboard de B não conta pedidos de A');
  await route(b.page, 'meus-pedidos', 'Os meus pedidos');
  assert.equal(await b.page.getByText(PEDIDO, { exact: true }).count(), 0);
  assert.equal(await b.page.getByText('Utilizadores e perfis', { exact: true }).count(), 0);
  assert.equal(await b.page.getByText('Categorias', { exact: true }).count(), 0);
  pass('RF03 RF01 segundo utilizador não vê pedido nem administração');

  await route(admin.page, 'todos-pedidos', 'Todos os pedidos');
  await assertText(admin.page, PEDIDO);
  // Reutiliza a consulta real da grelha administrativa com a sessão de B.
  // A consulta sem filtro de proprietário tem de continuar limitada por Entity Access.
  const answered = await Promise.all(admin.packets.map(async p => ({ ...p, body: await p.responseBody })));
  const adminQuery = answered.reverse().find(p => p.body.includes(PEDIDO));
  const userPacket = [...b.packets].reverse().find(p => p.headers);
  if (!adminQuery || !userPacket) throw new Error('Consulta de controlo não identificada; pacotes admin=' + admin.packets.length + ', B=' + b.packets.length);
  const headers = { ...userPacket.headers };
  for (const k of ['cookie', 'host', 'content-length', 'connection']) delete headers[k];
  const adminResponse = await admin.context.request.post(adminQuery.url, { headers: adminQuery.headers, data: adminQuery.data });
  const adminBody = await responseText(adminResponse);
  assert.ok(adminBody.includes(PEDIDO), 'Consulta de controlo administrativa deve devolver o pedido');
  const isolatedResponse = await b.context.request.post(adminQuery.url, { headers, data: adminQuery.data });
  const isolatedBody = await responseText(isolatedResponse);
  assert.equal(isolatedBody.includes(PEDIDO), false, 'Entity Access não pode revelar o pedido a B');
  assert.equal(isolatedResponse.status(), 200, `Sessão B deve continuar autenticada: ${isolatedBody.slice(0, 300)}`);
  pass('Segurança: consulta administrativa repetida com sessão B não expõe o pedido');
  // Por último, porque uma página recusada pode terminar a sessão de B no cliente.
  for (const [url, heading] of [['categorias', 'Categorias'], ['todos-pedidos', 'Todos os pedidos'], ['gestao-pedidos', 'Área do técnico']]) {
    await b.page.goto(`${base}/p/${url}`, { waitUntil: 'networkidle' });
    await b.page.waitForTimeout(2000);
    assert.equal(await b.page.getByRole('heading', { name: heading, exact: true }).count(), 0, `B não pode abrir /p/${url}`);
    assert.equal((await bodyText(b.page)).includes(PEDIDO), false);
  }
  pass('RF01 acesso direto de B aos URLs de categorias, todos os pedidos e área técnica é recusado');

  const t = await login('cf_tecnico');
  await route(t.page, 'gestao-pedidos', 'Área do técnico');
  await assertText(t.page, PEDIDO);
  await t.page.getByRole('button', { name: 'Assumir', exact: true }).first().click();
  await assertText(t.page, 'Em análise');
  await t.page.getByRole('row').filter({ hasText: PEDIDO }).filter({ hasText: 'cf_tecnico' }).waitFor({ timeout: 20000 });
  await screenshot(t.page, '04-area-tecnico.png');
  await t.page.getByRole('button', { name: 'Abrir', exact: true }).first().click();
  await assertText(t.page, 'Técnico: cf_tecnico');
  pass('RF05 técnico assume o pedido e fica identificado como responsável');
  await t.page.getByRole('button', { name: 'Iniciar tratamento', exact: true }).click();
  await assertText(t.page, 'Em tratamento');
  await t.page.getByRole('button', { name: 'Concluir pedido', exact: true }).click();
  await t.page.getByLabel('Nota de resolução', { exact: true }).fill('Fonte de alimentação substituída. Arranque e ligação à rede testados.');
  await t.page.getByRole('button', { name: 'Concluir pedido', exact: true }).click();
  await assertText(t.page, 'Estado: Resolvido');
  await assertText(t.page, 'Resolução: Fonte de alimentação substituída.');
  assert.match(await bodyText(t.page), /Conclusão: \S*\d/, 'Data de conclusão apresentada');
  pass('RF05 RF07 técnico inicia tratamento e conclui com nota; data de conclusão registada');
  await route(a.page, 'meus-pedidos', 'Os meus pedidos');
  await a.page.getByRole('button', { name: 'Abrir', exact: true }).first().click();
  await assertText(a.page, 'Estado: Resolvido');
  assert.match(await bodyText(a.page), /Conclusão: \S*\d/);
  assert.equal(await a.page.getByRole('button', { name: 'Editar', exact: true }).count(), 0);
  assert.equal(await a.page.getByRole('button', { name: 'Acrescentar comentário', exact: true }).count(), 0);
  assert.equal(await a.page.getByRole('button', { name: 'Cancelar pedido', exact: true }).count(), 0);
  pass('RF04 RF07 pedido resolvido fica fechado para o autor (sem editar, comentar ou cancelar)');
  const detalhe = await bodyText(a.page);
  assert.ok(detalhe.includes('cf_aluno_a ·') && detalhe.includes(COMENTARIO), 'Comentário do autor');
  assert.ok(detalhe.includes('cf_tecnico ·') && detalhe.includes('Resolução:'), 'Nota do técnico');
  pass('RF06 comentários associados ao pedido com o autor correto (aluno e técnico)');

  await route(a.page, 'meus-pedidos', 'Os meus pedidos');
  await createPedido(a.page, PEDIDO2, 'O projetor liga, mas não apresenta imagem do computador.', 'Edifício B · Sala 3');
  assert.equal((await bodyText(a.page)).includes(COMENTARIO), false, 'Comentário não pertence ao segundo pedido');
  await route(a.page, 'meus-pedidos', 'Os meus pedidos');
  await gridShows(a.page, PEDIDO2, true);
  const titulo = a.page.getByRole('columnheader', { name: /Título/ }).getByRole('textbox');
  await titulo.fill('Projetor');
  await gridShows(a.page, PEDIDO, false);
  await gridShows(a.page, PEDIDO2, true);
  await titulo.fill('');
  await gridShows(a.page, PEDIDO, true);
  await a.page.getByRole('columnheader', { name: /Estado/ }).getByRole('combobox').click();
  await a.page.getByRole('option', { name: 'Resolvido', exact: true }).click();
  await gridShows(a.page, PEDIDO2, false);
  await gridShows(a.page, PEDIDO, true);
  pass('RF09 pesquisa por título e filtro por estado');

  await checkMenu(a, ['Painel inicial', 'Os meus pedidos', 'Novo pedido', 'Terminar sessão'], 'Utilizador');
  await checkMenu(t, ['Painel inicial', 'Área do técnico', 'Terminar sessão'], 'Técnico');
  await checkMenu(admin, ['Painel inicial', 'Todos os pedidos', 'Categorias', 'Utilizadores e perfis', 'Terminar sessão'], 'Administrador');
  fs.writeFileSync(path.join(out, 'testes-interface.json'), JSON.stringify({ executado_em: new Date().toISOString(), base, resultados: results }, null, 2));
  console.log(JSON.stringify({ resultado: 'PASS', testes: results.length }));
})().catch(async error => {
  const redact = text => secrets.reduce((acc, s) => acc.split(s).join('[redacted]'), text);
  if (lastPage) {
    await lastPage.screenshot({ path: path.join(out, 'falha-interface.png'), fullPage: true }).catch(() => {});
    const debug = (await lastPage.locator('body').ariaSnapshot().catch(() => '')) + '\n' + (await lastPage.locator('body').innerText().catch(() => '')) + '\n' + error.stack;
    fs.writeFileSync(path.join(out, 'falha-interface.txt'), redact(debug));
  }
  console.error(redact(error.stack));
  process.exitCode = 1;
}).finally(async () => { if (browser) await browser.close(); });
