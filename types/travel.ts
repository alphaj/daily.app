export type PackingCategory =
    | 'clothes'
    | 'toiletries'
    | 'electronics'
    | 'documents'
    | 'medications'
    | 'accessories'
    | 'misc';

export type TripStatus = 'packing' | 'traveling' | 'completed';

export interface PackingItem {
    id: string;
    name: string;
    category: PackingCategory;
    packed: boolean;
    quantity: number;
    createdAt: string;
    order: number;
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
    order: number;
}

export type ExpenseCategory = 'flight' | 'hotel' | 'food' | 'transport' | 'activity' | 'other';

export interface TripExpense {
    id: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    date: string;
    createdAt: string;
}

export interface PackingTemplate {
    id: string;
    name: string;
    items: { name: string; category: PackingCategory; quantity: number }[];
    checklistItems?: string[];
    createdAt: string;
}

export interface Trip {
    id: string;
    name: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    items: PackingItem[];
    checklist?: ChecklistItem[];
    expenses?: TripExpense[];
    status: TripStatus;
    createdAt: string;
}

export const PACKING_CATEGORY_CONFIG: Record<PackingCategory, { label: string; icon: string; color: string; order: number }> = {
    clothes: { label: 'Clothes', icon: 'Shirt', color: '#007AFF', order: 0 },
    toiletries: { label: 'Toiletries', icon: 'Droplets', color: '#5AC8FA', order: 1 },
    electronics: { label: 'Electronics', icon: 'Laptop', color: '#FF9500', order: 2 },
    documents: { label: 'Documents', icon: 'FileText', color: '#8E8E93', order: 3 },
    medications: { label: 'Medications', icon: 'Pill', color: '#FF2D55', order: 4 },
    accessories: { label: 'Accessories', icon: 'Watch', color: '#AF52DE', order: 5 },
    misc: { label: 'Misc', icon: 'Package', color: '#34C759', order: 6 },
};

export const SUGGESTED_PACKING_ITEMS: { name: string; category: PackingCategory }[] = [
    // Clothes
    { name: 'T-shirts', category: 'clothes' },
    { name: 'Pants', category: 'clothes' },
    { name: 'Shorts', category: 'clothes' },
    { name: 'Underwear', category: 'clothes' },
    { name: 'Socks', category: 'clothes' },
    { name: 'Pajamas', category: 'clothes' },
    { name: 'Jacket', category: 'clothes' },
    { name: 'Sweater', category: 'clothes' },
    { name: 'Dress shirt', category: 'clothes' },
    { name: 'Swimsuit', category: 'clothes' },
    { name: 'Shoes', category: 'clothes' },
    { name: 'Sandals', category: 'clothes' },
    { name: 'Belt', category: 'clothes' },
    { name: 'Hat', category: 'clothes' },

    // Toiletries
    { name: 'Toothbrush', category: 'toiletries' },
    { name: 'Toothpaste', category: 'toiletries' },
    { name: 'Deodorant', category: 'toiletries' },
    { name: 'Shampoo', category: 'toiletries' },
    { name: 'Conditioner', category: 'toiletries' },
    { name: 'Body wash', category: 'toiletries' },
    { name: 'Razor', category: 'toiletries' },
    { name: 'Sunscreen', category: 'toiletries' },
    { name: 'Face wash', category: 'toiletries' },
    { name: 'Moisturizer', category: 'toiletries' },

    // Electronics
    { name: 'Phone charger', category: 'electronics' },
    { name: 'Laptop', category: 'electronics' },
    { name: 'Laptop charger', category: 'electronics' },
    { name: 'Headphones', category: 'electronics' },
    { name: 'Power bank', category: 'electronics' },
    { name: 'Camera', category: 'electronics' },
    { name: 'Travel adapter', category: 'electronics' },
    { name: 'USB cable', category: 'electronics' },
    { name: 'Kindle/E-reader', category: 'electronics' },

    // Documents
    { name: 'Passport', category: 'documents' },
    { name: 'ID/License', category: 'documents' },
    { name: 'Boarding pass', category: 'documents' },
    { name: 'Travel insurance', category: 'documents' },
    { name: 'Hotel confirmation', category: 'documents' },
    { name: 'Credit cards', category: 'documents' },
    { name: 'Cash', category: 'documents' },

    // Medications
    { name: 'Prescription meds', category: 'medications' },
    { name: 'Pain relievers', category: 'medications' },
    { name: 'Allergy medicine', category: 'medications' },
    { name: 'Vitamins', category: 'medications' },
    { name: 'Band-aids', category: 'medications' },

    // Accessories
    { name: 'Sunglasses', category: 'accessories' },
    { name: 'Watch', category: 'accessories' },
    { name: 'Wallet', category: 'accessories' },
    { name: 'Backpack/Day bag', category: 'accessories' },
    { name: 'Umbrella', category: 'accessories' },
    { name: 'Travel pillow', category: 'accessories' },
    { name: 'Water bottle', category: 'accessories' },
    { name: 'Luggage lock', category: 'accessories' },

    // Misc
    { name: 'Snacks', category: 'misc' },
    { name: 'Books', category: 'misc' },
    { name: 'Laundry bag', category: 'misc' },
    { name: 'Zip-lock bags', category: 'misc' },
    { name: 'Packing cubes', category: 'misc' },
];

export const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
    flight: { label: 'Flight', icon: 'Plane', color: '#007AFF' },
    hotel: { label: 'Hotel', icon: 'Building2', color: '#5856D6' },
    food: { label: 'Food', icon: 'UtensilsCrossed', color: '#FF9500' },
    transport: { label: 'Transport', icon: 'Car', color: '#34C759' },
    activity: { label: 'Activity', icon: 'Ticket', color: '#FF2D55' },
    other: { label: 'Other', icon: 'Receipt', color: '#8E8E93' },
};

export const SUGGESTED_CHECKLIST_ITEMS: string[] = [
    'Book flights',
    'Book accommodation',
    'Arrange airport transfer',
    'Check passport expiry',
    'Get travel insurance',
    'Notify bank of travel',
    'Download offline maps',
    'Charge devices',
    'Set out-of-office',
    'Water plants / pet sitter',
    'Lock all doors & windows',
    'Print confirmations',
];
