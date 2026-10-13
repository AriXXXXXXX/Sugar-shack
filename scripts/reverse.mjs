import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const page = await (await b.newContext({ viewport: { width: 1200, height: 750 } })).newPage()
await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(5000)
const go = async (y, n) => { await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(3500); if (n) await page.screenshot({ path: `shots/${n}.png` }) }
await go(750 + 0.62 * 4050, 'rev-A')     // mid-break going down
await go(750 + 0.98 * 4050)              // end of break
await go(750 + 0.62 * 4050, 'rev-B')     // scroll back up to the same spot
await go(0, 'rev-top')                   // all the way back to the hero
await b.close()
