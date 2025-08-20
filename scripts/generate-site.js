const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates');
const docsDir = path.join(__dirname, '../docs');

// Create the docs directory if it doesn't exist
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
}

// Read all the template directories
const templateDirs = fs.readdirSync(templatesDir).filter(file => {
  return fs.statSync(path.join(templatesDir, file)).isDirectory();
});

let templates = [];
let allTags = new Set();

// Read the metadata and template for each template
templateDirs.forEach(templateDir => {
  const metadataPath = path.join(templatesDir, templateDir, 'metadata.json');
  const templatePath = path.join(templatesDir, templateDir, 'template.json');
  const screenshotPath = path.join(templatesDir, templateDir, 'screenshot.png');

  if (fs.existsSync(metadataPath) && fs.existsSync(templatePath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    const hasScreenshot = fs.existsSync(screenshotPath);

    metadata.tags.forEach(tag => allTags.add(tag));

    templates.push({
      slug: templateDir,
      ...metadata,
      template,
      hasScreenshot
    });
  }
});

// Generate the main index.html
let indexHtml = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="https://app.kloudmate.com/favicon.ico">
  <title>KloudMate Dashboard Templates Gallery</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
    }
  </script>
</head>
<body class="bg-gray-900 text-gray-100">
  <div class="container mx-auto px-4">
    <h1 class="text-4xl font-bold my-8 text-center">Dashboard Templates</h1>
    
    <div class="mb-8">
        <input type="search" id="search-input" placeholder="Search templates..." class="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>

    <div class="mb-8 text-center">
      <span class="mr-4 font-semibold">Filter by tag:</span>
      <button class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-3 rounded-full m-1 filter-btn active" data-tag="all">All</button>
      ${[...allTags].map(tag => `<button class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-1 px-3 rounded-full m-1 filter-btn" data-tag="${tag}">${tag}</button>`).join('')}
    </div>
    
    <div id="template-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      ${templates.map(template => `
        <div class="template-card bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300" data-tags="${template.tags.join(' ')}" data-title="${template.title}" data-description="${template.description}">
          <a href="${template.slug}/index.html" class="block">
            ${template.hasScreenshot ? `<img src="${template.slug}/screenshot.png" alt="${template.title}" class="w-full h-48 object-cover">` : '<div class="w-full h-48 bg-gray-700 flex items-center justify-center"><span class="text-gray-500">No Screenshot</span></div>'}
            <div class="p-6">
              <h2 class="text-2xl font-bold mb-2">${template.title}</h2>
              <p class="text-gray-400 mb-4">${template.description}</p>
              <div>
                ${template.tags.map(tag => `<span class="inline-block bg-blue-600 text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${tag}</span>`).join('')}
              </div>
            </div>
          </a>
        </div>
      `).join('')}
    </div>
  </div>
  
  <script>
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
</html>
`;

fs.writeFileSync(path.join(docsDir, 'index.html'), indexHtml);

// Generate the detail pages and copy screenshots
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

  let detailHtml = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
</head>
<body class="bg-gray-900 text-gray-100">
  <div class="container mx-auto px-4">
    <a href="../index.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full my-8"><- Back to Templates</a>
    <h1 class="text-4xl font-bold mb-4">${template.title}</h1>
    <p class="text-gray-400 mb-8">${template.description}</p>
    ${template.hasScreenshot ? `<img src="screenshot.png" alt="${template.title}" class="w-full rounded-lg shadow-lg mb-8">` : ''}
    <h2 class="text-2xl font-bold mb-4">Template JSON</h2>
    <div class="relative">
        <pre><code class="json rounded-lg">${JSON.stringify(template.template, null, 2)}</code></pre>
        <button class="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md" onclick="copyToClipboard()">Copy</button>
    </div>
  </div>
  <script>
    function copyToClipboard() {
      const textToCopy = ${JSON.stringify(JSON.stringify(template.template, null, 2))};
      navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Copied to clipboard!');
      }, (err) => {
        console.error('Could not copy text: ', err);
        alert('Failed to copy to clipboard.');
      });
    }
  </script>
</body>
</html>
  `;

  fs.writeFileSync(path.join(templateDocsDir, 'index.html'), detailHtml);
});

console.log('Website generated successfully with screenshots!');