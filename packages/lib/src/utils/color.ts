const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const isLight = (hexColor: string): boolean => {
  if (!HEX_COLOR_RE.test(hexColor)) return true;

  let r = 0;
  let g = 0;
  let b = 0;
  if (hexColor.length === 4) {
    r = parseInt(`${hexColor[1]}${hexColor[1]}`, 16);
    g = parseInt(`${hexColor[2]}${hexColor[2]}`, 16);
    b = parseInt(`${hexColor[3]}${hexColor[3]}`, 16);
  } else {
    r = parseInt(`${hexColor[1]}${hexColor[2]}`, 16);
    g = parseInt(`${hexColor[3]}${hexColor[4]}`, 16);
    b = parseInt(`${hexColor[5]}${hexColor[6]}`, 16);
  }

  return (r * 2126 + g * 7152 + b * 722) / 10000 >= 128;
};
