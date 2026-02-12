const swatchGrid = document.querySelector('#swatch-grid');
const swatchCount = document.querySelector('#swatch-count');
const matchForm = document.querySelector('#match-form');
const matchName = document.querySelector('#match-name');
const matchMeta = document.querySelector('#match-meta');
const matchSwatch = document.querySelector('#match-swatch');
const hexInput = document.querySelector('#hex-input');
const colorPicker = document.querySelector('#color-picker');
const filterColor = document.querySelector('#filter-color');
const filterType = document.querySelector('#filter-type');
const filterBrand = document.querySelector('#filter-brand');
const sortBy = document.querySelector('#sort-by');

const state = {
  swatches: [],
  filters: {
    color: 'all',
    type: 'all',
    brand: 'all',
    sort: 'hex',
  },
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

const getColorFamily = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'Unknown';
  const { hue, saturation, lightness } = rgbToHsl(rgb);

  if (saturation < 0.08) {
    if (lightness > 0.92) return 'White';
    if (lightness < 0.12) return 'Black';
    return 'Gray';
  }

  if (hue >= 10 && hue < 35) return 'Orange';
  if (hue >= 35 && hue < 70) return 'Yellow';
  if (hue >= 70 && hue < 165) return 'Green';
  if (hue >= 165 && hue < 200) return 'Teal';
  if (hue >= 200 && hue < 250) return 'Blue';
  if (hue >= 250 && hue < 295) return 'Purple';
  if (hue >= 295 && hue < 330) return 'Magenta';
  return 'Red';
};

const getHslInfo = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return {
      hue: 360,
      saturation: 0,
      lightness: 0,
    };
  }
  return rgbToHsl(rgb);
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

const flattenSwatchData = (data) => {
  if (!Array.isArray(data)) return [];

  const first = data[0];
  if (first && Array.isArray(first.brands)) {
    return data.flatMap((swatch) => {
      const normalizedHex = normalizeHex(swatch.hex);
      if (!normalizedHex || !swatch.type || !Array.isArray(swatch.brands)) return [];
      return swatch.brands
        .filter((entry) => entry && entry.brand && entry.colorName)
        .map((entry) => ({
          type: swatch.type,
          brand: entry.brand,
          colorName: entry.colorName,
          hex: normalizedHex,
        }));
    });
  }

  return data
    .map((swatch) => ({
      type: swatch.type,
      brand: swatch.brand,
      colorName: swatch.colorName,
      hex: normalizeHex(swatch.hex),
    }))
    .filter((swatch) => swatch.type && swatch.brand && swatch.colorName && swatch.hex);
};

const groupByHex = (flatSwatches) => {
  const grouped = new Map();

  flatSwatches.forEach((swatch) => {
    if (!grouped.has(swatch.hex)) {
      grouped.set(swatch.hex, {
        hex: swatch.hex,
        entries: [],
      });
    }
    const group = grouped.get(swatch.hex);
    if (!group.entryKeys) group.entryKeys = new Set();

    const entryKey = `${swatch.type}::${swatch.brand}::${swatch.colorName}`.toLowerCase();
    if (!group.entryKeys.has(entryKey)) {
      group.entryKeys.add(entryKey);
      group.entries.push({
        type: swatch.type,
        brand: swatch.brand,
        colorName: swatch.colorName,
      });
    }
  });

  return Array.from(grouped.values()).map(({ entryKeys, ...swatch }) => swatch);
};

const pickPrimaryColorName = (entries) => {
  if (!entries.length) return 'Unknown';

  const normalizedCounts = new Map();
  const originalByNormalized = new Map();

  entries.forEach((entry) => {
    const original = (entry.colorName || '').trim();
    if (!original) return;
    const normalized = original.toLowerCase();
    normalizedCounts.set(normalized, (normalizedCounts.get(normalized) || 0) + 1);

    const currentBest = originalByNormalized.get(normalized);
    if (!currentBest || original.length < currentBest.length) {
      originalByNormalized.set(normalized, original);
    }
  });

  if (!normalizedCounts.size) return entries[0].colorName || 'Unknown';

  const sortedByPreference = Array.from(normalizedCounts.entries()).sort((a, b) => {
    const countDiff = b[1] - a[1];
    if (countDiff !== 0) return countDiff;

    const aOriginal = originalByNormalized.get(a[0]);
    const bOriginal = originalByNormalized.get(b[0]);
    const lengthDiff = aOriginal.length - bOriginal.length;
    if (lengthDiff !== 0) return lengthDiff;

    return aOriginal.localeCompare(bOriginal);
  });

  return originalByNormalized.get(sortedByPreference[0][0]);
};

const formatVariant = (entry, primaryColorName) => {
  const base = `${entry.brand} - ${entry.type}`;
  if (!entry.colorName) {
    return base;
  }

  if (entry.colorName.toLowerCase() === primaryColorName.toLowerCase()) {
    return base;
  }

  return `${base} (${entry.colorName})`;
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
    name.textContent = swatch.primaryColorName;

    const meta = document.createElement('p');
    meta.className = 'swatch-meta';
    meta.textContent = swatch.variantDisplay;

    const hex = document.createElement('p');
    hex.className = 'swatch-hex';
    hex.textContent = swatch.hex.toUpperCase();

    card.append(preview, name, meta, hex);
    swatchGrid.append(card);
  });

  swatchCount.textContent = `${swatches.length} of ${state.swatches.length} grouped colors shown`;
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
  matchName.textContent = match.primaryColorName;
  const description = describeColor(match.hex);
  const descriptionText = description ? ` · ${description}` : '';
  matchMeta.textContent = `${match.variantDisplay}${descriptionText} · ${match.hex.toUpperCase()} (input ${inputHex.toUpperCase()})`;
};

const findClosestMatch = (hex, swatches) => {
  if (!swatches.length) return null;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  swatches.forEach((swatch) => {
    const distance = colorDistance(hex, swatch.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = swatch;
    }
  });

  return best;
};

const getFilteredSwatches = () => {
  const { color, type, brand, sort } = state.filters;
  const filtered = state.swatches.filter((swatch) => {
    const colorMatch = color === 'all' || swatch.colorFamily === color;
    const typeMatch = type === 'all' || swatch.typeNames.includes(type);
    const brandMatch = brand === 'all' || swatch.brandNames.includes(brand);
    return colorMatch && typeMatch && brandMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') {
      return a.primaryColorName.localeCompare(b.primaryColorName);
    }
    if (sort === 'brand') {
      return a.brandSort.localeCompare(b.brandSort) || a.primaryColorName.localeCompare(b.primaryColorName);
    }
    if (sort === 'type') {
      return a.typeSort.localeCompare(b.typeSort) || a.primaryColorName.localeCompare(b.primaryColorName);
    }
    if (sort === 'color') {
      return a.hue - b.hue || a.lightness - b.lightness || a.primaryColorName.localeCompare(b.primaryColorName);
    }
    return a.hex.localeCompare(b.hex) || a.primaryColorName.localeCompare(b.primaryColorName);
  });

  return sorted;
};

const syncPickerToHex = (hex) => {
  if (hex && colorPicker) {
    colorPicker.value = hex;
  }
};

const updateMatch = ({ showError }) => {
  const normalized = normalizeHex(hexInput.value);
  if (!normalized) {
    if (showError) {
      matchName.textContent = 'Enter a valid hex color';
      matchMeta.textContent = 'Use 3 or 6 digit hex values like #ff6b4a.';
      matchSwatch.style.background =
        'repeating-linear-gradient(45deg, #fca5a5, #fca5a5 10px, #fecaca 10px, #fecaca 20px)';
    }
    return;
  }

  const match = findClosestMatch(normalized, getFilteredSwatches());
  updateMatchResult(match, normalized);
  syncPickerToHex(normalized);
};

const refreshSwatches = () => {
  const swatches = getFilteredSwatches();
  renderSwatches(swatches);
  updateMatch({ showError: false });
};

const setSelectOptions = (select, options, label) => {
  select.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = `All ${label}`;
  select.append(allOption);
  options.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    select.append(option);
  });
};

const populateFilters = (swatches) => {
  const colors = new Set();
  const types = new Set();
  const brands = new Set();

  swatches.forEach((swatch) => {
    colors.add(swatch.colorFamily);
    swatch.typeNames.forEach((typeName) => types.add(typeName));
    swatch.brandNames.forEach((brandName) => brands.add(brandName));
  });

  const sortedColors = Array.from(colors).sort((a, b) => a.localeCompare(b));
  const sortedTypes = Array.from(types).sort((a, b) => a.localeCompare(b));
  const sortedBrands = Array.from(brands).sort((a, b) => a.localeCompare(b));

  setSelectOptions(filterColor, sortedColors, 'colors');
  setSelectOptions(filterType, sortedTypes, 'types');
  setSelectOptions(filterBrand, sortedBrands, 'brands');
};

matchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  updateMatch({ showError: true });
});

colorPicker.addEventListener('input', (event) => {
  hexInput.value = event.target.value.toUpperCase();
  updateMatch({ showError: false });
});

hexInput.addEventListener('input', () => {
  const normalized = normalizeHex(hexInput.value);
  if (normalized) {
    syncPickerToHex(normalized);
  }
});

filterColor.addEventListener('change', (event) => {
  state.filters.color = event.target.value;
  refreshSwatches();
});

filterType.addEventListener('change', (event) => {
  state.filters.type = event.target.value;
  refreshSwatches();
});

filterBrand.addEventListener('change', (event) => {
  state.filters.brand = event.target.value;
  refreshSwatches();
});

sortBy.addEventListener('change', (event) => {
  state.filters.sort = event.target.value;
  refreshSwatches();
});

const init = async () => {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    const groupedData = groupByHex(flattenSwatchData(data));

    state.swatches = groupedData.map((swatch) => {
      const hsl = getHslInfo(swatch.hex);
      const sortedEntries = [...swatch.entries].sort((a, b) => {
        return (
          a.type.localeCompare(b.type) ||
          a.brand.localeCompare(b.brand) ||
          a.colorName.localeCompare(b.colorName)
        );
      });

      const typeNames = Array.from(new Set(sortedEntries.map((entry) => entry.type)));
      const brandNames = Array.from(new Set(sortedEntries.map((entry) => entry.brand)));
      const primaryColorName = pickPrimaryColorName(sortedEntries);

      return {
        ...swatch,
        entries: sortedEntries,
        primaryColorName,
        variantDisplay: sortedEntries.map((entry) => formatVariant(entry, primaryColorName)).join(', '),
        typeNames,
        brandNames,
        typeSort: typeNames[0],
        brandSort: brandNames[0],
        colorFamily: getColorFamily(swatch.hex),
        hue: hsl.saturation < 0.08 ? 360 : hsl.hue,
        lightness: hsl.lightness,
      };
    });

    populateFilters(state.swatches);
    refreshSwatches();
    updateMatch({ showError: false });
  } catch (error) {
    swatchGrid.innerHTML =
      '<p class="swatch-meta">Unable to load swatches. Check data.json.</p>';
  }
};

init();
