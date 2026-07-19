# The Yes-Way

The source for [notes.josephiesue.com](https://notes.josephiesue.com), the publishing home of **The Yes-Way** by Joseph E. Iesue.

## Publish an Iesue

Add a Markdown file to `src/content/notes/` with this frontmatter:

```yaml
---
title: Your Iesue title
description: A concise summary.
date: 2026-07-15
topic: Leadership
tags: [leadership, practice]
featured: false
draft: false
---
```

Push to `main`. GitHub Actions builds the Astro site and publishes it to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

## Custom domain

The repository includes `public/CNAME` for `notes.josephiesue.com`. The DNS provider for `josephiesue.com` still needs a CNAME record pointing `notes` to `josephiesue.github.io`.
