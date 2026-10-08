# Authentication

Every request carries the `_U` cookie of a signed-in Microsoft account as
`Cookie: _U=<value>`. Pass the value in `options.cookie`. The library sends
nothing else from your account.

## Get the cookie

1. Sign in at [bing.com/images/create](https://www.bing.com/images/create).
2. Open DevTools (F12) and go to Application, Cookies, `https://www.bing.com`.
3. Copy the value of the `_U` cookie.

## Keep it out of the code

Store the value in the `BING_COOKIE` environment variable. For local runs and
for the tests, copy `.env.example` to `.env` and fill it in. `.env` is ignored
by git. Bun loads `.env` automatically; with Node.js, run
`node --env-file=.env`.

```bash
cp .env.example .env
```

## Expiry

When Bing rejects the cookie, the first request gets no redirect and the library
throws `No redirect from Bing. Cookie may be invalid or expired.` Copy a fresh
cookie. See [Images](images.md#observed-not-verified) for how long a cookie
lasted.
