# GitHub Connector Visibility

Checked GitHub installation state:

Right now, this ChatGPT GitHub connector only exposes:

```txt
TrueNorthAppsCEO
```

Visible repos:

```txt
TrueNorthAppsCEO/NorthSignal-Ledger
TrueNorthAppsCEO/HeyMama
TrueNorthAppsCEO/Lucky-Kat-Tattoo-Studio
TrueNorthAppsCEO/TrueNorth-Applications-Website
TrueNorthAppsCEO/CommonSaas
```

It does not currently expose another GitHub account or org, and there is no
visible repo named `Founder Lab OS`.

The attempted write to `CommonSaas` did not complete, so the prompt was not
added to the wrong repo.

To add assets to the correct Founder Lab OS repo, one of these needs to happen:

1. Install/connect the ChatGPT GitHub app on the other GitHub account or org
   that owns Founder Lab OS.
2. Provide the exact repo full name, such as:

```txt
OwnerName/founder-lab-os
```

or provide the GitHub repo URL.

Once the correct visible repo is available, add the prompt as a safe docs asset,
likely here:

```txt
docs/codex/playwright-vercel-preview-megaprompt.md
```

Keep the change non-destructive:

- New doc file only.
- No package edits.
- No workflow edits.
- No source-code changes.
