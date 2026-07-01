/**
 * Immutable Category domain model.
 */
export interface Category {
  readonlyid: string;
  readonlyname: string;
  readonlydescription?: string;
  readonlycreatedAt: Date;
  readonlyupdatedAt: Date;
}

/**
 * Create a Category from raw data.
 */
export function createCategory(data: {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return Object.freeze({
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }) as unknown as Category;
}
