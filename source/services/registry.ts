import { Account } from "~/domain/account";
import { Sniper } from "~/domain/sniper";

interface Registry {
  account: Account;
  sniper: Sniper;
}

const registry = new Map<keyof Registry, Registry[keyof Registry]>();

export { 
  registry,
};
