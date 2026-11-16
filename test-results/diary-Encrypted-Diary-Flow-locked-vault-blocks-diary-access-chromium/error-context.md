# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diary.spec.ts >> Encrypted Diary Flow >> locked vault blocks diary access
- Location: e2e/diary.spec.ts:111:3

# Error details

```
Error: Channel closed
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByRole('button', { name: '初始化保险库' })

```

```
Error: browserContext.close: Target page, context or browser has been closed
```