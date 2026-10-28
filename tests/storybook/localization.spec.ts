import { expect, test } from "@playwright/test";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test("Console language switch keeps original log payload and updates translated chrome", async ({ page }) => {
  await page.goto(story("console-internationalization--locales"));
  const locale = page.getByLabel("Locale");
  const consoleRoot = page.locator(".console-panel");

  await expect(consoleRoot).toHaveAttribute("lang", "es-MX");
  await expect(page.getByText("Application started")).toBeVisible();
  await locale.selectOption("fr-CA");
  await expect(consoleRoot).toHaveAttribute("lang", "fr-CA");
  await expect(page.getByText("Application started")).toBeVisible();

  await locale.selectOption("pt-BR");
  await expect(consoleRoot).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByText("Application started")).toBeVisible();

  await locale.selectOption("de");
  await expect(consoleRoot).toHaveAttribute("lang", "de");
  await expect(page.getByText("Application started")).toBeVisible();

  await page.getByLabel("Override action labels").check();
  await expect(page.getByRole("button", { name: "My custom actions" })).toBeVisible();
});

test("custom JSON translations are applied without changing messages", async ({ page }) => {
  await page.goto(story("console-internationalization--custom-json"));
  await expect(page.locator(".console-panel")).toHaveAttribute("lang", "de-DE");
  await expect(page.getByText("This log payload remains unchanged.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Konsolenaktionen" })).toBeVisible();
});

test("RTL direction and Arabic labels are applied to the console", async ({ page }) => {
  await page.goto(story("console-internationalization--rtl"));
  const root = page.locator(".console-panel");
  await expect(root).toHaveAttribute("lang", "ar-EG");
  await expect(root).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("مرحبا بالعالم")).toBeVisible();
});

test("filtering addon switches independently and preserves output", async ({ page }) => {
  await page.goto(story("console-addons-filtering--localized"));
  const locale = page.getByLabel("Locale");
  await expect(page.getByRole("search", { name: "Filtros de la consola" })).toBeVisible();
  await locale.selectOption("en-US");
  await expect(page.getByRole("search", { name: "Console filters" })).toBeVisible();
  await locale.selectOption("fr-CA");
  await expect(page.getByRole("search", { name: "Filtres de la console" })).toBeVisible();
  await locale.selectOption("pt-BR");
  await expect(page.getByRole("search", { name: "Filtros do console" })).toBeVisible();
  await expect(page.getByText("Request complete")).toBeVisible();
});

test("search addon switches labels and keeps original messages", async ({ page }) => {
  await page.goto(story("console-addons-search--localized"));
  const locale = page.getByLabel("Addon language");
  await expect(page.getByRole("region", { name: "Buscar en la consola" })).toBeVisible();
  await locale.selectOption("en");
  await expect(page.getByRole("region", { name: "Console search" })).toBeVisible();
  await locale.selectOption("fr-CA");
  await expect(page.getByRole("region", { name: "Recherche dans la console" })).toBeVisible();
  await locale.selectOption("pt-PT");
  await expect(page.getByRole("region", { name: "Pesquisar no console" })).toBeVisible();
  await expect(page.getByText("Searchable message")).toBeVisible();
});

test("export addon updates action labels across locales", async ({ page }) => {
  await page.goto(story("console-addons-data-export--localized"));
  const locale = page.getByLabel("Addon language");
  await expect(page.getByText("Open actions to see localized export commands")).toBeVisible();
  await locale.selectOption("fr-CA");
  await expect(page.getByText("Open actions to see localized export commands")).toBeVisible();
  await expect(page.locator(".console-panel")).toHaveAttribute("lang", "fr-CA");
});

test("Console en, es and fr show their own translated action labels", async ({ page }) => {
  await page.goto(story("console-internationalization--locales"));
  const locale = page.getByLabel("Locale");
  const cases = [
    { locale: "en", actions: "Console actions" },
    { locale: "es-MX", actions: "Acciones de la consola" },
    { locale: "fr-CA", actions: "Actions de la console" },
    { locale: "pt-BR", actions: "Ações do console" },
  ];
  for (const entry of cases) {
    await locale.selectOption(entry.locale);
    await expect(page.locator(".console-panel")).toHaveAttribute("lang", entry.locale);
    await expect(page.getByRole("button", { name: entry.actions })).toBeVisible();
    await expect(page.getByText("Application started")).toBeVisible();
  }
});

test("filtering addon en, es, fr and pt translate options while preserving logs", async ({ page }) => {
  await page.goto(story("console-addons-filtering--localized"));
  const locale = page.getByLabel("Locale");
  for (const entry of [
    { locale: "en-US", name: "Console filters" },
    { locale: "es-MX", name: "Filtros de la consola" },
    { locale: "fr-CA", name: "Filtres de la console" },
    { locale: "pt-BR", name: "Filtros do console" },
  ]) {
    await locale.selectOption(entry.locale);
    await expect(page.getByRole("search", { name: entry.name })).toBeVisible();
    await expect(page.getByText("Request complete")).toBeVisible();
  }
});

test("search addon en, es, fr and pt translate independently", async ({ page }) => {
  await page.goto(story("console-addons-search--localized"));
  const locale = page.getByLabel("Addon language");
  for (const entry of [
    { locale: "en", name: "Console search" },
    { locale: "es-MX", name: "Buscar en la consola" },
    { locale: "fr-CA", name: "Recherche dans la console" },
    { locale: "pt-PT", name: "Pesquisar no console" },
  ]) {
    await locale.selectOption(entry.locale);
    await expect(page.getByRole("region", { name: entry.name })).toBeVisible();
    await expect(page.getByText("Searchable message")).toBeVisible();
  }
});

test("localized filtering controls retain filter state across language changes", async ({ page }) => {
  await page.goto(story("console-addons-filtering--localized"));
  const locale = page.getByLabel("Locale");
  const filter = page.getByRole("search", { name: "Filtros de la consola" });
  const input = filter.getByRole("searchbox");
  await input.fill("Request failed");
  await expect(page.getByText("Request failed")).toBeVisible();
  await expect(page.getByText("Request complete")).toHaveCount(0);

  await locale.selectOption("fr-CA");
  const translatedFilter = page.getByRole("search", { name: "Filtres de la console" });
  await expect(translatedFilter.getByRole("searchbox")).toHaveValue("Request failed");
  await expect(page.getByText("Request failed")).toBeVisible();
  await expect(page.getByText("Request complete")).toHaveCount(0);

  await locale.selectOption("pt-BR");
  await expect(page.getByRole("search", { name: "Filtros do console" }).getByRole("searchbox")).toHaveValue("Request failed");
});
