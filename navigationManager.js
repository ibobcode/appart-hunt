const puppeteer = require("puppeteer");
const chalk = require("chalk");
var mongoose = require("mongoose");
const fetch = require("node-fetch");
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
        `mongodb://${process.env.DBUSER}:${process.env.DBPASS}@ds149954.mlab.com:49954/${process.env.DBNAME}`,
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
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS === "true",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    await this.dbConnect();
    await this.loadBackup();
  }

  async scrapSL(link) {
    console.log(chalk.red.bold(" -> Crawling SL page..."));
    console.log(link);
    await this.pageCrawlSL.goto(link);
    // await this.pageCrawlSL.waitForNavigation();
    await this.pageCrawlSL.waitFor("#js-descriptifBien");
    return await this.pageCrawlSL.evaluate(link => {
      const criterion = [
        ...document.getElementsByClassName("criterion")[0].children
      ].map(e => e.innerText);
      let price = "X";
      if (document.getElementsByClassName("price").length) {
        price = [...document.getElementsByClassName("price")][0].innerText;
      }
      let place = "X";
      if (document.getElementsByClassName("localite").length) {
        place = [...document.getElementsByClassName("localite")][1].innerText;
      }
      let desc = "X";
      if (document.getElementById("js-descriptifBien")) {
        desc = document.getElementById("js-descriptifBien").innerText;
      }
      let specs = "X";
      if (document.getElementsByClassName("criteria-wrapper").length) {
        specs = [...document.getElementsByClassName("criteria-wrapper")].map(
          e => e.innerText
        );
      }
      let tel = "X";
      if (document.getElementsByClassName("btn-phone").length) {
        tel = [...document.getElementsByClassName("btn-phone")][0].dataset
          .phone;
      }
      let agenceAddr = "X";
      if (document.getElementsByClassName("agence-adresse").length) {
        agenceAddr = document.getElementsByClassName("agence-adresse")[0]
          .innerText;
      }
      let agenceLink = "X";
      if (document.getElementsByClassName("agence-link").length) {
        agenceLink = [...document.getElementsByClassName("agence-link")][0]
          .href;
      }
      let agenceName = "X";
      if (document.getElementsByClassName("agence-title").length) {
        agenceName = [...document.getElementsByClassName("agence-title")][0]
          .innerText;
      }
      return {
        link: link.replace(/[\n\r\s]+/g, ""),
        rooms: criterion[0].replace(/\D/g, ""),
        size: criterion[criterion.length - 1].replace(/\D/g, ""),
        price: price.replace(/[\n\r\sC€]+/g, ""),
        place: place.replace(/\D/g, ""),
        desc,
        specs,
        tel,
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
    let ret = await this.pageSL.evaluate(async () => {
      const list = await document.getElementsByName("classified-link");
      const obj = [];
      for (const elem of list) {
        obj.push({ link: elem.href.split("?")[0], type: "sl" });
      }
      return obj;
    });
    ret = ret.filter(
      elem1 =>
        this.linksHistory.findIndex(elem2 => elem1.link === elem2.link) === -1
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
