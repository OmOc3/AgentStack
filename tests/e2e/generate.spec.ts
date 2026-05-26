import { expect, test } from "@playwright/test";

test("shows the homepage", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Start a repo that already knows how agents should work.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Generate a repo" })).toBeVisible();
});

test("walks through the unsigned generator setup", async ({ page }) => {
  await page.goto("/generate");

  await expect(
    page.getByRole("heading", { name: "Generate a repo" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate repo" })).toBeDisabled();

  await page.getByLabel("Project name").fill("playwright-smoke");
  const stackOption = page.getByRole("button", {
    name: /A clean App Router starter/,
  });

  await stackOption.click();

  await expect(stackOption).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Login with GitHub" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate repo" })).toBeDisabled();
});
