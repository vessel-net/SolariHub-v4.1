# [task] Setup Git Hooks Using Husky and Lint-Staged

## Objective
Configure automatic code validation using `husky` + `lint-staged` so ESLint and Prettier run automatically before every commit. This keeps the codebase clean and enforces standards.

---

## Tasks

### ✅ 1. Install Dev Dependencies
Run:
Install the following tools:

```bash
npm install --save-dev husky lint-staged

2. Add Prepare Script to package.json
Update package.json with:
"scripts": {
  "prepare": "husky install",
  "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
  "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
  "format": "prettier --write .",
  "lint:format": "npm run lint:fix && npm run format"
}
3. Initialize Husky
npx husky install

Then create a Git hook:
npx husky add .husky/pre-commit "npx lint-staged"

4. Configure lint-staged
In package.json, add this block:
"lint-staged": {
  "*.{ts,tsx,js,jsx,json}": [
    "eslint --fix",
    "prettier --write"
  ]
}

Testing the Setup
	1.	Make a change in any .ts or .tsx file.
	2.	Run:
git add .
git commit -m "Test commit"    