export type Food = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  active: boolean;
};

export async function fetchFoods(): Promise<{ pizzas: Food[], starters: Food[], desserts: Food[] }> {
  const res = await fetch('/api/foods');
  if (!res.ok) {
    throw new Error(`Failed to load foods: ${res.status}`);
  }
  return (await res.json()) as { pizzas: Food[], starters: Food[], desserts: Food[] };
}

