import { chromium } from "playwright";
import fs from "fs";
const SP = fs.readFileSync(".sp.tmp","utf8").trim();
const B = "http://localhost:3100";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 375, height: 800 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("PAGEERR:", e.message.slice(0, 300)));
p.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 200)); });
const shot = (n, full = true) => p.screenshot({ path: `${SP}/${n}.png`, fullPage: full });
async function login(who) {
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByTestId("demo-" + who).click();
  await p.waitForURL(/board|admin/);
  await p.waitForLoadState("networkidle");
}
async function claim(answers, name) {
  await p.goto(B + "/items/22222222-aaaa-4aaa-8aaa-0000000a0413", { waitUntil: "networkidle" });
  await p.getByTestId("claim-start").click();
  await p.waitForURL(/claim\//);
  await p.getByTestId("claim-prompt-1").waitFor();
  for (let i = 0; i < 3; i++) await p.getByTestId(`claim-prompt-${i+1}`).fill(answers[i]);
  await shot(name + "-form");
  await p.getByTestId("claim-submit").click();
  await p.waitForTimeout(900);
  await shot(name + "-mid");
  await p.getByTestId("claim-result").waitFor({ timeout: 8000 });
  await p.waitForTimeout(900);
  await shot(name + "-result");
}
await login("mallory");
await shot("board");
await claim(["a blue sky", "nothing special", "no idea"], "mallory");
await ctx.clearCookies();
await p.evaluate(() => sessionStorage.clear().valueOf());
await b.close();
