import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  
  await page.goto('http://127.0.0.1:5173');
  // Wait for load
  await page.waitForTimeout(1000);
  
  // Click add red player
  await page.click('[data-action="add-player-home"]');
  await page.waitForTimeout(500);
  
  // Get stage bounds and double click center
  await page.mouse.dblclick(400, 400); // approximate center where player appears?
  // Wait, stage size is window size. x = canvasW/2 - 60
  const viewportSize = await page.evaluate(() => {
    return { width: window.innerWidth, height: window.innerHeight };
  });
  
  const targetX = viewportSize.width / 2 - 60;
  const targetY = viewportSize.height / 2;
  
  await page.mouse.move(targetX, targetY);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.down();
  await page.mouse.up();
  
  await page.waitForTimeout(500);
  
  // check if modal is open
  const isHidden = await page.evaluate(() => {
    return document.getElementById('player-modal').classList.contains('hidden');
  });
  
  console.log('Is modal hidden after double click?', isHidden);
  
  await browser.close();
})();
