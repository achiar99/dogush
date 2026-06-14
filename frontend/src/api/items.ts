const API = import.meta.env.VITE_API_BASE_URL || '';

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  active: boolean;
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API}/api/products`);
  if (!res.ok) throw new Error(`Failed to load products: ${res.status}`);
  return (await res.json()) as Item[];
}
