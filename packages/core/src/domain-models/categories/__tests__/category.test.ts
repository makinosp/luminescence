import { describe, it, expect } from 'vitest';
import { createCategory } from '../category.js';

describe('Category', () => {
  describe('createCategory', () => {
    it('should create an immutable category', () => {
      const category = createCategory({
        id: 'cat-1',
        name: 'Food & Dining',
        description: 'Restaurants and groceries',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(category.id).toBe('cat-1');
      expect(category.name).toBe('Food & Dining');
      expect(category.description).toBe('Restaurants and groceries');
    });

    it('should allow undefined description', () => {
      const category = createCategory({
        id: 'cat-2',
        name: 'Uncategorized',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(category.description).toBeUndefined();
    });
  });
});
