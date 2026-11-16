# E2E Test Fix Plan: HashRouter URL Conversion

## Root Cause
App migrated from BrowserRouter to HashRouter for GitHub Pages compatibility.
E2E tests still use old BrowserRouter URLs (`/path`) instead of HashRouter URLs (`#/path`).

## Files Requiring Updates (7 files)

### 1. e2e/vault.spec.ts
- ✅ `beforeEach` navigation fixed
- Status: 1/4 tests passing

### 2. e2e/backup.spec.ts  
- ❌ Multiple `page.click('a[href="/diary"]')` → `page.click('a[href="#/diary"]')`
- ❌ Multiple `page.click('a[href="/settings"]')` → `page.click('a[href="#/settings"]')`  
- ❌ All `toHaveURL` assertions need hash
- Status: 0/3 tests passing

### 3. e2e/diary.spec.ts
- ❌ All navigation clicks need hash prefix
- ❌ All URL assertions need hash
- Status: 0/4 tests passing

### 4. e2e/security.spec.ts  
- ❌ Navigation and URL assertions need hash
- Status: Not run

### 5. e2e/manifest.spec.ts
- ❌ Uses `http://localhost:8174/diary/${date}` in several places
- Status: 1/5 tests passing

### 6. e2e/courses.spec.ts (NEW)
- ✅ Already uses port 8175 with hash URLs
- ❌ Needs verification against built dist
- Status: 0/7 (environment issue)

### 7. e2e/reviews.spec.ts (NEW)  
- ✅ Already uses port 8175 with hash URLs
- ❌ Needs verification
- Status: 0/7 (environment issue)

## Systematic Fix Approach

```bash
# For each file, apply these transformations:
sed -i "s|click('a\[href=\"/diary\"\]')|click('a[href=\"#/diary\"]')|g" file.spec.ts
sed -i "s|click('a\[href=\"/settings\"\]')|click('a[href=\"#/settings\"]')|g" file.spec.ts  
sed -i 's|locator(`a\[href="/diary/${|locator(`a[href="#/diary/${|g' file.spec.ts
sed -i 's|toHaveURL(`http://localhost:5173/diary/${|toHaveURL(`http://localhost:5173/#/diary/${|g' file.spec.ts
sed -i "s|toHaveURL('http://localhost:5173/diary')|toHaveURL('http://localhost:5173/#/diary')|g" file.spec.ts
```

## Verification Steps

1. Run each test file individually
2. Check for syntax errors with `npx tsc --noEmit file.spec.ts`  
3. Verify navigation actually reaches intended pages
4. Confirm URL assertions match hash routes

## Expected Outcome

- Base tests: 16/16 passing (vault 4 + security 4 + diary 4 + backup 3 + migration 1)
- Manifest: 5/5 passing  
- Courses: 7/7 passing
- Reviews: 7/7 passing
- **Total: 35/35 E2E tests passing**
