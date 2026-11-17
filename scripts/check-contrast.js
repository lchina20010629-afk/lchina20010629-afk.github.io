// Check WCAG AA contrast ratios for theme colors
// AA requires 4.5:1 for normal text, 3:1 for large text/UI

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

// Check problematic combinations
const checks = [
  { name: 'Cream-Green button', bg: '#7FB069', fg: '#FFFFFF' },
  { name: 'Cream-Green button hover', bg: '#6A9557', fg: '#FFFFFF' },
  { name: 'Warm-Apricot button', bg: '#E8956B', fg: '#FFFFFF' },
  { name: 'Warm-Apricot button hover', bg: '#D47A4F', fg: '#FFFFFF' },
  { name: 'Cream-Green text on bg', bg: '#FAF9F6', fg: '#2C3E50' },
  { name: 'Warm-Apricot text on bg', bg: '#FFF8F0', fg: '#5C3D2E' },
];

console.log('WCAG AA Contrast Check:\n');
checks.forEach(check => {
  const bg = hexToRgb(check.bg);
  const fg = hexToRgb(check.fg);
  const ratio = contrast(bg, fg);
  const passAA = ratio >= 4.5;
  const passUI = ratio >= 3.0;
  console.log(`${check.name}:`);
  console.log(`  BG: ${check.bg}, FG: ${check.fg}`);
  console.log(`  Ratio: ${ratio.toFixed(2)}:1`);
  console.log(`  AA Text: ${passAA ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  UI Components: ${passUI ? '✓ PASS' : '✗ FAIL'}`);
  console.log('');
});
