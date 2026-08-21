import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import jestDom from "eslint-plugin-jest-dom";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import testingLibrary from "eslint-plugin-testing-library";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    ...testingLibrary.configs["flat/react"],
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    ...jestDom.configs["flat/recommended"],
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // 1. Side effect imports at the start. For me this is important because I want to import reset.css and global styles at the top of my main file.
            ["^\\u0000"],
            // 2. `react` and packages: Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            ["^react$", "^@?\\w"],
            // 3. Absolute imports and other imports such as Vue-style `@/foo`.
            // Anything not matched in another group. (also relative imports starting with "../")
            ["^@", "^"],
            // 4. relative imports from same folder "./" (I like to have them grouped together)
            ["^\\./"],
            // 5. style module imports always come last, this helps to avoid CSS order issues
            ["^.+\\.(module.css|module.scss)$"],
            // 6. media imports
            ["^.+\\.(gif|png|svg|jpg)$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".next/",
      "src/.next",
      ".venv",
    ],
  },
];

export default eslintConfig;
