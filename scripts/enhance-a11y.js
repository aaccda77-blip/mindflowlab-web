const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const coreFiles = ['index.html', 'faq.html', 'self-check.html', 'ai.html', 'library.html', 'trust.html'];

const a11yCss = `
    /* Accessibility Enhancements: prefers-reduced-motion, focus-visible, touch targets */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
      outline: 2px solid #007A55 !important;
      outline-offset: 2px !important;
    }
    .btn, button, input[type="text"], select {
      min-height: 44px;
    }
`;

for (const file of coreFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) continue;
  let html = fs.readFileSync(filePath, 'utf8');

  // Avoid duplicate injection
  if (!html.includes('prefers-reduced-motion')) {
    html = html.replace('</style>', a11yCss + '\n  </style>');
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✓ Added A11y CSS to ${file}`);
  } else {
    console.log(`- ${file} already has A11y CSS`);
  }
}
