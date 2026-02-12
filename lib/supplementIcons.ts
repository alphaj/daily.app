/**
 * Supplement Icon System
 *
 * Maps supplement names to MaterialCommunityIcons + colors via keyword matching.
 * Same pattern as packingIcons.ts / groceryIcons.ts.
 */

export interface SupplementIconResult {
    icon: string;
    color: string;
}

const DEFAULT_ICON: SupplementIconResult = { icon: 'pill', color: '#8E8E93' };

// Keyword → { icon, color } mapping (more specific keywords first)
const ICON_MAP: [string, SupplementIconResult][] = [
    // ── Vitamins ──
    ['multivitamin', { icon: 'pill', color: '#FF9500' }],
    ['prenatal', { icon: 'pill', color: '#FF9500' }],
    ['vitamin d', { icon: 'pill', color: '#FF9500' }],
    ['vitamin c', { icon: 'pill', color: '#FF9500' }],
    ['vitamin b', { icon: 'pill', color: '#FF9500' }],
    ['vitamin a', { icon: 'pill', color: '#FF9500' }],
    ['vitamin e', { icon: 'pill', color: '#FF9500' }],
    ['vitamin k', { icon: 'pill', color: '#FF9500' }],
    ['vitamin', { icon: 'pill', color: '#FF9500' }],

    // ── Minerals ──
    ['magnesium glycinate', { icon: 'weather-night', color: '#5E5CE6' }], // sleep variant
    ['magnesium', { icon: 'diamond-stone', color: '#5856D6' }],
    ['zinc', { icon: 'diamond-stone', color: '#5856D6' }],
    ['iron', { icon: 'diamond-stone', color: '#5856D6' }],
    ['calcium', { icon: 'diamond-stone', color: '#5856D6' }],
    ['potassium', { icon: 'diamond-stone', color: '#5856D6' }],
    ['selenium', { icon: 'diamond-stone', color: '#5856D6' }],
    ['chromium', { icon: 'diamond-stone', color: '#5856D6' }],

    // ── Omega / Oils ──
    ['fish oil', { icon: 'water', color: '#FF6B6B' }],
    ['omega', { icon: 'water', color: '#FF6B6B' }],
    ['cod liver', { icon: 'water', color: '#FF6B6B' }],
    ['flaxseed', { icon: 'water', color: '#FF6B6B' }],
    ['krill oil', { icon: 'water', color: '#FF6B6B' }],
    ['evening primrose', { icon: 'water', color: '#FF6B6B' }],

    // ── Herbal ──
    ['ashwagandha', { icon: 'leaf', color: '#34C759' }],
    ['turmeric', { icon: 'leaf', color: '#34C759' }],
    ['ginger', { icon: 'leaf', color: '#34C759' }],
    ['garlic', { icon: 'leaf', color: '#34C759' }],
    ['echinacea', { icon: 'leaf', color: '#34C759' }],
    ['ginseng', { icon: 'leaf', color: '#34C759' }],
    ['valerian', { icon: 'leaf', color: '#34C759' }],
    ['elderberry', { icon: 'leaf', color: '#34C759' }],
    ['milk thistle', { icon: 'leaf', color: '#34C759' }],
    ['st. john', { icon: 'leaf', color: '#34C759' }],

    // ── Probiotics ──
    ['probiotic', { icon: 'bacteria-outline', color: '#30B0C7' }],
    ['prebiotic', { icon: 'bacteria-outline', color: '#30B0C7' }],
    ['digestive enzyme', { icon: 'bacteria-outline', color: '#30B0C7' }],
    ['gut', { icon: 'bacteria-outline', color: '#30B0C7' }],
    ['fiber', { icon: 'bacteria-outline', color: '#30B0C7' }],

    // ── Protein / Fitness ──
    ['protein', { icon: 'dumbbell', color: '#AF52DE' }],
    ['creatine', { icon: 'dumbbell', color: '#AF52DE' }],
    ['bcaa', { icon: 'dumbbell', color: '#AF52DE' }],
    ['amino acid', { icon: 'dumbbell', color: '#AF52DE' }],
    ['collagen', { icon: 'dumbbell', color: '#AF52DE' }],
    ['whey', { icon: 'dumbbell', color: '#AF52DE' }],
    ['casein', { icon: 'dumbbell', color: '#AF52DE' }],

    // ── Sleep ──
    ['melatonin', { icon: 'weather-night', color: '#5E5CE6' }],
    ['sleep', { icon: 'weather-night', color: '#5E5CE6' }],

    // ── Energy ──
    ['caffeine', { icon: 'lightning-bolt', color: '#FFCC00' }],
    ['energy', { icon: 'lightning-bolt', color: '#FFCC00' }],
    ['b12', { icon: 'lightning-bolt', color: '#FFCC00' }],
    ['b-complex', { icon: 'lightning-bolt', color: '#FFCC00' }],
    ['coq10', { icon: 'lightning-bolt', color: '#FFCC00' }],

    // ── Liquid ──
    ['drops', { icon: 'flask-empty', color: '#007AFF' }],
    ['tincture', { icon: 'flask-empty', color: '#007AFF' }],
    ['liquid', { icon: 'flask-empty', color: '#007AFF' }],
    ['syrup', { icon: 'flask-empty', color: '#007AFF' }],
    ['oil', { icon: 'flask-empty', color: '#007AFF' }],

    // ── Topical ──
    ['cream', { icon: 'lotion-plus-outline', color: '#FF2D55' }],
    ['ointment', { icon: 'lotion-plus-outline', color: '#FF2D55' }],
    ['patch', { icon: 'lotion-plus-outline', color: '#FF2D55' }],
    ['topical', { icon: 'lotion-plus-outline', color: '#FF2D55' }],
];

/**
 * Returns the best icon name + color for a supplement based on its name.
 * Falls back to a gray pill icon if no keyword matches.
 */
export function getSupplementIcon(name: string): SupplementIconResult {
    const lower = name.toLowerCase();

    for (const [keyword, result] of ICON_MAP) {
        if (lower.includes(keyword)) {
            return result;
        }
    }

    return DEFAULT_ICON;
}
