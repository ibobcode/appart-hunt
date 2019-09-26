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

const notify = async (data, website) => {
  console.log(chalk.cyan.bold(" -> Notifying IFTTT..."));
  return fetch(
    `https://maker.ifttt.com/trigger/MYPING/with/key/${process.env.IFTTT_KEY}`,
    {
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        value1: website,
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
  if (process.env.CRW_SL === "true") {
    await nm.openSL();
  }
  if (process.env.CRW_LBC === "true") {
    console.log(chalk.yellow.bold(" -> Fetching LBC ..."));
  }
  while (true) {
    if (process.env.CRW_SL === "true") {
      try {
        const slLinks = await nm.getNewAptsSL();
        if (slLinks.length) {
          console.log(slLinks);
          for (let index = 0; index < slLinks.length; index += 1) {
            const data = await nm.scrapSL(slLinks[index]);
            await submit(data);
            await notify(data, "SELOGER");
          }
        }
      } catch (error) {
        console.log(chalk.red.inverse("CRASH SL"));
        console.log(error);
      }
    }
    if (process.env.CRW_LBC === "true") {
      try {
        const ads = await nm.getNewAptsLBC();
        if (ads.length) {
          // console.log(ads);
          for (let index = 0; index < ads.length; index += 1) {
            const data = {
              link: ads[index].url,
              rooms:
                ads[index].attributes[
                  ads[index].attributes.findIndex(e => e.key === "rooms")
                ].value,
              size:
                ads[index].attributes[
                  ads[index].attributes.findIndex(e => e.key === "square")
                ].value,
              price: ads[index].price[0],
              place: ads[index].location.zipcode,
              desc: ads[index].subject,
              specs: ads[index].body,
              tel: "Too complicated",
              agenceAddr: "Not available",
              agenceLink: "Not available",
              agenceName: ads[index].owner.name
            };
            console.log(data);
            await submit(data);
            await notify(data, "LEBONCOIN");
          }
        }
      } catch (error) {
        console.log(chalk.red.inverse("CRASH LBC"));
        console.log(error);
      }
    }
    await clock(10000);
  }
}

main();
