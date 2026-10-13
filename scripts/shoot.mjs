import { chromium } from 'playwright'
const [,, name='d', w='1440', h='900', ...ys] = process.argv
const mobile = Number(w) < 700
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl'] })
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, ...(mobile ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } : {}) })
const page = await ctx.newPage()
const logs = []
page.on('console', m => { if (['error','warning'].includes(m.type())) logs.push(m.type()+': '+m.text().slice(0,300)) })
page.on('pageerror', e => logs.push('PAGEERROR: '+e.message))
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' })
await page.waitForTimeout(6000)
for (const y of ys) {
  const val = y.startsWith('sel:') ? await page.evaluate(([sel,f]) => { const r = document.querySelector(sel).getBoundingClientRect(); return r.top + scrollY + f * Math.max(0, r.height - innerHeight) }, [y.split(':')[1], parseFloat(y.split(':')[2] || 0)]) : y.startsWith('max') ? await page.evaluate((o) => document.documentElement.scrollHeight - innerHeight - o, +y.slice(3) || 0) : +y
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), val)
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `shots/${name}-${y.replace(/[^a-z0-9.]/gi,'_')}.png` })
}
console.log(logs.join('\n') || 'no console errors')
await browser.close()
