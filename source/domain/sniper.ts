import {execSync} from "node:child_process";
import {setTimeout} from "node:timers/promises";

import { Page } from "puppeteer";

import { registry } from "~/services/registry";
import { range, Range, randomRange } from "~/utils/range";

import { Account } from "./account";

declare global {
  interface Window {
    settings: Settings;
    setSettings: (settings: Settings) => void;
    startSniper: () => void;
    stopSniper: () => void;
  }
}

interface Settings {
  cycle: Range;
  pauseCycle: Range;
  searchDelay: Range;
  delayAfterBid: Range;
  sell: boolean;
  sellFor: number;
}

class Counter {
  page: Page;
  id: string;

  start: number = 0;
  end: number | null = null;

  get isComplete() {
    return this.start === this.end;
  }

  constructor(page: Page, id: string) {
    this.page = page;
    this.id = id;
  }

  setCounter = (start: number, end: number | null) => {
    this.start = start;
    this.end = end;
    this.display();
  };

  format = () => {
    if (this.end !== null) {
      return `${this.start}/${this.end}`;
    }

    return `${this.start}`;
  };

  display = () => {
    const format = this.format();

    this.page.evaluate((id: string, format: string) => {
      const element = document.getElementById(id);
      const label = element.dataset.label;
      if (element) {
        element.textContent = `${label}: ${format}`;
      }
    }, this.id, format);
  };

  increment = () => {
    this.start++;
    this.display();
  };

  reset = () => {
    this.start = 0;
    this.display();
  };
}

class Timer {
  page: Page;
  id: string;

  private interval: NodeJS.Timeout | null = null;

  constructor(page: Page, id: string) {
    this.page = page;
    this.id = id;
  }

  private format = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    if (hours > 0) {
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
      return `${formattedMinutes}:${formattedSeconds}`;
    }
  };

  private display = (seconds: number) => {
    const format = this.format(seconds);

    this.page.evaluate((id: string, format: string) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = format;
      }
    }, this.id, format);
  };

  start = () => {
    let seconds = 0;

    this.display(seconds);

    this.interval = setInterval(() => {
      this.display(seconds);
      seconds++;
    }, 1000);
  };

  stop = () => {
    if (this.interval) {
      clearInterval(this.interval);
    }
  };
}

const minBids = [150, 200, 250, 300, 350, 400, 450, 500, 550, 600];
const minBidsLen = minBids.length;

function randomMaxBid() {
  var _0x490175 = Math.round(Math.random() * 10) * 1000 * (Math.random() > 0.5 ? 100 : Math.random() > 0.5 ? 10 : 1);
  var _0x3056e0 = Math.random() > 0.5 ? 14000000 + _0x490175 : 14000000 - _0x490175;
  return _0x3056e0;
}

class Sniper {
  page: Page;

  account: Account;

  state: "idle" | "searching" = "idle";

  cycleCounter: Counter;
  winCounter: Counter;
  lossCounter: Counter;
  errorCounter: Counter;

  searchCounter: Counter;
  searchTimer: Timer;

  settings: Settings = {
    cycle: range(30, 60),
    pauseCycle: range(2000, 6000),
    searchDelay: range(500, 3000),
    delayAfterBid: range(2000, 6000),
    sell: false,
    sellFor: 0,
  };

  private beep = () => {
    execSync("[console]::beep(1000, 300)", {
      shell: "powershell",
    });
  };
    
  private constructor(page: Page) {
    this.page = page;

    this.account = registry.get("account") as Account;

    this.cycleCounter = new Counter(page, "mosan-cycle");
    this.winCounter = new Counter(page, "mosan-win");
    this.lossCounter = new Counter(page, "mosan-loss");
    this.errorCounter = new Counter(page, "mosan-error");

    this.searchCounter = new Counter(page, "mosan-search");
    this.searchTimer = new Timer(page, "mosan-timer");
  }
    
  static async init(page: Page): Promise<Sniper> {
    return new Sniper(page).init();
  }

  startSniper = async () => {
    console.log("Starting sniper");
    this.state = "searching";

    let cycle = randomRange(this.settings.cycle);
    let pauseCycle = randomRange(this.settings.pauseCycle);

    this.cycleCounter.setCounter(0, cycle);

    this.winCounter.reset();
    this.lossCounter.reset();
    this.errorCounter.reset();
    this.searchTimer.start();
    this.searchCounter.reset();

    let counter = 0;

    let maxBid = randomMaxBid();

    const search = async () => {
      counter += 1;
      maxBid -= 1000;

      if (this.state !== "searching") {
        return;
      }

      if (this.cycleCounter.isComplete) {
        await setTimeout(pauseCycle);
        cycle = randomRange(this.settings.cycle);
        pauseCycle = randomRange(this.settings.pauseCycle);
        this.cycleCounter.setCounter(0, cycle);
      }

      if (this.state !== "searching") {
        return;
      }

      await this.page.evaluate(() => {
        // @ts-ignore
        services.Item.clearTransferMarketCache();
      });
      const searchButton = await this.page.$("button.call-to-action");
      await searchButton.tap();

      this.searchCounter.increment();
      this.cycleCounter.increment();
    };

    const afterSearch = async () => {
      if (this.state !== "searching") {
        return;
      }

      const shield = await this.page.$("div.ut-click-shield");
      const title = await this.page.$("h1.title");

      while (true) {
        const isShowing = await shield.evaluate((el) => el.classList.contains("showing"));

        if (isShowing) {
          continue;
        }

        const isTitleShowing = await title.evaluate((el) => el.textContent);

        if (isTitleShowing === "Search Results") {
          const backButton = await this.page.$("button.ut-navigation-button-control");
          await backButton.tap();
        } else {
          break;
        }
      }

      let minBid = minBids[counter - 1];

      await this.page.evaluate((minBid, maxBid) => {
        // @ts-ignore
        let searchCriteria = getAppMain().getRootViewController().getPresentedViewController().getCurrentViewController().getCurrentController().viewmodel.searchCriteria as any;
        searchCriteria.minBid = minBid;
        searchCriteria.maxBid = maxBid;
      }, minBid, maxBid);

      if (counter % minBidsLen === 0) {
        counter = 0;
      }

      await setTimeout(randomRange(this.settings.searchDelay));

      await search();
    };

    await this.page.setCacheEnabled(false);
    await this.page.setRequestInterception(true);

    this.page.on("request", async (request) => {
      if (this.state !== "searching") {
        this.page.removeAllListeners("request");
        return;
      }

      const url = request.url();
      const method = request.method();

      const type = request.resourceType();

      if (type === "image" || type === "stylesheet" || type === "font") {
        return request.abort();
      }

      if (!url.includes("fc25/transfermarket")) {
        return request.continue();
      }

      if (method !== "GET") {
        return request.continue();
      }

      const randomID = Math.random().toString(36).substring(7);
      const randomKey = Math.random().toString(36).substring(7);

      const parsed = new URL(url);

      parsed.searchParams.append(randomID, randomKey);

      return request.continue({
        url: parsed.href,
        headers: {
          ...request.headers(),
          "Cache-Control": "no-cache",
        },
      });
    });

    this.page.on("response", async (response) => {
      if (this.state !== "searching") {
        this.page.removeAllListeners("response");
        return;
      }

      if (!(response.url().includes("fc25/transfermarket"))) {
        return;
      }

      if (response.status() === 200 && response.headers()["content-type"]) {
        const { auctionInfo } = await response.json();

        if (auctionInfo.length === 0) {
          await afterSearch();
          return;
        }

        if (auctionInfo.length > 3) {
          await afterSearch();
          return;
        }

        const auction = auctionInfo.reduce((prev, current) => {
          if (prev === null) {
            return current;
          }

          if (current.buyNowPrice < prev.buyNowPrice) {
            return current;
          }

          return prev;
        }, null);

        const url = `https://${this.account.config.utasAuthHost}/ut/game/fc25/trade/${auction.tradeId}/bid`;
        
        const status = await this.page.evaluate(async (url, tradeId, buyNowPrice, sid) => {
          return new Promise<any>(async (resolve) => {
            try {
              const response = await fetch(url, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "x-ut-sid": sid,
                },
                body: JSON.stringify({
                  bid: buyNowPrice,
                }),
              });

              if (response.ok) {
                const {auctionInfo} = await response.json();

                const {itemData} = auctionInfo.find((item: any) => item.tradeId === tradeId);

                return resolve({
                  ok: true,
                  id: itemData.id,
                  message: `Successfully bid: ${itemData.id}@${buyNowPrice}`,
                });
              }

              return resolve({
                ok: false,
                message: `Failed to bid: ${response.status} for ${buyNowPrice}`,
              });
            } catch (error: unknown) {
              if (error instanceof Error) {
                return resolve({
                  ok: false,
                  message: error.message,
                });
              }

              return resolve({
                ok: false,
                message: "An error occurred while bidding",
              });
            }
          });
        }, url, auction.tradeId, auction.buyNowPrice, this.account.auth.sid);

        console.log(status.ok, status.message);

        if (status.ok) {
          this.beep();
          this.winCounter.increment();
          await setTimeout(randomRange(this.settings.delayAfterBid));

          if (this.settings.sell) {
            const itemUrl = `https://${this.account.config.utasAuthHost}/ut/game/fc25/item`;

            const itemStatus = await this.page.evaluate(async (itemUrl, id, sid) => {
              return new Promise<any>(async (resolve) => {
                try {
                  const response = await fetch(itemUrl, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "x-ut-sid": sid,
                    },
                    body: JSON.stringify({
                      "itemData": [
                        {
                          "id": id,
                          "pile": "trade",
                        },
                      ],
                    }),
                  });

                  if (response.ok) {
                    const { itemData } = await response.json();

                    const item = itemData.find((item: any) => item.id === id);

                    if (item.success) {
                      return resolve({
                        ok: true,
                        message: "Successfully put in trade pile",
                      });
                    }

                    return resolve({
                      ok: false,
                      message: `Failed to put in trade pile: ${item.reason}@${item.errorCode}`,
                    });
                  }

                  return resolve({
                    ok: false,
                    message: `Failed to put in trade pile: ${response.status}`,
                  });
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    return resolve({
                      ok: false,
                      message: error.message,
                    });
                  }

                  return resolve({
                    ok: false,
                    message: "An error occurred while listing",
                  });
                }
              });
            }, itemUrl, status.id, this.account.auth.sid);

            console.log(itemStatus.ok, itemStatus.message);

            if (itemStatus.ok) {
              const auctionhouseUrl = `https://${this.account.config.utasAuthHost}/ut/game/fc25/auctionhouse`;

              const auctionhouseStatus = await this.page.evaluate(async (auctionhouseUrl, id, sellFor, sid) => {
                return new Promise<any>(async (resolve) => {
                  try {
                    const response = await fetch(auctionhouseUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "x-ut-sid": sid,
                      },
                      body: JSON.stringify({
                        "buyNowPrice": sellFor,
                        "startingBid": sellFor - 100,
                        "duration": 3600,
                        "itemData": {
                          id: id,
                        },
                      }),
                    });

                    if (response.ok) {
                      return resolve({
                        ok: true,
                        message: `Successfully listed: ${sellFor}`,
                      });
                    }

                    return resolve({
                      ok: false,
                      message: `Failed to list: ${response.status}`,
                    });
                  } catch (error: unknown) {
                    if (error instanceof Error) {
                      return resolve({
                        ok: false,
                        message: error.message,
                      });
                    }

                    return resolve({
                      ok: false,
                      message: "An error occurred while listing",
                    });
                  }
                });
              }, auctionhouseUrl, status.id, this.settings.sellFor, this.account.auth.sid);

              console.log(auctionhouseStatus.ok, auctionhouseStatus.message);

              await setTimeout(randomRange(this.settings.delayAfterBid));
            }
          }
        } else {
          this.lossCounter.increment();
        }

        await afterSearch();
        return;
      }

      if (response.status() === 429) {
        console.log("Transfermarket -> 429");
        await this.stopSniper();
        return;
      }
    });

    await search();
  };

  stopSniper = async () => {
    console.log("Stopping sniper");
    this.state = "idle";
    this.page.removeAllListeners("request");
    this.page.removeAllListeners("response");
    await this.page.setCacheEnabled(true);
    await this.page.setRequestInterception(false);
    this.searchTimer.stop();
  };

  loadSniper = async () => {
    await this.page.evaluate((settings: Settings) => {
      window.settings = settings;
    }, this.settings);

    await this.page.exposeFunction("setSettings", (settings: Settings) => {
      console.log("Settings updated", settings);
      this.settings = settings;
    });

    await this.page.exposeFunction("startSniper", this.startSniper.bind(this));
    await this.page.exposeFunction("stopSniper", this.stopSniper.bind(this));

    await this.page.addScriptTag({ 
      path: "public/js/sniper.js",
    });
    await this.page.addStyleTag({ 
      path: "public/css/sniper.css",
    });
  };

  init = async () => {
    await this.loadSniper();
    return this;
  };
}

export {
  Sniper,
};
