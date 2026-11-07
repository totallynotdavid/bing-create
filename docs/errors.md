# Errors

`createImages` and `createVideo` reject with an `Error`. The message names the
cause.

| Message                                                         | Cause                                                                                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Prompt must be a non-empty string`                             | The prompt is not a string, is empty, or is only whitespace.                                                                        |
| `options.cookie is required and must be a non-empty string`     | The cookie is empty or only whitespace.                                                                                             |
| `options.model must be one of: <names>`                         | `model` is not `dalle3`, `gpt4o` or `mai`.                                                                                          |
| `options.aspectRatio must be one of: <names>`                   | `aspectRatio` is not one of the values the call accepts.                                                                            |
| `options.timeouts.<field> must be a finite number of 0 or more` | A timeout is not a number, is `NaN` or infinite, or is negative.                                                                    |
| `No redirect from Bing. Cookie may be invalid or expired.`      | The first request got no `Location` header. Bing may reject the cookie or the prompt ([observed](images.md#observed-not-verified)). |
| `Failed to extract request ID from: <url>`                      | The redirect URL has no `id` parameter.                                                                                             |
| `Request timed out after <ms>ms`                                | One HTTP request exceeded `requestMs`, or the time left in `generationMs`.                                                          |
| `Image generation timed out after <s>s`                         | `createImages` polled for `generationMs` without a result.                                                                          |
| `Video generation timed out after <s>s`                         | `createVideo` polled for `generationMs` without a result.                                                                           |
| `HTTP <status>: <statusText>`                                   | A poll returned a non-2xx status. A redirect (3xx) counts.                                                                          |
| `Bing error: <errorMessage>`                                    | A poll returned JSON with an `errorMessage`.                                                                                        |
| `Unexpected JSON response from Bing: <first 200 characters>`    | `createImages` got JSON without an `errorMessage`.                                                                                  |
| `No images found in response`                                   | The result HTML has no `src="..."` URL that passes the image filter ([steps](bing-api.md#3-read-the-image-urls)).                   |

Network failures from `fetch` propagate unchanged.

What the library reads from Bing to raise these is in
[Bing API](bing-api.md#errors).
