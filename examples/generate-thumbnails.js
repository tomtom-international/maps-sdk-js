const fs = require('fs');
const path = require('path');

// Simple SVG-based thumbnail generator
function createMultipleOriginsThumb() {
    const svg = `<svg width="800" height="460" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="460" fill="#E8F4F8"/>
  
  <!-- Destination (Schiphol) -->
  <circle cx="620" cy="230" r="15" fill="#FF6B6B" stroke="#CC0000" stroke-width="3"/>
  
  <!-- Route 1: Amsterdam (Blue) -->
  <line x1="180" y1="150" x2="620" y2="230" stroke="#0066CC" stroke-width="6"/>
  <circle cx="180" cy="150" r="12" fill="#0066CC" stroke="#FFFFFF" stroke-width="3"/>
  
  <!-- Route 2: Leiden (Cyan) -->
  <line x1="150" y1="230" x2="620" y2="230" stroke="#00BBDD" stroke-width="6"/>
  <circle cx="150" cy="230" r="12" fill="#00BBDD" stroke="#FFFFFF" stroke-width="3"/>
  
  <!-- Route 3: Utrecht (Green) -->
  <line x1="190" y1="310" x2="620" y2="230" stroke="#33AA33" stroke-width="6"/>
  <circle cx="190" cy="310" r="12" fill="#33AA33" stroke="#FFFFFF" stroke-width="3"/>
  
  <!-- Title -->
  <text x="20" y="45" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#333333" font-weight="bold">Multiple Routes from Different Origins</text>
  <text x="20" y="440" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#666666">3 origins → 1 destination</text>
</svg>`;

    const outputPath = path.join(__dirname, 'route-multiple-origins', 'content', 'thumbnail.svg');
    fs.writeFileSync(outputPath, svg);
    console.log('Created:', outputPath);
}

function createMultipleOriginDestinationsThumb() {
    const svg = `<svg width="800" height="460" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="460" fill="#E8F4F8"/>
  
  <!-- Route 1 (Green) -->
  <line x1="120" y1="140" x2="520" y2="280" stroke="#33AA33" stroke-width="6"/>
  <circle cx="120" cy="140" r="10" fill="#33AA33" stroke="#FFFFFF" stroke-width="3"/>
  <circle cx="520" cy="280" r="10" fill="#33AA33" stroke="#FFFFFF" stroke-width="3"/>
  
  <!-- Route 2 (Red) -->
  <line x1="160" y1="180" x2="560" y2="320" stroke="#CC6666" stroke-width="6"/>
  <circle cx="160" cy="180" r="10" fill="#CC6666" stroke="#FFFFFF" stroke-width="3"/>
  <circle cx="560" cy="320" r="10" fill="#CC6666" stroke="#FFFFFF" stroke-width="3"/>
  
  <!-- Route 3 (Blue) -->
  <line x1="200" y1="220" x2="600" y2="360" stroke="#0066CC" stroke-width="6"/>
  <circle cx="200" cy="220" r="10" fill="#0066CC" stroke="#FFFFFF" stroke-width="3"/>
  <circle cx="600" cy="360" r="10" fill="#0066CC" stroke="#FFFFFF" stroke-width="3"/>
  
  <!-- Route 4 (Cyan) -->
  <line x1="240" y1="260" x2="640" y2="400" stroke="#00BBDD" stroke-width="6"/>
  <circle cx="240" cy="260" r="10" fill="#00BBDD" stroke="#FFFFFF" stroke-width="3"/>
  <circle cx="640" cy="400" r="10" fill="#00BBDD" stroke="#FFFFFF" stroke-width="3"/>
  
  <!-- Title -->
  <text x="20" y="45" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#333333" font-weight="bold">Multiple Parallel Routes</text>
  <text x="20" y="440" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#666666">4 origin-destination pairs</text>
</svg>`;

    const outputPath = path.join(__dirname, 'route-multiple-origin-destinations', 'content', 'thumbnail.svg');
    fs.writeFileSync(outputPath, svg);
    console.log('Created:', outputPath);
}

// Run both generators
createMultipleOriginsThumb();
createMultipleOriginDestinationsThumb();
console.log('Thumbnails generated successfully!');
