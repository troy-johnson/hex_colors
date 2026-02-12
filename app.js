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
  expandedSwatches: new Set(),
  filters: {
    color: 'all',
    type: 'all',
    brand: 'all',
    sort: 'color',
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

const groupFlatSwatches = (swatches) => {
  const grouped = new Map();

  swatches.forEach((swatch) => {
    const normalizedHex = normalizeHex(swatch.hex);
    if (!normalizedHex) return;

    if (!grouped.has(normalizedHex)) {
      grouped.set(normalizedHex, {
        hex: normalizedHex,
        options: [],
      });
    }

    grouped.get(normalizedHex).options.push({
      brand: swatch.brand,
      type: swatch.type,
      colorName: swatch.colorName,
    });
  });

  return Array.from(grouped.values());
};

const normalizeSwatchData = (data) => {
  if (!Array.isArray(data)) return [];
  const first = data[0];

  if (first && Array.isArray(first.brands)) {
    const flattened = [];
    data.forEach((swatch) => {
      const hex = normalizeHex(swatch.hex);
      if (!hex || !swatch.type || !Array.isArray(swatch.brands)) return;

      swatch.brands
        .filter((entry) => entry && entry.brand && entry.colorName)
        .forEach((entry) => {
          flattened.push({
            hex,
            type: swatch.type,
            brand: entry.brand,
            colorName: entry.colorName,
          });
        });
    });

    return groupFlatSwatches(flattened);
  }

  return groupFlatSwatches(data);
};

const getVisibleOptionLabels = (swatch) => {
  const expanded = state.expandedSwatches.has(swatch.hex);
  return expanded ? swatch.allOptionLabels : swatch.allOptionLabels.slice(0, 3);
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

    const visibleLabels = getVisibleOptionLabels(swatch);

    const meta = document.createElement('p');
    meta.className = 'swatch-meta';
    meta.textContent = visibleLabels.join(', ');

    const hex = document.createElement('p');
    hex.className = 'swatch-hex';
    hex.textContent = swatch.hex.toUpperCase();

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'swatch-expand';
    const expanded = state.expandedSwatches.has(swatch.hex);
    toggle.textContent = expanded ? 'Show less' : 'Click for more';
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle.dataset.hex = swatch.hex;

    if (swatch.allOptionLabels.length <= 3) {
      toggle.style.display = 'none';
    } else {
      card.classList.add('swatch-card--expandable');
    }

    card.append(preview, name, hex, meta, toggle);
    swatchGrid.append(card);
  });

  swatchGrid.querySelectorAll('.swatch-expand').forEach((button) => {
    button.addEventListener('click', () => {
      const targetHex = button.dataset.hex;
      if (!targetHex) return;

      if (state.expandedSwatches.has(targetHex)) {
        state.expandedSwatches.delete(targetHex);
      } else {
        state.expandedSwatches.add(targetHex);
      }

      refreshSwatches();
    });
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
  matchMeta.textContent = `${getVisibleOptionLabels(match).join(', ')}${descriptionText} · ${match.hex.toUpperCase()} (input ${inputHex.toUpperCase()})`;
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
    const typeMatch = type === 'all' || swatch.types.includes(type);
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
    return a.hue - b.hue || a.saturation - b.saturation || a.lightness - b.lightness || a.primaryColorName.localeCompare(b.primaryColorName);
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
    swatch.types.forEach((typeName) => types.add(typeName));
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
    const groupedData = normalizeSwatchData(data);

    state.swatches = groupedData.map((swatch) => {
      const hsl = getHslInfo(swatch.hex);
      const sortedOptions = [...swatch.options].sort((a, b) => {
        return a.brand.localeCompare(b.brand) || a.type.localeCompare(b.type) || a.colorName.localeCompare(b.colorName);
      });

      const allOptionLabels = sortedOptions.map((entry) => `${entry.brand} - ${entry.type}`);
      const colorNameCounts = sortedOptions.reduce((counts, entry) => {
        counts.set(entry.colorName, (counts.get(entry.colorName) || 0) + 1);
        return counts;
      }, new Map());
      const primaryColorName = [...colorNameCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];

      return {
        ...swatch,
        options: sortedOptions,
        allOptionLabels,
        primaryColorName,
        brandNames: [...new Set(sortedOptions.map((entry) => entry.brand))],
        types: [...new Set(sortedOptions.map((entry) => entry.type))],
        brandSort: sortedOptions[0].brand,
        typeSort: sortedOptions[0].type,
        colorFamily: getColorFamily(swatch.hex),
        hue: hsl.saturation < 0.08 ? 360 : hsl.hue,
        saturation: hsl.saturation,
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
