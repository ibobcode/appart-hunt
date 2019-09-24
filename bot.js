require("dotenv").config();
const chalk = require("chalk");
const NavigationManager = require("./navigationManager");
const fetch = require("node-fetch");

let nm = new NavigationManager();

const clock = async ms => new Promise(r => setTimeout(() => r(), ms));

const submit = async data => {
  console.log(chalk.cyan.bold(" -> Sending SL results..."));
  return fetch(
    `https://docs.google.com/forms/d/e/${process.env.GFORM_ID}/formResponse`,
    {
      credentials: "include",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: encodeURI(`entry.2053334360=${data.rooms}&entry.547324049=${data.place}&entry.1311809006=${data.desc}&entry.643658302=${data.specs}&entry.1901251362=${data.price}&entry.203521626=${data.tel}&entry.1511481753=${data.size}&entry.397580403=${data.agenceAddr}&entry.750155341=${data.agenceLink}&entry.1241065761=${data.agenceName}&entry.1413811234=${data.link}
    `),
      method: "POST",
      mode: "cors"
    }
  )
    .then(a => a.text())
    .then(a => {
      console.log("Sent.");
    });
};

const notify = async data => {
  console.log(chalk.cyan.bold(" -> Notifying IFTTT..."));
  return fetch(
    `https://maker.ifttt.com/trigger/MYPING/with/key/${process.env.IFTTT_KEY}`,
    {
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        value1: "SELOGER",
        value2: `${data.place}ème`,
        value3: `${data.price}€`
      }),
      method: "POST"
    }
  )
    .then(a => a.text())
    .then(a => {
      console.log("Sent.");
    });
};

async function main() {
  console.log(chalk.green.inverse(" - START - "));
  await nm.init();
  await nm.openSL();
  while (true) {
    const slLinks = await nm.getNewAptsSL();
    console.log(slLinks);
    if (slLinks) {
      for (let index = 0; index < slLinks.length; index += 1) {
        const data = await nm.scrapSL(slLinks[index]);
        await submit(data);
        await notify(data);
      }
    }
    await clock(5000);
  }
}

main();
