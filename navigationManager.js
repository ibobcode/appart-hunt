const puppeteer = require("puppeteer");
const chalk = require("chalk");
var mongoose = require("mongoose");
const fetch = require("node-fetch");
const fs = require("fs");
var Schema = mongoose.Schema;

var aptsLinksSchema = new Schema({
  link: String
});

module.exports = class NavigationManager {
  constructor() {
    console.log(chalk.green.inverse(" - NAVIGATION MANAGER CREATED - "));
    this.aptsLinksModel = mongoose.model("AptsLinks", aptsLinksSchema);
    this.linksHistory = [];
  }

  dbConnect() {
    return new Promise((res, rej) => {
      mongoose.connect(
        `mongodb://${process.env.DBUSER}:${process.env.DBPASS}@${process.env.DBURL}:${process.env.DBPORT}/${process.env.DBNAME}`,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useFindAndModify: false
        }
      );
      this.db = mongoose.connection;
      this.db.on("error", err => {
        console.log(chalk.red.inverse(" - DB MANAGER FAILED - "));
        console.log(err);
        this.online = false;
        return rej();
      });
      this.db.once("open", () => {
        console.log(chalk.green.inverse(" - DATABASE CONNECTED - "));
        this.online = true;
        return res();
      });
    });
  }

  async aptsLinkCOU(elem) {
    await this.aptsLinksModel.findOneAndUpdate({ link: elem.link }, elem, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });
  }

  async loadBackup() {
    this.linksHistory = await this.aptsLinksModel.find({});
  }

  async init() {
    console.log(chalk.cyan.bold(" -> Opening browser..."));
    const options = {
      headless: process.env.HEADLESS === "true",
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      ignoreHTTPSErrors: true,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--window-size=${process.env.WIDTH},${process.env.HEIGHT}`,
        '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3803.0 Safari/537.36',
        // THIS IS THE KEY BIT!
        '--lang=en-US,en;q=0.9',
      ],
    };
    this.browser = await puppeteer.launch(options);
    await this.dbConnect();
    await this.loadBackup();
  }

  async scrapSL(link) {
    console.log(chalk.red.bold(" -> Crawling SL page..."));
    console.log(link);
    await this.pageCrawlSL.goto(link);
    // await this.pageCrawlSL.waitForNavigation();
    await this.pageCrawlSL.waitFor("#showcase-description");
    // await this.pageCrawlSL.click(".fHossp");
    await this.pageCrawlSL.evaluate(() => {
      if (document.getElementsByClassName("kCjgMH").length) {
        document.getElementsByClassName("kCjgMH")[0].click();
      }
    })
    // throw "error";
    return await this.pageCrawlSL.evaluate(link => {
      const criterion = [
        ...document.getElementsByClassName("fPPqhN")[0].children // Summarystyled__TagsWrapper-tzuaot-19
      ].map(e => e.innerText);
      let price = "X";
      if (document.getElementsByClassName("dVzJN").length) {
        price = [...document.getElementsByClassName("dVzJN")][0].innerText;
      }
      let place = "X";
      if (document.getElementsByClassName("jqlODu").length) { // Summarystyled__Address-tzuaot-5
        place = [...document.getElementsByClassName("jqlODu")][0].innerText;
      }
      let desc = "X";
      if (document.getElementsByClassName("hCeOyd").length) { // howMoreText__UITextContainer-sc-5ggbbc-0
        desc = [...document.getElementsByClassName("hCeOyd")][0].children[0].innerText;
      }
      let specs = "X";
      if (document.getElementsByClassName("gmBAMk").length) { // GeneralList__Item-sc-9gtpjm-1
        specs = [...document.getElementsByClassName("gmBAMk")].map(
          e => e.innerText
        ).join("\n");
      }
      let tel = "X";
      if (document.getElementsByClassName("kCjgMH").length) {
        tel = [...document.getElementsByClassName("kCjgMH")][0].innerText;
      }
      let agenceAddr = "X";
      if (document.getElementsByClassName("gFrVwI").length) { // Agency__Text-sc-1rsw64j-2
        agenceAddr = document.getElementsByClassName("gFrVwI")[0]
          .innerText;
      }
      let agenceLink = "X";
      if (document.getElementsByClassName("iSQNRR").length) { // SummaryLinkList__Link-sc-1bymgzc-1
        agenceLink = [...document.getElementsByClassName("iSQNRR")][0]
          .href;
      }
      let agenceName = "X";
      if (document.getElementsByClassName("ijpEfR").length) { // Summarycommonstyled__Title-axkat0-0 Agency__Title-sc-1rsw64j-0
        agenceName = [...document.getElementsByClassName("ijpEfR")][0]
          .innerText;
      }
      let preview = "https://i.redd.it/dbbya6buovw01.jpg";
      if (document.getElementsByClassName("SliderPhotos__LazyImage-sc-1ccxqd2-1 SliderPhotos__Image-sc-1ccxqd2-2").length) {
        const img = document.getElementsByClassName('SliderPhotos__LazyImage-sc-1ccxqd2-1 SliderPhotos__Image-sc-1ccxqd2-2')[0],
          style = img.currentStyle || window.getComputedStyle(img, false);
        preview = style.backgroundImage.slice(4, -1).replace(/"/g, "");
      }
      return {
        link: link,
        preview,
        rooms: criterion[0].replace(/\D/g, ""),
        size: criterion[criterion.length - 1].replace(/[^0-9$.,]/g, ""),
        price: price.replace(/[\n\r\sC€]+/g, ""),
        place: place.replace(/\D/g, ""),
        desc,
        specs,
        tel: tel.replace(/[\n\r\s]+/g, "").match(/.{1,2}/g).join("."),
        agenceAddr: agenceAddr.replace(/[\n\r\s]+/g, ""),
        agenceLink: agenceLink.replace(/[\n\r\s]+/g, ""),
        agenceName: agenceName.replace(/[\n\r\s]+/g, "")
      };
    }, link);
  }

  async openSL() {
    this.pageSL = await this.browser.newPage();
    console.log(chalk.red.bold(" -> New Page Seloger"));
    await this.pageSL.goto(
      `https://www.seloger.com/list_beta.htm${process.env.SL_SEARCH}`
    );
    this.pageCrawlSL = await this.browser.newPage();
    console.log(chalk.red.bold(" -> New Crawlpage Seloger"));
  }

  async openLBC() {
    this.pageLBC = await this.browser.newPage();
    console.log(chalk.orange.bold(" -> New Page Leboncoin"));
    await this.pageLBC.goto(
      `https://www.leboncoin.fr/recherche/${process.env.LBC_SEARCH_URL}`
    );
    this.pageCrawlLBC = await this.browser.newPage();
    console.log(chalk.orange.bold(" -> New Crawlpage Leboncoin"));
  }

  async fetchLbc() {
    return fetch("https://api.leboncoin.fr/finder/search", {
      headers: {
        "content-type": "application/json",
        "sec-fetch-mode": "cors"
      },
      body: process.env.LBC_SEARCH,
      method: "POST"
    })
      .then(a => a.text())
      .then(a => {
        const res = JSON.parse(a);
        return res.ads;
      });
  }

  async getNewAptsSL() {
    await this.pageSL.reload();
    let evl = await this.pageSL.evaluate(async () => {
      const list = await document.getElementsByName("classified-link");
      const obj = [];
      for (const elem of list) {
        obj.push({ link: elem.href.split("?")[0], type: "sl" });
      }
      return obj;
    });
    // await this.pageSL.screenshot({ path: 'areyouheadless.png' });
    const ret = evl.filter(
      elem1 =>
        this.linksHistory.findIndex(elem2 => elem1.link === elem2.link) == -1
    );
    ret.forEach(elem => this.aptsLinkCOU(elem));
    this.linksHistory = ret.concat(this.linksHistory);
    if (ret.length !== 0) {
      console.log(chalk.green.bold(" -> New appt !"));
    }
    return ret.map(elem => elem.link);
  }

  async getNewAptsLBC() {
    let ret = await this.fetchLbc();
    ret = ret.filter(
      elem1 =>
        this.linksHistory.findIndex(elem2 => elem1.url === elem2.link) === -1
    );
    ret.forEach(elem => this.aptsLinkCOU({ link: elem.url, type: "lbc" }));
    this.linksHistory = ret
      .map(a => ({ link: a.url, type: "lbc" }))
      .concat(this.linksHistory);
    if (ret.length !== 0) {
      console.log(chalk.green.bold(" -> New appt !"));
    }
    return ret;
  }
};
