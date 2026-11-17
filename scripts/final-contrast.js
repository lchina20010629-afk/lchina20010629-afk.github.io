function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16)};
}
function luminance(r, g, b) {
  const a = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
function contrast(rgb1, rgb2) {
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b), lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
}

const checks = [
  { name: 'Cream-Green', bg: '#4F7A3E', hover: '#3F6432' },
  { name: 'Warm-Apricot', bg: '#A05428', hover: '#8A4820' },
];

console.log('✅ FINAL Contrast (white text):\n');
checks.forEach(c => {
  const r1 = contrast(hexToRgb(c.bg), hexToRgb('#FFFFFF'));
  const r2 = contrast(hexToRgb(c.hover), hexToRgb('#FFFFFF'));
  console.log(`${c.name}: ${r1.toFixed(2)}:1 ${r1>=4.5?'✓':'✗'}, hover: ${r2.toFixed(2)}:1 ${r2>=4.5?'✓':'✗'}`);
});
