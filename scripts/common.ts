import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { KnownDevices } from "puppeteer";
import puppeteer from "puppeteer-extra";

const iPhone = KnownDevices["iPhone 15 Pro"];

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: true,
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

const url = new URL("https://www.futbin.com/25/community/tactics-and-formations");

const minLikes = 1;
const maxPages = 3;

interface Tactic {
  code?: string;
  formation?: string;
  buildUpStyle?: string;
  defenseStyle?: string;
  likes?: number;
  dislikes?: number;
}

const fetchTactics = async (pageNumber: number = 1) => {
  console.log(`Fetching page ${pageNumber}...`);

  url.searchParams.set("page", String(pageNumber));

  await page.goto(url.toString(), {
    waitUntil: "networkidle2",
  });

  const list = await page.$$("table.community-tactics-table > tbody > tr");

  if (list.length === 0) {
    return [];
  }

  const tactics: Tactic[] = [];

  for (const row of Array.from(list)) {
    const details = await row.$$("td.text-center");

    const code = await details[0]?.evaluate((node) => node.textContent.trim());
    const formation = await details[1]?.evaluate((node) => {
      return node.querySelector("figcaption")?.textContent.trim();
    });
    
    const buildUpStyle = await details[2]?.evaluate((node) => node.textContent.trim());
    const defenseStyle = await details[3]?.evaluate((node) => node.textContent.trim());

    const [like, dislike] = await details.at(-1).evaluate((node) => {
      const spans = node.querySelectorAll("span");
      const like = spans[0].textContent.trim();
      const dislike = spans[1].textContent.trim();
      return [like, dislike];
    });

    if (Number(like) < minLikes) {
      continue;
    }

    tactics.push({
      code,
      formation,
      buildUpStyle,
      defenseStyle,
      likes: Number(like),
      dislikes: Number(dislike),
    });
  }

  if (pageNumber < maxPages) {
    return tactics.concat(
      await fetchTactics(pageNumber + 1),
    );
  }

  return tactics;
};

const displayTactics = (tactics: Tactic[]) => {
  console.log("All Tactics:", tactics);

  // Find the tactic with the highest likes
  const mostLikedTactic = tactics.reduce((prev, current) => {
    return (prev.likes || 0) > (current.likes || 0) ? prev : current;
  });

  console.log("Most Liked Tactic:", mostLikedTactic);

  // Count formations, buildUpStyles, and defenseStyles
  const formationCount: { [key: string]: number; } = {};
  const buildUpStyleCount: { [key: string]: number; } = {};
  const defenseStyleCount: { [key: string]: number; } = {};

  for (const tactic of tactics) {
    if (tactic.formation) {
      formationCount[tactic.formation] = (formationCount[tactic.formation] || 0) + 1;
    }
    if (tactic.buildUpStyle) {
      buildUpStyleCount[tactic.buildUpStyle] = (buildUpStyleCount[tactic.buildUpStyle] || 0) + 1;
    }
    if (tactic.defenseStyle) {
      defenseStyleCount[tactic.defenseStyle] = (defenseStyleCount[tactic.defenseStyle] || 0) + 1;
    }
  }

  // Find the most used formation
  const mostUsedFormation = Object.entries(formationCount).reduce((prev, current) => {
    return (prev[1] > current[1]) ? prev : current;
  });

  console.log("Most Used Formation:", mostUsedFormation);

  // Find the most used buildUpStyle
  const mostUsedBuildUpStyle = Object.entries(buildUpStyleCount).reduce((prev, current) => {
    return (prev[1] > current[1]) ? prev : current;
  });

  console.log("Most Used Build Up Style:", mostUsedBuildUpStyle);

  // Find the most used defenseStyle
  const mostUsedDefenseStyle = Object.entries(defenseStyleCount).reduce((prev, current) => {
    return (prev[1] > current[1]) ? prev : current;
  });

  console.log("Most Used Defense Style:", mostUsedDefenseStyle);
};

const tactics = await fetchTactics();
displayTactics(tactics);

await browser.close();
