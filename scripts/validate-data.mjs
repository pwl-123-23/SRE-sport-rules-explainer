import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../src/data/sports.js", import.meta.url), "utf8");
const sandbox = { window: {} };

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const { categories, sports } = sandbox.window.SPORTS_RULES_DATA;
const categoryIds = new Set(categories.map((category) => category.id));
const missingCategories = sports.filter((sport) => !categoryIds.has(sport.category));
const requiredFields = [
  "id",
  "category",
  "title",
  "englishName",
  "visualType",
  "summary",
  "format",
  "venue",
  "scoring",
  "fouls",
  "watchFocus",
  "source",
];
const incomplete = sports.filter((sport) =>
  requiredFields.some((field) => String(sport[field] ?? "").trim() === ""),
);

if (sports.length !== 44) {
  throw new Error(`Expected 44 sports entries, found ${sports.length}.`);
}

if (missingCategories.length > 0) {
  throw new Error(`Sports with unknown categories: ${missingCategories.map((sport) => sport.id).join(", ")}`);
}

if (incomplete.length > 0) {
  throw new Error(`Sports with missing fields: ${incomplete.map((sport) => sport.id).join(", ")}`);
}

console.log(`Validated ${sports.length} sports entries across ${categories.length - 1} categories.`);
