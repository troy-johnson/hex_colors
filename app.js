const swatchGrid = document.querySelector('#swatch-grid');
const swatchCount = document.querySelector('#swatch-count');
const matchForm = document.querySelector('#match-form');
const matchName = document.querySelector('#match-name');
const matchMeta = document.querySelector('#match-meta');
const matchSwatch = document.querySelector('#match-swatch');
const hexInput = document.querySelector('#hex-input');

const state = {
  swatches: [],
};

const normalizeHex = (value) => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
  if (!valid) return null;
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
};

const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = normalized.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return { r, g, b };
};

const colorDistance = (hexA, hexB) => {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return Number.POSITIVE_INFINITY;
  const dr = rgbA.r - rgbB.r;
  const dg = rgbA.g - rgbB.g;
  const db = rgbA.b - rgbB.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const rgbToHsl = ({ r, g, b }) => {
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;
  const max = Math.max(normalizedR, normalizedG, normalizedB);
  const min = Math.min(normalizedR, normalizedG, normalizedB);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === normalizedR) {
      hue = ((normalizedG - normalizedB) / delta) % 6;
    } else if (max === normalizedG) {
      hue = (normalizedB - normalizedR) / delta + 2;
    } else {
      hue = (normalizedR - normalizedG) / delta + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }

  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    hue,
    saturation,
    lightness,
  };
};

const describeColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { hue, saturation, lightness } = rgbToHsl(rgb);

  if (saturation < 0.08) {
    if (lightness > 0.92) return 'white';
    if (lightness < 0.12) return 'black';
    return lightness > 0.6 ? 'light gray' : 'charcoal gray';
  }

  let base;
  let shade;

  if (hue >= 10 && hue < 35) {
    base = 'orange';
    shade = lightness < 0.4 ? 'burnt orange' : 'tangerine';
  } else if (hue >= 35 && hue < 70) {
    base = 'yellow';
    shade = lightness < 0.45 ? 'golden yellow' : 'lemon yellow';
  } else if (hue >= 70 && hue < 165) {
    base = 'green';
    if (lightness < 0.25) shade = 'midnight green';
    else if (lightness < 0.4) shade = 'forest green';
    else if (lightness > 0.75) shade = 'mint green';
    else shade = 'spring green';
  } else if (hue >= 165 && hue < 200) {
    base = 'teal';
    shade = lightness < 0.35 ? 'deep teal' : 'seafoam teal';
  } else if (hue >= 200 && hue < 250) {
    base = 'blue';
    shade = lightness < 0.3 ? 'midnight blue' : 'sky blue';
  } else if (hue >= 250 && hue < 295) {
    base = 'purple';
    shade = lightness < 0.35 ? 'deep purple' : 'lavender';
  } else if (hue >= 295 && hue < 330) {
    base = 'magenta';
    shade = lightness < 0.35 ? 'berry magenta' : 'orchid';
  } else {
    base = 'red';
    shade = lightness < 0.35 ? 'brick red' : 'crimson';
  }

  if (!shade || shade === base) {
    return base;
  }

  return `${base} or ${shade}`;
};

const renderSwatches = (swatches) => {
  swatchGrid.innerHTML = '';

  swatches.forEach((swatch) => {
    const card = document.createElement('article');
    card.className = 'swatch-card';

    const preview = document.createElement('div');
    preview.className = 'swatch-preview';
    preview.style.background = swatch.hex;

    const name = document.createElement('h3');
    name.className = 'swatch-name';
    name.textContent = swatch.colorName;

    const meta = document.createElement('p');
    meta.className = 'swatch-meta';
    meta.textContent = `${swatch.brand} · ${swatch.type}`;

    const hex = document.createElement('p');
    hex.className = 'swatch-hex';
    hex.textContent = swatch.hex.toUpperCase();

    card.append(preview, name, meta, hex);
    swatchGrid.append(card);
  });

  swatchCount.textContent = `${swatches.length} colors loaded`;
};

const updateMatchResult = (match, inputHex) => {
  if (!match) {
    matchName.textContent = 'No match found';
    matchMeta.textContent = '';
    matchSwatch.style.background =
      'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 10px, #f3f4f6 10px, #f3f4f6 20px)';
    return;
  }

  matchSwatch.style.background = match.hex;
  matchName.textContent = match.colorName;
  const description = describeColor(match.hex);
  const descriptionText = description ? ` · ${description}` : '';
  matchMeta.textContent = `${match.brand} · ${match.type}${descriptionText} · ${match.hex.toUpperCase()} (input ${inputHex.toUpperCase()})`;
};

const findClosestMatch = (hex) => {
  if (!state.swatches.length) return null;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  state.swatches.forEach((swatch) => {
    const distance = colorDistance(hex, swatch.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = swatch;
    }
  });

  return best;
};

matchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const normalized = normalizeHex(hexInput.value);

  if (!normalized) {
    matchName.textContent = 'Enter a valid hex color';
    matchMeta.textContent = 'Use 3 or 6 digit hex values like #ff6b4a.';
    matchSwatch.style.background =
      'repeating-linear-gradient(45deg, #fca5a5, #fca5a5 10px, #fecaca 10px, #fecaca 20px)';
    return;
  }

  const match = findClosestMatch(normalized);
  updateMatchResult(match, normalized);
});

const init = async () => {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    state.swatches = data;
    renderSwatches(data);
  } catch (error) {
    swatchGrid.innerHTML =
      '<p class="swatch-meta">Unable to load swatches. Check data.json.</p>';
  }
};

init();
