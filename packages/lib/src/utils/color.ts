type HSLArray = [number, number, number];

export const hexToHsl = (hexColor: string): HSLArray => {
  if (![4, 7].includes(hexColor.length)) return [0, 0, 100]; // Invalid hex return white

  // Convert hex to RGB first
  let r: any = 0;
  let g: any = 0;
  let b: any = 0;
  if (hexColor.length === 4) {
    r = `0x${hexColor[1]}${hexColor[1]}`;
    g = `0x${hexColor[2]}${hexColor[2]}`;
    b = `0x${hexColor[3]}${hexColor[3]}`;
  } else if (hexColor.length === 7) {
    r = `0x${hexColor[1]}${hexColor[2]}`;
    g = `0x${hexColor[3]}${hexColor[4]}`;
    b = `0x${hexColor[5]}${hexColor[6]}`;
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return [h, s, l];
};

export const hslArrayToCSS = (hslArray: HSLArray): string =>
  hslArray.map((color, i) => (i ? `${color}%` : color)).join(',');
