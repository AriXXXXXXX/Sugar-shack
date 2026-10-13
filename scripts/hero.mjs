import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
for (const [n, vp, o] of [['desktop', { width: 1440, height: 900 }, {}], ['iphone', { width: 390, height: 844 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
  const page = await (await b.newContext({ viewport: vp, ...o })).newPage()
  await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(14000)
  await page.screenshot({ path: `shots/final-${n}-1-hero.png` })
}
await b.close()
