# Dashboard Templates Library

A repository of premade dashboard templates. This project provides a simple way to publish and browse a collection of dashboard templates, which are automatically published to a GitHub Pages website.

## How it Works

The system is designed to be as automated as possible. Here's a brief overview of the workflow:

1.  **Templates are stored in the `/templates` directory.** Each template has its own subdirectory containing a `template.json` file, a `metadata.json` file, and an optional `screenshot.png`.
2.  **A Node.js script (`scripts/generate-site.js`) generates a static website.** This script reads the template data and creates an `index.html` with a list of all templates, as well as individual detail pages for each one. The generated site is placed in the `/docs` directory.
3.  **A GitHub Actions workflow (`.github/workflows/publish.yml`) automates the process.** On every push to the `master` branch, the workflow automatically runs the generation script and deploys the contents of the `/docs` directory to GitHub Pages.

## Accessing the Published Site

The site is published to: `https://templates.kloudmate.com/`

## How to Add a New Template

To add a new template to the library, follow these steps:

1.  **Create a new subdirectory in the `/templates` directory.** The name of the subdirectory will be used as the URL slug for the template (e.g., `/templates/my-new-template`).
2.  **Add a `metadata.json` file.** This file should contain the following fields:
    *   `title`: The title of the dashboard.
    *   `description`: A brief description of what the dashboard is for.
    *   `tags`: An array of strings for categorizing the template.
    *   `author`: The name of the person or organization that created the template.
    *   `verified`: A boolean (`true` or `false`) indicating whether the template has been verified by the KloudMate team.

    ```json
    {
      "title": "My New Template",
      "description": "A description of my new template.",
      "tags": ["new", "example"],
      "author": "Your Name",
      "verified": false
    }
    ```

3.  **Add a `template.json` file.** This file contains the actual JSON for the dashboard template.
4.  **(Optional) Add a `screenshot.png` file.** If you include a screenshot, it will be displayed on the website.
5.  **Commit and push your changes to the `master` branch.** The GitHub Actions workflow will automatically update the website with your new template.

## Local Development

If you want to preview your changes locally before pushing, you can run the site generation script manually:

```bash
node scripts/generate-site.js
```

This will generate the website in the `/docs` directory. You can then open the `docs/index.html` file in your browser to see the result.
