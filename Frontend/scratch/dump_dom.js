const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4200/character-sheet/6a8bb5f80905e5a9c8004e82', { waitUntil: 'networkidle0' });
  
  const html = await page.evaluate(() => {
    const el = document.querySelector('app-character-sheet');
    return el ? el.innerHTML : 'app-character-sheet not found';
  });
  
  console.log("--- RAW DOM START ---");
  console.log(html.substring(0, 2000)); // Print first 2000 chars to avoid massive output
  console.log("--- RAW DOM END ---");
  
  await browser.close();
})();
