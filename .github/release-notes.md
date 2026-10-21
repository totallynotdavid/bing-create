bing-create 0.1.0 is out.

It has been ten months since 0.0.2. This is a feature release: it adds video
generation and makes image and video results stricter about where a URL may
point. Code written against 0.0.2 runs unchanged. Upgrade when you want
`createVideo` or the stricter results.

The big change is `createVideo(prompt, { cookie })`. It starts a Bing video
generation, polls until the video is ready and returns one URL. It takes
`aspectRatio` (`"portrait"`, the default, or `"landscape"`) and the same
`timeouts` as `createImages`. The `Timeouts`, `CreateVideoOptions` and
`VideoAspectRatio` types are exported too. To share the request, timeout and
polling code between images and video, I moved image code into `src/image` and
the common HTTP helpers into `src/shared`. None of that is public.

The second change is stricter results. A result URL must now be an `https` URL
on a Bing host. Before, a host such as `evilbing.com` or a plain `http` URL
passed the image filter, and a video page that carried a URL on another host
could have that URL returned as the video. The `.js` and `.svg` checks now look
at the URL path, so those files no longer slip through. A result that the filter
empties now throws "No images found in response" instead of resolving with an
empty list.

I also fixed three parsing defects that CodeQL flagged: the double decoding of
`&amp;` in video pages, the entity decoder for images and video (now one
single-pass decoder), and a slow regex in the filename slug. The filenames come
out the same.

The rest is tests, docs and build. There is a manual in `docs/`, the readme is
rewritten, the tests run the real pipeline with only `fetch` stubbed, CI now
runs `bun run check` on every pull request and before a publish, and the tooling
moved to Bun, Biome and oxfmt. The package now ships `docs/`.

## Known problems

None known. Bing's web endpoints are not a documented API, so a change on their
side can break either function without a new release.

## What to do

Upgrade with `npm install bing-create@0.1.0`. If you call `createImages`, test
that it still returns your images, because the host filter is stricter. Report
problems at https://github.com/totallynotdavid/bing-create/issues.
