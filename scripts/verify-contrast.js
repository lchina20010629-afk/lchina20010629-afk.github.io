// Verify fixed contrast ratios
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(rgb1, rgb2) {
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Check FIXED combinations
const checks = [
  { name: 'FIXED Cream-Green button', bg: '#5A8547', fg: '#FFFFFF' },
  { name: 'FIXED Cream-Green hover', bg: '#4A753D', fg: '#FFFFFF' },
  { name: 'FIXED Warm-Apricot button', bg: '#B56438', fg: '#FFFFFF' },
  { name: 'FIXED Warm-Apricot hover', bg: '#A05428', fg: '#FFFFFF' },
];

console.log('✓ FIXED Contrast Verification:\n');
checks.forEach(check => {
  const bg = hexToRgb(check.bg);
  const fg = hexToRgb(check.fg);
  const ratio = contrast(bg, fg);
  const passAA = ratio >= 4.5;
  console.log(`${check.name}:`);
  console.log(`  ${check.bg} on ${check.fg}: ${ratio.toFixed(2)}:1 ${passAA ? '✓✓ AA PASS' : '✗✗ FAIL'}`);
});
