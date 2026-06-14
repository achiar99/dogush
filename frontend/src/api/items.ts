const API = import.meta.env.VITE_API_BASE_URL || '';

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
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API}/api/products`);
  if (!res.ok) throw new Error(`Failed to load products: ${res.status}`);
  return (await res.json()) as Item[];
}
