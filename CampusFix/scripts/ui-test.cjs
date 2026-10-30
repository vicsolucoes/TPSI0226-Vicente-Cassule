const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:8080';
const out = process.env.CAMPUSFIX_EVIDENCIAS;
fs.mkdirSync(out, { recursive: true });
const results = [];
let browser;
let lastPage;
const assertText = async (page, text) => {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
};
async function login(user) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  lastPage = page;
  const packets = [];
  page.on('request', request => {
    if (!request.url().includes('/xas/')) return;
    try {
      const data = request.postDataJSON();
      if (data && !/login|password/i.test(JSON.stringify(data))) {
        packets.push({ data, headers: request.headers(), url: request.url() });
      }
    } catch {}
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  const username = page.locator('input[name="username"], input#usernameInput, input[autocomplete="username"]');
  await username.first().waitFor({ timeout: 30000 });
  await username.first().fill(user);
  await page.locator('input[type="password"]').first().fill('CampusFix.Test!2026');
  await page.getByRole('button', { name: /sign in|log in|iniciar sessão|entrar/i }).first().click();
  await assertText(page, 'CAMPUSFIX');
  results.push({ teste: `Autenticação ${user}`, resultado: 'PASS' });
  return { context, page, packets };
}
async function route(page, url, heading) {
  await page.goto(`${base}/p/${url}`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: heading, exact: true }).waitFor({ timeout: 20000 });
}
async function screenshot(page, name) {
  await page.screenshot({ path: path.join(out, name), fullPage: true });
}
(async () => {
  browser = await chromium.launch({ headless: true });
  const admin = await login('cf_admin');
  await route(admin.page, 'categorias', 'Categorias');
  await admin.page.getByRole('button', { name: 'Nova categoria', exact: true }).click();
  await admin.page.getByLabel('Nome', { exact: true }).fill('Informática');
  await admin.page.getByLabel('Descrição', { exact: true }).fill('Equipamentos, rede e aplicações da escola.');
  await admin.page.getByRole('button', { name: 'Guardar categoria', exact: true }).click();
  await assertText(admin.page, 'Informática');
  results.push({ teste: 'RF08 administrador cria categoria', resultado: 'PASS' });
  await screenshot(admin.page, '05-categorias.png');

  const a = await login('cf_aluno_a');
  await a.page.getByRole('button', { name: 'Criar pedido', exact: true }).first().click();
  await a.page.getByLabel('Título', { exact: true }).fill('Computador da sala 12 não liga');
  await a.page.getByLabel('Descreve o problema', { exact: true }).fill('O computador não apresenta luzes nem inicia. A tomada funciona com outro equipamento.');
  await a.page.getByLabel('Edifício / sala (opcional)', { exact: true }).fill('Edifício A · Sala 12');
  await a.page.getByRole('combobox').first().click();
  await a.page.getByRole('option', { name: 'Informática', exact: true }).click();
  await a.page.getByRole('button', { name: 'Guardar pedido', exact: true }).click();
  await a.page.getByRole('heading', { name: 'Computador da sala 12 não liga', exact: true }).waitFor({ timeout: 20000 });
  await a.page.getByRole('button', { name: 'Acrescentar comentário', exact: true }).click();
  await a.page.getByLabel('Comentário', { exact: true }).fill('O problema começou hoje no início da aula.');
  await a.page.getByRole('button', { name: 'Publicar comentário', exact: true }).click();
  await assertText(a.page, 'O problema começou hoje no início da aula.');
  await screenshot(a.page, '03-detalhe-com-comentario.png');
  results.push({ teste: 'RF02 RF03 RF06 utilizador cria consulta e comenta', resultado: 'PASS' });
  await route(a.page, 'meus-pedidos', 'Os meus pedidos');
  await assertText(a.page, 'Computador da sala 12 não liga');
  await screenshot(a.page, '02-meus-pedidos.png');
  await route(a.page, 'campusfix', 'CAMPUSFIX');
  await screenshot(a.page, '01-dashboard.png');

  const b = await login('cf_aluno_b');
  await route(b.page, 'meus-pedidos', 'Os meus pedidos');
  assert.equal(await b.page.getByText('Computador da sala 12 não liga', { exact: true }).count(), 0);
  assert.equal(await b.page.getByText('Utilizadores e perfis', { exact: true }).count(), 0);
  assert.equal(await b.page.getByText('Categorias', { exact: true }).count(), 0);
  results.push({ teste: 'RF03 RF01 segundo utilizador não vê pedido nem administração', resultado: 'PASS' });

  await route(admin.page, 'todos-pedidos', 'Todos os pedidos');
  await assertText(admin.page, 'Computador da sala 12 não liga');
  // Reutiliza a consulta real da grelha administrativa com a sessão de B.
  // A consulta sem filtro de proprietário tem de continuar limitada por Entity Access.
  const adminQuery = [...admin.packets].reverse().find(p =>
    /CampusFix\.Pedido/.test(JSON.stringify(p.data)) && /retrieve|query|xpath/i.test(JSON.stringify(p.data)));
  const userPacket = [...b.packets].reverse().find(p => p.headers);
  if (!adminQuery || !userPacket) throw new Error('Não foi possível identificar a consulta real para o teste direto de Entity Access.');
  const headers = { ...userPacket.headers };
  for (const k of ['cookie', 'host', 'content-length', 'connection']) delete headers[k];
  const adminResponse = await admin.context.request.post(adminQuery.url, { headers: adminQuery.headers, data: adminQuery.data });
  const adminBody = await adminResponse.text();
  assert.ok(adminBody.includes('Computador da sala 12 não liga'), 'Consulta de controlo administrativa deve devolver o pedido');
  const isolatedResponse = await b.context.request.post(adminQuery.url, { headers, data: adminQuery.data });
  const isolatedBody = await isolatedResponse.text();
  assert.equal(isolatedBody.includes('Computador da sala 12 não liga'), false, 'Entity Access não pode revelar o pedido a B');
  assert.equal(isolatedResponse.status(), 200);
  results.push({ teste: 'Segurança: consulta administrativa repetida com sessão B não expõe o pedido', resultado: 'PASS' });

  const t = await login('cf_tecnico');
  await route(t.page, 'gestao-pedidos', 'Área do técnico');
  await assertText(t.page, 'Computador da sala 12 não liga');
  await t.page.getByRole('button', { name: 'Assumir', exact: true }).first().click();
  await assertText(t.page, 'Em análise');
  await screenshot(t.page, '04-area-tecnico.png');
  await t.page.getByRole('button', { name: 'Abrir', exact: true }).first().click();
  await t.page.getByRole('button', { name: 'Iniciar tratamento', exact: true }).click();
  await assertText(t.page, 'Em tratamento');
  await t.page.getByRole('button', { name: 'Concluir pedido', exact: true }).click();
  await t.page.getByLabel('Nota de resolução', { exact: true }).fill('Fonte de alimentação substituída. Arranque e ligação à rede testados.');
  await t.page.getByRole('button', { name: 'Concluir pedido', exact: true }).click();
  await assertText(t.page, 'Resolvido');
  results.push({ teste: 'RF05 RF07 técnico assume trata e conclui com nota', resultado: 'PASS' });
  await route(a.page, 'meus-pedidos', 'Os meus pedidos');
  await a.page.getByRole('button', { name: 'Abrir', exact: true }).first().click();
  await assertText(a.page, 'Resolvido');
  assert.equal(await a.page.getByRole('button', { name: 'Editar', exact: true }).count(), 0);
  assert.equal(await a.page.getByRole('button', { name: 'Acrescentar comentário', exact: true }).count(), 0);
  results.push({ teste: 'RF04 pedido resolvido fica fechado para o autor', resultado: 'PASS' });
  fs.writeFileSync(path.join(out, 'testes-interface.json'), JSON.stringify({ executado_em: new Date().toISOString(), resultados: results }, null, 2));
  console.log(JSON.stringify({ resultado: 'PASS', testes: results.length }));
})().catch(async error => {
  if (lastPage) {
    await lastPage.screenshot({ path: path.join(out, 'falha-interface.png'), fullPage: true }).catch(() => {});
    fs.writeFileSync(path.join(out, 'falha-interface.txt'), (await lastPage.locator('body').innerText().catch(() => '')) + '\n' + error.stack);
  }
  console.error(error.stack);
  process.exitCode = 1;
}).finally(async () => { if (browser) await browser.close(); });
