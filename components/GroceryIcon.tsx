import React, { memo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getIconForItem, getCategoryIcon } from '@/lib/groceryIcons';
import type { GroceryCategory } from '@/types/grocery';

interface GroceryIconProps {
    /** Item name for keyword matching */
    name?: string;
    /** Category for fallback icon */
    category: GroceryCategory;
    /** Icon size in points */
    size?: number;
    /** Icon color */
    color?: string;
}

/**
 * Renders a MaterialCommunityIcons icon matched to a grocery item.
 * If no name is provided, renders the category fallback icon.
 */
export const GroceryIcon = memo(function GroceryIcon({
    name,
    category,
    size = 20,
    color = '#000',
}: GroceryIconProps) {
    const iconName = name
        ? getIconForItem(name, category)
        : getCategoryIcon(category);

    return (
        <MaterialCommunityIcons
            name={iconName as any}
            size={size}
            color={color}
        />
    );
});
