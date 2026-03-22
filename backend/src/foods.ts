import heConfig from '../../shared/he.json';

export type Food = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  active: boolean;
};

type HeFoodConfig = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active?: boolean;
  svgLabel: string;
  svgBg: string;
  svgFg: string;
  imageFile?: string;
};

const heFoods = (heConfig as unknown as { foods: HeFoodConfig[] }).foods;

export const foods: Food[] = heFoods.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.price,
  category: p.category,
  active: p.active ?? true,
  imageUrl: `/images/${p.imageFile}`
}));

export const pizzas = foods.filter(f => f.category === 'pizzas');
export const starters = foods.filter(f => f.category === 'starters');
export const desserts = foods.filter(f => f.category === 'desserts');

