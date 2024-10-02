import fs from "node:fs";
import path from "node:path";

import { Page } from "puppeteer";

const root = path.join(process.cwd(), ".session");
const localStoragePath = path.join(root, "localStorage.json");

interface Auth {
  protocol: "https";
  ipPort: string;
  serverTime: string;
  lastOnlineTime: string;
  sid: string;
  phishingToken: string;
}

interface Config {
  changelist: string;
  eadpClientId: string;
  eadpClientSecret: string;
  eadpConnectHost: string;
  eadpPortalHost: string;
  eadpProxyHost: string;
  eadpReleaseType: string;
  funCaptchaPublicKey: string;
  localStorageVersion: number;
  msAuthHost: string;
  msClientId: string;
  msRedirectUri: string;
  msSandboxId: string;
  msStoreHost: string;
  originCss: string;
  originHost: string;
  originJS: string;
  originMasterTitle: string;
  originProfile: string;
  pinURL: string;
  psnG4ClientId: string;
  psnG5ClientId: string;
  psnOAuthHost: string;
  psnOAuthPath: string;
  psnG4ProductId: string;
  psnG5ProductId: string;
  psnRedirectUri: string;
  psnStoreHost: string;
  requestTimeout: number;
  resourceBase: string;
  resourceRoot: string;
  settingsRefreshInterval: number;
  utasAuthHost: string;
  utasAuthProtocol: string;
  fcasAuthHost: string;
  fcasAuthProtocol: string;
  fpOverlayChangeInterval: number;
  verboseLogging: boolean;
}

class Account {
  page: Page;

  auth: Auth;
  config: Config;

  constructor(page: Page) {
    this.page = page;
  }

  static init(page: Page) {
    return new Account(page).init();
  }

  loadSession = async () => {
    if (!fs.existsSync(root)) {
      return;
    }
  
    const localStorageJson = JSON.parse(fs.readFileSync(localStoragePath, "utf-8"));
  
    await this.page.evaluate((localStorageJson) => {
      for (const [key, value] of Object.entries(localStorageJson)) {
        localStorage[key] = value;
      }
    }, localStorageJson);
  };

  saveSession = async () => {
    const localStorageJson = await this.page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(localStoragePath, localStorageJson);
  };

  async init() {
    console.log("Loading session");
    await this.loadSession();

    this.page.on("response", async (response) => {
      if (response.url().includes("connect/auth?client_id=FUTWEB_BK_OL_SERVER")) {
        console.log("Saving session");
        await this.saveSession();
      }

      if (
        response.url().includes("config/config.json") &&
        response.status() === 200 &&
        response.headers()["content-type"] 
      ) {
        this.config = await response.json();
        console.log({ config: this.config });
      }
  
      if (
        response.url().includes("ut/auth") &&
        response.status() === 200 &&
        response.headers()["content-type"] 
      ) {
        this.auth = await response.json();
        console.log({ auth: this.auth });
      }
    });

    return this;
  }
}

export {
  Account,
};
