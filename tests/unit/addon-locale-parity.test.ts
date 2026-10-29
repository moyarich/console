import { describe, expect, it } from "vitest";
import consoleEn from "../../packages/console/src/locales/en.json";
import consoleEs from "../../packages/console/src/locales/es.json";
import consoleFr from "../../packages/console/src/locales/fr.json";
import consolePt from "../../packages/console/src/locales/pt.json";
import en0 from "../../packages/addons/annotations/src/locales/en.json";
import es0 from "../../packages/addons/annotations/src/locales/es.json";
import fr0 from "../../packages/addons/annotations/src/locales/fr.json";
import pt0 from "../../packages/addons/annotations/src/locales/pt.json";
import en1 from "../../packages/addons/console-feed/src/locales/en.json";
import es1 from "../../packages/addons/console-feed/src/locales/es.json";
import fr1 from "../../packages/addons/console-feed/src/locales/fr.json";
import pt1 from "../../packages/addons/console-feed/src/locales/pt.json";
import en2 from "../../packages/addons/data-export/src/locales/en.json";
import es2 from "../../packages/addons/data-export/src/locales/es.json";
import fr2 from "../../packages/addons/data-export/src/locales/fr.json";
import pt2 from "../../packages/addons/data-export/src/locales/pt.json";
import en3 from "../../packages/addons/diagnostics/src/locales/en.json";
import es3 from "../../packages/addons/diagnostics/src/locales/es.json";
import fr3 from "../../packages/addons/diagnostics/src/locales/fr.json";
import pt3 from "../../packages/addons/diagnostics/src/locales/pt.json";
import en4 from "../../packages/addons/filtering/src/locales/en.json";
import es4 from "../../packages/addons/filtering/src/locales/es.json";
import fr4 from "../../packages/addons/filtering/src/locales/fr.json";
import pt4 from "../../packages/addons/filtering/src/locales/pt.json";
import en5 from "../../packages/addons/imperative-scrolling/src/locales/en.json";
import es5 from "../../packages/addons/imperative-scrolling/src/locales/es.json";
import fr5 from "../../packages/addons/imperative-scrolling/src/locales/fr.json";
import pt5 from "../../packages/addons/imperative-scrolling/src/locales/pt.json";
import en6 from "../../packages/addons/process-state/src/locales/en.json";
import es6 from "../../packages/addons/process-state/src/locales/es.json";
import fr6 from "../../packages/addons/process-state/src/locales/fr.json";
import pt6 from "../../packages/addons/process-state/src/locales/pt.json";
import en7 from "../../packages/addons/resizable/src/locales/en.json";
import es7 from "../../packages/addons/resizable/src/locales/es.json";
import fr7 from "../../packages/addons/resizable/src/locales/fr.json";
import pt7 from "../../packages/addons/resizable/src/locales/pt.json";
import en8 from "../../packages/addons/search/src/locales/en.json";
import es8 from "../../packages/addons/search/src/locales/es.json";
import fr8 from "../../packages/addons/search/src/locales/fr.json";
import pt8 from "../../packages/addons/search/src/locales/pt.json";
import en9 from "../../packages/addons/selection/src/locales/en.json";
import es9 from "../../packages/addons/selection/src/locales/es.json";
import fr9 from "../../packages/addons/selection/src/locales/fr.json";
import pt9 from "../../packages/addons/selection/src/locales/pt.json";
import en10 from "../../packages/addons/xterm/src/locales/en.json";
import es10 from "../../packages/addons/xterm/src/locales/es.json";
import fr10 from "../../packages/addons/xterm/src/locales/fr.json";
import pt10 from "../../packages/addons/xterm/src/locales/pt.json";
const dictionaries = [
  ["console", consoleEn, consoleEs, consoleFr, consolePt],
  ["annotations", en0, es0, fr0, pt0],
  ["console-feed", en1, es1, fr1, pt1],
  ["data-export", en2, es2, fr2, pt2],
  ["diagnostics", en3, es3, fr3, pt3],
  ["filtering", en4, es4, fr4, pt4],
  ["imperative-scrolling", en5, es5, fr5, pt5],
  ["process-state", en6, es6, fr6, pt6],
  ["resizable", en7, es7, fr7, pt7],
  ["search", en8, es8, fr8, pt8],
  ["selection", en9, es9, fr9, pt9],
  ["xterm", en10, es10, fr10, pt10],
] as const;
const tokens = (text: string) =>
  [...text.matchAll(/\\{[a-zA-Z][a-zA-Z0-9]*\\}/g)]
    .map((match) => match[0])
    .sort();

describe("localized addon dictionaries", () => {
  for (const [name, en, es, fr, pt] of dictionaries) {
    it(`${name}: all four languages have identical keys and interpolation tokens`, () => {
      const source = en as Record<string, string>;
      for (const translated of [es, fr, pt]) {
        const dictionary = translated as Record<string, string>;
        expect(Object.keys(dictionary).sort()).toEqual(
          Object.keys(source).sort(),
        );
        for (const key of Object.keys(source)) {
          expect(
            dictionary[key]!.trim(),
            `${name}.${key} should not be empty`,
          ).not.toBe("");
          expect(
            tokens(dictionary[key]!),
            `${name}.${key} placeholders`,
          ).toEqual(tokens(source[key]!));
        }
      }
    });
  }
});
