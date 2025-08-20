const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates');
const docsDir = path.join(__dirname, '../docs');

// --- Helper Functions ---

/**
 * Generates the HTML head content for a page.
 * @param {string} pageTitle - The title of the specific page.
 * @returns {string} The HTML for the head section.
 */
function generateHead(pageTitle) {
  return `
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="https://app.kloudmate.com/favicon.ico">
    <title>${pageTitle} | KloudMate Dashboard Templates Gallery</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = { darkMode: 'class' }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  </head>`;
}

/**
 * Generates the HTML for the page footer.
 * @returns {string} The HTML for the footer section.
 */
function generateHeader() {
  return `
  <header class="bg-gray-800 text-white">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <a href="https://kloudmate.com/" target="_blank" rel="noopener noreferrer">
        <img src="https://app.kloudmate.com/assets/images/logo_full_white.svg" alt="KloudMate Logo" class="h-8">
      </a>
      <nav>
        <a href="https://github.com/kloudmate/dashboard-templates" target="_blank" rel="noopener noreferrer" class="hover:text-gray-300">GitHub</a>
      </nav>
    </div>
  </header>`;
}

/**
 * Generates the HTML for the page footer.
 * @returns {string} The HTML for the footer section.
 */
function generateFooter() {
  return `
  <footer class="bg-gray-800 text-gray-400 mt-16">
    <div class="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center">
      <div class="mb-4 md:mb-0">
        <a href="https://kloudmate.com/" target="_blank" rel="noopener noreferrer">
          <img src="https://app.kloudmate.com/assets/images/logo_full_white.svg" alt="KloudMate Logo" class="h-8">
        </a>
      </div>
      <div class="flex space-x-6">
        <a href="https://app.kloudmate.com/login" target="_blank" rel="noopener noreferrer" class="hover:text-white">Login</a>
        <a href="https://github.com/kloudmate/dashboard-templates" target="_blank" rel="noopener noreferrer" class="hover:text-white">GitHub</a>
      </div>
    </div>
  </footer>`;
}

/**
 * Generates the HTML for a single template card.
 * @param {object} template - The template data object.
 * @returns {string} The HTML for the template card.
 */
function generateTemplateCard(template) {
  const verifiedIcon = `<svg class="w-6 h-6 text-blue-500 ml-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
  const screenshot = template.hasScreenshot 
    ? `<img src="${template.slug}/screenshot.png" alt="${template.title}" class="w-full h-48 object-cover">` 
    : '<div class="w-full h-48 bg-gray-700 flex items-center justify-center"><span class="text-gray-500">No Screenshot</span></div>';

  return `
  <div class="template-card bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300" data-tags="${template.tags.join(' ')}" data-title="${template.title}" data-description="${template.description}">
    <a href="${template.slug}/index.html" class="block">
      ${screenshot}
      <div class="p-6">
        <div class="flex items-center mb-2">
          <h2 class="text-2xl font-bold">${template.title}</h2>
          ${template.verified ? verifiedIcon : ''}
        </div>
        <p class="text-sm text-gray-500 mb-2">By ${template.author || 'Anonymous'}</p>
        <p class="text-gray-400 mb-4">${template.description}</p>
        <div>
          ${template.tags.map(tag => `<span class="inline-block bg-blue-600 text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${tag}</span>`).join('')}
        </div>
      </div>
    </a>
  </div>`;
}

/**
 * Generates the full HTML for the index page.
 * @param {Array<object>} templates - An array of template objects.
 * @param {Set<string>} allTags - A set of all unique tags.
 * @returns {string} The full HTML for the index page.
 */
function generateIndexPage(templates, allTags) {
  return `
  <!DOCTYPE html>
  <html lang="en" class="dark">
  ${generateHead('Gallery')}
  <body class="bg-gray-900 text-gray-100 flex flex-col min-h-screen">
    ${generateHeader()}
    <main class="flex-grow">
      <div class="container mx-auto px-4">
        <div class="text-center my-12">
            <h1 class="text-5xl font-extrabold mb-4">KloudMate Dashboard Templates</h1>
            <p class="text-xl text-gray-400">A collection of community-driven, open-source dashboard templates for KloudMate.</p>
        </div>
        <div class="mb-8">
            <input type="search" id="search-input" placeholder="Search templates..." class="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div class="mb-8 text-center">
          <span class="mr-4 font-semibold">Filter by tag:</span>
          <button class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-3 rounded-full m-1 filter-btn active" data-tag="all">All</button>
          ${[...allTags].map(tag => `<button class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-1 px-3 rounded-full m-1 filter-btn" data-tag="${tag}">${tag}</button>`).join('')}
        </div>
        <div id="template-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${templates.map(generateTemplateCard).join('')}
        </div>
      </div>
    </main>
    ${generateFooter()}
    <script>
      // Search and filter logic...
      const searchInput = document.getElementById('search-input');
      const filterButtons = document.querySelectorAll('.filter-btn');
      const templateCards = document.querySelectorAll('.template-card');
      let currentTag = 'all';

      function filterAndSearch() {
          const searchTerm = searchInput.value.toLowerCase();
          templateCards.forEach(card => {
              const title = card.dataset.title.toLowerCase();
              const description = card.dataset.description.toLowerCase();
              const tags = card.dataset.tags;
              const tagMatch = currentTag === 'all' || tags.includes(currentTag);
              const searchMatch = title.includes(searchTerm) || description.includes(searchTerm);
              if (tagMatch && searchMatch) {
                  card.style.display = 'block';
              } else {
                  card.style.display = 'none';
              }
          });
      }
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          currentTag = button.dataset.tag;
          filterButtons.forEach(btn => {
              btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
              btn.classList.add('bg-gray-700', 'hover:bg-gray-600');
          });
          button.classList.add('bg-blue-600', 'hover:bg-blue-700');
          button.classList.remove('bg-gray-700', 'hover:bg-gray-600');
          filterAndSearch();
        });
      });
      searchInput.addEventListener('input', filterAndSearch);
    </script>
  </body>
  </html>`;
}

/**
 * Generates the full HTML for a template detail page.
 * @param {object} template - The template data object.
 * @returns {string} The full HTML for the detail page.
 */
function generateDetailPage(template) {
    const verifiedIcon = `<svg class="w-8 h-8 text-blue-500 ml-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
    const screenshot = template.hasScreenshot ? `<img src="screenshot.png" alt="${template.title}" class="w-full rounded-lg shadow-lg mb-8">` : '';
    const jsonString = JSON.stringify(template.template, null, 2);

    return `
    <!DOCTYPE html>
    <html lang="en" class="dark">
    ${generateHead(template.title)}
    <body class="bg-gray-900 text-gray-100 flex flex-col min-h-screen">
      ${generateHeader()}
      <main class="flex-grow">
        <div class="container mx-auto px-4">
          <a href="../index.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full my-8"><- Back to Templates</a>
          <div class="flex items-center mb-2">
              <h1 class="text-4xl font-bold">${template.title}</h1>
              ${template.verified ? verifiedIcon : ''}
          </div>
          <p class="text-lg text-gray-500 mb-4">By ${template.author || 'Anonymous'}</p>
          <p class="text-gray-400 mb-8">${template.description}</p>
          ${screenshot}
          <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold">Template JSON</h2>
              <button id="how-to-use-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">How to Use</button>
          </div>
          <div class="relative">
              <pre id="json-viewer" class="max-h-96 overflow-y-auto transition-all duration-500"><code class="json rounded-lg">${jsonString}</code></pre>
              <button class="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md" onclick="copyToClipboard()">Copy</button>
          </div>
          <button id="expand-btn" class="mt-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">Show More</button>
        </div>
      </main>
      ${generateFooter()}
      <div id="how-to-use-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
        <div class="bg-gray-800 text-white rounded-lg shadow-lg p-8 max-w-lg w-full">
            <h2 class="text-2xl font-bold mb-4">How to Use This Template</h2>
            <ol class="list-decimal list-inside space-y-2">
                <li>Copy the JSON from the template viewer.</li>
                <li>Go to the "Dashboards" page in your KloudMate account.</li>
                <li>Click the "Import" button.</li>
                <li>Paste the JSON into the text area.</li>
                <li>Click "Submit" to create the new dashboard.</li>
            </ol>
            <button id="close-modal-btn" class="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">Close</button>
        </div>
      </div>
      <script>
        // Page-specific script...
        hljs.highlightAll();
        function copyToClipboard() {
          navigator.clipboard.writeText(${JSON.stringify(jsonString)}).then(() => alert('Copied to clipboard!'), () => alert('Failed to copy.'));
        }
        const jsonViewer = document.getElementById('json-viewer');
        const expandBtn = document.getElementById('expand-btn');
        const howToUseBtn = document.getElementById('how-to-use-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const modal = document.getElementById('how-to-use-modal');
        expandBtn.addEventListener('click', () => {
          jsonViewer.classList.toggle('max-h-96');
          expandBtn.textContent = jsonViewer.classList.contains('max-h-96') ? 'Show More' : 'Show Less';
        });
        howToUseBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
      </script>
    </body>
    </html>`;
}


// --- Main Script ---

// 1. Setup: Ensure docs directory exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
}

// 2. Data Fetching: Read all template data from the file system
const templates = fs.readdirSync(templatesDir)
  .filter(file => fs.statSync(path.join(templatesDir, file)).isDirectory())
  .map(templateDir => {
    const metadataPath = path.join(templatesDir, templateDir, 'metadata.json');
    const templatePath = path.join(templatesDir, templateDir, 'template.json');
    const screenshotPath = path.join(templatesDir, templateDir, 'screenshot.png');

    if (!fs.existsSync(metadataPath) || !fs.existsSync(templatePath)) {
      return null;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    return {
      slug: templateDir,
      ...metadata,
      template,
      hasScreenshot: fs.existsSync(screenshotPath)
    };
  })
  .filter(Boolean); // Remove nulls from templates that couldn't be read

const allTags = new Set(templates.flatMap(t => t.tags));

// 3. Generation: Create the static HTML files
fs.writeFileSync(path.join(docsDir, 'index.html'), generateIndexPage(templates, allTags));

templates.forEach(template => {
  const templateDocsDir = path.join(docsDir, template.slug);
  if (!fs.existsSync(templateDocsDir)) {
    fs.mkdirSync(templateDocsDir);
  }

  if (template.hasScreenshot) {
    fs.copyFileSync(
      path.join(templatesDir, template.slug, 'screenshot.png'),
      path.join(templateDocsDir, 'screenshot.png')
    );
  }

  fs.writeFileSync(path.join(templateDocsDir, 'index.html'), generateDetailPage(template));
});

console.log('Website generated successfully with footer!');