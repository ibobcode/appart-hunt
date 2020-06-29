require("dotenv").config();
const chalk = require("chalk");
const NavigationManager = require("./navigationManager");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const express = require("express");

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
      body: encodeURI(`entry.${process.env.ENTRY_1_ROOMS}=${data.rooms}&entry.${process.env.ENTRY_2_PLACE}=${data.place}&entry.${process.env.ENTRY_3_DESC}=${data.desc}&entry.${process.env.ENTRY_4_SPECS}=${data.specs}&entry.${process.env.ENTRY_5_PRICE}=${data.price}&entry.${process.env.ENTRY_6_TEL}=${data.tel}&entry.${process.env.ENTRY_7_SIZE}=${data.size}&entry.${process.env.ENTRY_8_AG_ADDR}=${data.agenceAddr}&entry.${process.env.ENTRY_9_AG_LINK}=${data.agenceLink}&entry.${process.env.ENTRY_10_AG_NAME}=${data.agenceName}&entry.${process.env.ENTRY_11_LINK}=${data.link}
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
  // if (process.env.CRW_LBC === "true") {
  //   await nm.openLBC();
  // }
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
if (process.env.ENV === "prod") {
  const app = express();
  app.use(bodyParser.json());

  app.get("/", (x, res) => {
    res.send("Appart hunt is alive!");
  });
  app
    .listen(process.env.ALIVE_PORT, () => {
      console.log(
        chalk.green.inverse(
          ` - ALIVE PAGE IS NOW RUNNING ON PORT ${process.env.ALIVE_PORT} - `
        )
      );
    })
    .on("SERVER ERROR", console.log);
  app.get("/death", (req, res) => {
    res.send("Killing the bot...");
    process.exit();
  });
}
