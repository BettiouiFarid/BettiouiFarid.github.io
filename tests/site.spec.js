const { test, expect } = require("@playwright/test");

const pages = [
  "/",
  "/projects",
  "/work/trigocity",
  "/work/buzzline-branding",
  "/work/s412",
  "/blog/color-theory-in-design",
  "/blog/sandwiches-and-lemon-juice",
  "/blog/my-awesome-daily-routine",
  "/blog/relaxing-sounds-of-nature",
  "/blog/building-portfolio-website",
];

for (const url of pages) {
  test(`${url} loads with no Framer badge and no broken assets`, async ({ page }) => {
    const failed = [];
    page.on("response", (r) => {
      if (r.status() >= 400 && new URL(r.url()).origin === new URL(page.url()).origin) failed.push(`${r.status()} ${r.url()}`);
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500); // let Framer hydrate and run appear animations

    // A blank page is a failure: the hydrated site must show real text
    const text = await page.locator("#main").innerText();
    expect(text.trim().length, "page renders content").toBeGreaterThan(50);

    await expect(page.getByText("Made in Framer")).toBeHidden();
    await expect(page.locator(".__framer-badge:visible")).toHaveCount(0);
    expect(failed, "broken local assets").toEqual([]);
    expect(errors, "page errors").toEqual([]);

    const brokenImages = await page.$$eval("img", (imgs) =>
      imgs.filter((i) => i.complete && i.getAttribute("src") && i.naturalWidth === 0).map((i) => i.src)
    );
    expect(brokenImages).toEqual([]);
  });
}

test("home page shows the main content", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText("FARID BETTIOUI").first()).toBeVisible();
  await expect(page.getByText("LATEST PROJECTS").first()).toBeAttached();
  await expect(page.getByText("STORIES").first()).toBeAttached();
  await expect(page.locator('a[href^="mailto:Contact@faridbettioui.art"]').first()).toBeAttached();
  await page.screenshot({ path: "test-results/home.png" });
});

test("footer shows Doha and 2026", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const text = await page.locator("#main").innerText();
  expect(text).toContain("Doha, Qatar");
  expect(text).toMatch(/© 2026/);
  expect(text).not.toContain("Mostaganem");
  expect(text).not.toMatch(/© 2024/);
});

test("layout fills wide screens", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "wide", "only on the 2560px project");
  for (const url of ["/", "/projects", "/work/trigocity"]) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    // the design's 1208px container should grow to ~84% of the viewport
    const stuck = await page.$$eval("#main *", (els) =>
      els.filter((el) => Math.round(el.getBoundingClientRect().width) === 1208).length
    );
    expect(stuck, `${url} has fixed 1208px containers`).toBe(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, `${url} scrolls horizontally`).toBeLessThanOrEqual(0);
  }
});

test("project link navigates to a work page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator('a[href="./work/trigocity"]').first().click();
  await expect(page).toHaveURL(/\/work\/trigocity/);
  await expect(page.getByText("Made in Framer")).toBeHidden();
});
