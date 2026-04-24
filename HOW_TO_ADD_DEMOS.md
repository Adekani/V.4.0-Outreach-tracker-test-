# How to Add New Demo Templates

This application allows you to easily generate demo links for your prospects. You can add as many new demo templates as you like without needing complex coding skills.

## Step 1: Add your HTML file
1. Create your static HTML demo file (e.g., \`roofing.html\`).
2. Place this file in the \`public\` directory of your project folder.

## Step 2: Make it dynamic (Optional but recommended)
To make your demo automatically display the business name that you generate in the app, add this small snippet of Javascript to your new HTML file, just before the closing \`</body>\` tag:

\`\`\`html
<script>
  // This reads the name passed via the generator URL
  const queryParams = new URLSearchParams(window.location.search);
  const businessName = queryParams.get('name');
  
  if (businessName) {
    // Finds any HTML element with the id "dynamic-business-name" and replaces its text
    const elements = document.querySelectorAll('#dynamic-business-name, .dynamic-business-name');
    elements.forEach(el => {
      el.textContent = businessName;
    });
  }
</script>
\`\`\`

Then, wrap the business name in your HTML with that ID or class:
\`\`\`html
<h1>Welcome to <span id="dynamic-business-name">Default Roofing Co</span></h1>
\`\`\`

## Step 3: Register the Template
1. Open the file \`src/data/demo_templates.ts\`
2. Add a new line for your template in the list.

Example:
\`\`\`tsx
export const DEMO_TEMPLATES = [
  { id: 'solar', name: 'Solar Energy', path: '/solar.html' },
  { id: 'microfinance', name: 'Microfinance', path: '/microfinance.html' },
  { id: 'realestate', name: 'Real Estate', path: '/realestate.html' },
  // ADD YOUR NEW TEMPLATE BELOW:
  { id: 'roofing', name: 'Roofing Services', path: '/roofing.html' },
];
\`\`\`

That's it! When you open the Demo Generator tab, "Roofing Services" will now appear in the dropdown menu.
