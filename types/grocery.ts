/**
 * Grocery Shopping System Types
 * 
 * Treats groceries as a recurring life system with smart categorization,
 * pantry staple tracking, and shopping mode.
 */

/** Item categories mapped to typical supermarket layout */
export type GroceryCategory =
    | 'produce'
    | 'dairy'
    | 'meat'
    | 'bakery'
    | 'frozen'
    | 'pantry'
    | 'beverages'
    | 'snacks'
    | 'household'
    | 'personal';

/** Replenishment frequency for pantry staples */
export type ReplenishFrequency =
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'as_needed'
    | 'one_time';

export interface GroceryItem {
    id: string;
    name: string;
    /** Auto-assigned or manual category */
    category: GroceryCategory;
    /** e.g. "2 lbs", "1 dozen", "6 pack" */
    quantity?: string;
    /** Optional preferred brand */
    brand?: string;
    /** e.g. "Get the organic one" */
    notes?: string;
    /** How often you typically buy this */
    frequency: ReplenishFrequency;
    /** Pantry staple vs one-time purchase */
    isStaple: boolean;
    /** Currently needs to be bought */
    isOnList: boolean;
    /** Last purchase date (ISO string) */
    lastPurchased?: string;
    /** History of purchase dates (ISO strings) */
    purchaseHistory: string[];
    /** When item was marked purchased this shopping session (ISO string) */
    purchasedAt?: string;
    createdAt: string;
    /** Manual sorting within category */
    order: number;
}

export interface GroceryStats {
    totalItems: number;
    onListCount: number;
    categoryBreakdown: Record<GroceryCategory, number>;
    avgWeeklyItems: number;
}

/** Category configuration for UI */
export const CATEGORY_CONFIG: Record<GroceryCategory, { label: string; icon: string; color: string; order: number }> = {
    produce: { label: 'Produce', icon: 'fruit-cherries', color: '#34C759', order: 0 },
    dairy: { label: 'Dairy', icon: 'cup', color: '#5AC8FA', order: 1 },
    meat: { label: 'Meat & Seafood', icon: 'food-drumstick', color: '#FF6961', order: 2 },
    bakery: { label: 'Bakery', icon: 'bread-slice', color: '#FFCC00', order: 3 },
    frozen: { label: 'Frozen', icon: 'snowflake', color: '#00C7BE', order: 4 },
    pantry: { label: 'Pantry', icon: 'cupboard-outline', color: '#FF9500', order: 5 },
    beverages: { label: 'Beverages', icon: 'cup-water', color: '#007AFF', order: 6 },
    snacks: { label: 'Snacks', icon: 'cookie', color: '#AF52DE', order: 7 },
    household: { label: 'Household', icon: 'broom', color: '#8E8E93', order: 8 },
    personal: { label: 'Personal Care', icon: 'hand-wash-outline', color: '#FF2D55', order: 9 },
};

/** Frequency configuration for UI */
export const FREQUENCY_CONFIG: Record<ReplenishFrequency, { label: string; shortLabel: string }> = {
    weekly: { label: 'Weekly', shortLabel: '1w' },
    biweekly: { label: 'Every 2 Weeks', shortLabel: '2w' },
    monthly: { label: 'Monthly', shortLabel: '1m' },
    as_needed: { label: 'As Needed', shortLabel: '—' },
    one_time: { label: 'One Time', shortLabel: '1x' },
};

/** Keywords for auto-categorization */
export const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
    produce: [
        'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
        'lettuce', 'spinach', 'kale', 'tomato', 'onion', 'garlic', 'potato', 'carrot',
        'broccoli', 'cauliflower', 'pepper', 'cucumber', 'celery', 'avocado', 'mango',
        'pineapple', 'watermelon', 'peach', 'pear', 'plum', 'cherry', 'mushroom',
        'zucchini', 'squash', 'corn', 'asparagus', 'green bean', 'pea', 'cabbage',
    ],
    dairy: [
        'milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'eggs', 'sour cream',
        'cottage cheese', 'cream cheese', 'half and half', 'whipped cream', 'ice cream',
        'parmesan', 'mozzarella', 'cheddar', 'feta', 'brie', 'gouda',
    ],
    meat: [
        'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon',
        'sausage', 'ham', 'turkey', 'lamb', 'steak', 'ground beef', 'ground turkey',
        'hot dog', 'deli', 'prosciutto', 'pepperoni', 'crab', 'lobster', 'scallop',
    ],
    bakery: [
        'bread', 'bagel', 'croissant', 'muffin', 'donut', 'cake', 'pie', 'cookie',
        'roll', 'bun', 'tortilla', 'pita', 'baguette', 'sourdough', 'ciabatta',
    ],
    frozen: [
        'frozen', 'ice', 'pizza', 'frozen vegetable', 'frozen fruit', 'frozen meal',
        'frozen dinner', 'popsicle', 'frozen yogurt', 'sorbet', 'frozen waffle',
    ],
    pantry: [
        'pasta', 'rice', 'bean', 'lentil', 'flour', 'sugar', 'salt', 'oil', 'vinegar',
        'sauce', 'soup', 'can', 'canned', 'cereal', 'oatmeal', 'granola', 'honey',
        'peanut butter', 'jam', 'jelly', 'syrup', 'spice', 'seasoning', 'broth',
        'stock', 'noodle', 'quinoa', 'couscous',
    ],
    beverages: [
        'water', 'juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'sparkling',
        'kombucha', 'smoothie', 'lemonade', 'energy drink', 'sports drink',
    ],
    snacks: [
        'chip', 'cracker', 'pretzel', 'popcorn', 'nut', 'trail mix', 'candy',
        'chocolate', 'gummy', 'granola bar', 'protein bar', 'dried fruit', 'jerky',
    ],
    household: [
        'paper towel', 'toilet paper', 'napkin', 'trash bag', 'cleaning', 'detergent',
        'dish soap', 'sponge', 'bleach', 'wipe', 'foil', 'plastic wrap', 'ziploc',
        'light bulb', 'battery', 'candle',
    ],
    personal: [
        'shampoo', 'conditioner', 'soap', 'body wash', 'lotion', 'deodorant',
        'toothpaste', 'toothbrush', 'floss', 'razor', 'shaving', 'sunscreen',
        'medicine', 'vitamin', 'bandage', 'tissue', 'makeup', 'cotton',
    ],
};
