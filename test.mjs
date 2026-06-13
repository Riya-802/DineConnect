import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERR:', err));
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  await browser.close();
})();
