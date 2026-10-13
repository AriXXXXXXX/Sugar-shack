import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const devices = [['desktop', { width: 1440, height: 900 }, {}], ['iphone', { width: 390, height: 844 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }]]
for (const [name, vp, opts] of devices) {
  const page = await (await b.newContext({ viewport: vp, ...opts })).newPage()
  await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(6000)
  const to = async (sel, f) => { await page.evaluate(([s, f]) => { const r = document.querySelector(s).getBoundingClientRect(); scrollTo({ top: r.top + scrollY + f * Math.max(0, r.height - innerHeight), behavior: 'instant' }) }, [sel, f]); await page.waitForTimeout(4000) }
  await page.screenshot({ path: `shots/final-${name}-1-hero.png` })
  await to('#break', 0.6); await page.screenshot({ path: `shots/final-${name}-2-break.png` })
  await to('article[data-product-index="3"]', 0); await page.waitForTimeout(1500); await page.screenshot({ path: `shots/final-${name}-3-product.png` })
  await to('#order', 0)
  await page.click('#order [role=radio]:nth-of-type(1)'); await page.click('#order button:has-text("Add to cart")')
  await page.click('#order [role=radio]:nth-of-type(6)'); await page.click('#order button:has-text("Add to cart")')
  await page.click('header button[aria-label^="Cart"]'); await page.waitForTimeout(1200)
  await page.screenshot({ path: `shots/final-${name}-4-cart.png` })
}
await b.close()
