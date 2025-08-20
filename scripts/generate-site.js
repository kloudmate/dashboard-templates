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

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  metadata.tags.forEach(tag => allTags.add(tag));

  templates.push({
    slug: templateDir,
    ...metadata,
    template
  });
});

// Generate the main index.html
let indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Templates</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
  <style>
    .card {
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="my-4">Dashboard Templates</h1>
    <div class="mb-4">
      <strong>Filter by tag:</strong>
      <button class="btn btn-sm btn-outline-primary mx-1 active" data-tag="all">All</button>
      ${[...allTags].map(tag => `<button class="btn btn-sm btn-outline-primary mx-1" data-tag="${tag}">${tag}</button>`).join('')}
    </div>
    <div class="row">
      ${templates.map(template => `
        <div class="col-md-4 mb-4 template-card" data-tags="${template.tags.join(' ')}">
          <div class="card" onclick="window.location.href='${template.slug}/index.html'">
            <div class="card-body">
              <h5 class="card-title">${template.title}</h5>
              <p class="card-text">${template.description}</p>
              <p class="card-text">
                ${template.tags.map(tag => `<span class="badge badge-primary mr-1">${tag}</span>`).join('')}
              </p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  <script>
    const filterButtons = document.querySelectorAll('[data-tag]');
    const templateCards = document.querySelectorAll('.template-card');

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tag = button.dataset.tag;
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        templateCards.forEach(card => {
          if (tag === 'all' || card.dataset.tags.includes(tag)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(docsDir, 'index.html'), indexHtml);

// Generate the detail pages
templates.forEach(template => {
  const templateDocsDir = path.join(docsDir, template.slug);
  if (!fs.existsSync(templateDocsDir)) {
    fs.mkdirSync(templateDocsDir);
  }

  let detailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.title}</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/default.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
</head>
<body>
  <div class="container">
    <a href="../index.html" class="btn btn-primary my-4">Back to Templates</a>
    <h1>${template.title}</h1>
    <p>${template.description}</p>
    <h3>Template JSON</h3>
    <pre><code class="json">${JSON.stringify(template.template, null, 2)}</code></pre>
    <button class="btn btn-secondary" onclick="copyToClipboard()">Copy to Clipboard</button>
  </div>
  <script>
    function copyToClipboard() {
      const el = document.createElement('textarea');
      el.value = JSON.stringify(${JSON.stringify(template.template, null, 2)}, null, 2);
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      alert('Copied to clipboard!');
    }
  </script>
</body>
</html>
  `;

  fs.writeFileSync(path.join(templateDocsDir, 'index.html'), detailHtml);
});

console.log('Website generated successfully!');