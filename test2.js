(async () => {
    const puppeteer = require('puppeteer');
    const browserOpts = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3803.0 Safari/537.36',
            // THIS IS THE KEY BIT!
            '--lang=en-US,en;q=0.9',
        ],
    };

    const browser = await puppeteer.launch(browserOpts);
    const page = await browser.newPage();
    await page.goto('https://www.seloger.com/list.htm?projects=1&types=1&places=[{ci:750101}|{ci:750102}|{ci:750108}|{ci:750109}|{ci:750110}|{ci:750117}|{ci:750103}|{ci:750104}|{ci:750107}|{ci:750111}|{ci:750118}]&price=NaN/1000&surface=25/NaN&enterprise=0&qsVersion=1.0');
    await page.screenshot({ path: 'areyouheadless.png' });
    await browser.close();
})();