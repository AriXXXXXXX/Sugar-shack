import { chromium } from 'playwright'
const launch = (args = []) => chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist', ...args] })
const out = []
const ok = (n, c, extra = '') => { out.push(`${c ? 'PASS' : 'FAIL'}  ${n} ${extra}`) }

// ── Cart + language (desktop) ──
{
  const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage()
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(4000)
  await page.evaluate(() => document.querySelector('#order').scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(1500)
  await page.click('#order [role=radio]:nth-of-type(3)')             // Oreo Marshmallow
  await page.click('#order button:has-text("Add to cart")'); await page.waitForTimeout(300)
  const badge = await page.textContent('header button[aria-label^="Cart"]')
  ok('add to cart updates header count (qty 2)', badge.trim() === '2', `badge="${badge.trim()}"`)
  await page.click('header button[aria-label^="Cart"]'); await page.waitForTimeout(700)
  const drawerText = await page.textContent('aside[role=dialog]')
  ok('drawer lists Oreo Marshmallow, $10.00', drawerText.includes('Oreo Marshmallow') && drawerText.includes('$10.00'), '')
  await page.click('aside button[aria-label="Increase quantity"]'); await page.waitForTimeout(200)
  ok('increase quantity → subtotal $15.00', (await page.textContent('aside[role=dialog]')).includes('$15.00'))
  await page.click('aside button[aria-label="Decrease quantity"]'); await page.click('aside button[aria-label="Decrease quantity"]'); await page.waitForTimeout(200)
  ok('decrease → $5.00', (await page.textContent('aside[role=dialog]')).includes('$5.00'))
  const stored = await page.evaluate(() => localStorage.getItem('ssc-cart'))
  ok('cart persisted to localStorage', stored && stored.includes('oreoMarshmallow'), stored)
  await page.click('aside button:has-text("Checkout")'); await page.waitForTimeout(400)
  ok('checkout shows honest "not connected" notice', (await page.textContent('[role=alertdialog]')).includes('not connected'))
  await page.screenshot({ path: 'shots/func-checkout.png' })
  await page.click('[role=alertdialog] button'); await page.click('aside >> text=Remove'); await page.waitForTimeout(300)
  ok('remove → empty state', (await page.textContent('aside[role=dialog]')).includes('Your cart is empty'))
  await page.keyboard.press('Escape'); await page.waitForTimeout(500)

  // languages
  const langs = [['th','th','ไทย','คุกกี้ของเรา'],['fr','fr','Français','NOS COOKIES'],['de','de','Deutsch','UNSERE COOKIES'],['zh','zh-Hans','简体中文','我们的曲奇'],['es','es','Español','NUESTRAS GALLETAS']]
  for (const [code, htmlLang, label] of langs) {
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
    await page.click('header button[aria-haspopup=listbox]'); await page.click(`[role=option] >> text=${label}`); await page.waitForTimeout(500)
    const hl = await page.evaluate(() => document.documentElement.lang)
    const nav = await page.textContent('header nav')
    const title = await page.title()
    ok(`lang ${code}: <html lang>=${hl}, nav + title translated`, hl === htmlLang && !nav.includes('The Cookie') && title !== 'Sugar Shack Cookies | Thick. Golden. Ridiculously gooey.', `nav="${nav.trim().slice(0,40)}"`)
    await page.screenshot({ path: `shots/lang-${code}.png` })
  }
  await page.reload(); await page.waitForTimeout(3000)
  ok('language persists after reload (es)', (await page.evaluate(() => document.documentElement.lang)) === 'es')
  // switch back to English instantly, no reload
  await page.click('header button[aria-haspopup=listbox]'); await page.click('[role=option] >> text=English'); await page.waitForTimeout(300)
  ok('switch back to English without reload', (await page.textContent('header nav')).includes('The Cookie'))
  ok('no page errors (cart/lang run)', errs.length === 0, errs.slice(0,3).join(' | '))
  await b.close()
}
// ── WebGL unavailable ──
{
  const b = await launch(['--disable-gpu', '--disable-3d-apis', '--disable-webgl', '--disable-webgl2']); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage()
  const errs = []; page.on('pageerror', e => errs.push(e.message))
  await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(3000)
  const hasGL = await page.evaluate(() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } })
  const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length)
  const note = await page.textContent('body')
  ok(`WebGL fallback (webgl available in this run: ${hasGL})`, !hasGL && canvases === 0 && note.includes('3D is unavailable'), `canvases=${canvases}`)
  await page.screenshot({ path: 'shots/fallback.png' })
  ok('no page errors (fallback)', errs.length === 0, errs.join('|'))
  await b.close()
}
// ── Reduced motion ──
{
  const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }); const page = await ctx.newPage()
  const errs = []; page.on('pageerror', e => errs.push(e.message))
  await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(3500)
  const h1vis = await page.evaluate(() => { const s = document.querySelector('#hero h1 [data-in]'); return getComputedStyle(s).transform })
  ok('reduced motion: headline shown immediately (no slide transform)', h1vis === 'none' || h1vis === 'matrix(1, 0, 0, 1, 0, 0)', h1vis)
  await page.screenshot({ path: 'shots/reduced.png' })
  ok('no page errors (reduced motion)', errs.length === 0, errs.join('|'))
  await b.close()
}
console.log(out.join('\n'))
