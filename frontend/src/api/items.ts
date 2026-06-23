const API = import.meta.env.VITE_API_BASE_URL || '';

export interface NutritionalValue { name: string; value: string; }
export interface FeedingRow { petWeight: string; amount: string; }

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  imageFile?: string;
  category: string;
  active: boolean;
  badge?: 'new' | 'sale';
  stock?: number;
  weight?: string;
  ingredients?: string;
  nutritionalValues?: NutritionalValue[];
  feedingTable?: FeedingRow[];
  feedingNote?: string;
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API}/api/products`);
  if (!res.ok) throw new Error(`Failed to load products: ${res.status}`);
  return (await res.json()) as Item[];
}
