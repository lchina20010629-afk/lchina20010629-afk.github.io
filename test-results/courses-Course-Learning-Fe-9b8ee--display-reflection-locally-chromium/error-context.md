# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: courses.spec.ts >> Course/Learning Features >> should store and display reflection locally
- Location: e2e/courses.spec.ts:80:3

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('input[type="password"]').first()

```

```
Error: write EPIPE
```

```
Error: browserContext._wrapApiCall: Target page, context or browser has been closed
```