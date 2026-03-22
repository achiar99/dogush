export type Food = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  active: boolean;
};

export async function fetchFoods(): Promise<{ dryFood: Food[], wetFood: Food[], treats: Food[], supplements: Food[] }> {
  const res = await fetch('/api/foods');
  if (!res.ok) {
    throw new Error(`Failed to load foods: ${res.status}`);
  }
  return (await res.json()) as { dryFood: Food[], wetFood: Food[], treats: Food[], supplements: Food[] };
}
