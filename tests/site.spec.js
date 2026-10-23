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
      if (r.status() >= 400 && new URL(r.url()).host === "localhost:3000") failed.push(`${r.status()} ${r.url()}`);
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

test("project link navigates to a work page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator('a[href="./work/trigocity"]').first().click();
  await expect(page).toHaveURL(/\/work\/trigocity/);
  await expect(page.getByText("Made in Framer")).toBeHidden();
});
