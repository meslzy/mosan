import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { KnownDevices } from "puppeteer";
import puppeteer from "puppeteer-extra";

import { Account } from "./domain/account";
import { Sniper } from "./domain/sniper";
import { registry } from "./services/registry";

const iPhone = KnownDevices["iPhone 15 Pro"];

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: {
    width: iPhone.viewport.width,
    height: iPhone.viewport.height,
    isMobile: true,
    hasTouch: true,
  },
  args: [
    `--window-size=${iPhone.viewport.width},${iPhone.viewport.height + 100}`,
  ],
});

const page = await browser.newPage();

await page.setUserAgent(iPhone.userAgent);
await page.emulate(iPhone);

await page.goto("https://www.ea.com/", {
  waitUntil: "networkidle2",
});

const account = await Account.init(page);
registry.set("account", account);

await page.goto("https://www.ea.com/ea-sports-fc/ultimate-team/web-app", {
  waitUntil: "networkidle2",
});

await page.waitForSelector("button.icon-transfer", {
  visible: true,
  timeout: 0,
});

const sniper = await Sniper.init(page);
registry.set("sniper", sniper);

import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function calculateLowestBuyPrice(salePrice) {
  const tax = salePrice * 0.05;
  const netCoins = salePrice - tax;
  const roundedPrice = Math.floor(netCoins / 100) * 100;
  return roundedPrice;
}

rl.on("line", (input) => {
  const salePrice = parseInt(input);

  if (isNaN(salePrice)) {
    console.log("Please enter a valid number.");
  } else {
    const lowestBuyPrice = calculateLowestBuyPrice(salePrice);
    console.log(`The lowest buy price for selling at ${salePrice} coins is: ${lowestBuyPrice}`);
  }
});
