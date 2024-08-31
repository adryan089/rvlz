export interface Fragments {
  intelDiscount: number;
  rarityBalance: RarityBalance[];
  fragmentBalance: FragmentBalance[];
}

export interface RarityBalance {
  rarity: string;
  balance: number;
}

export interface FragmentBalance {
  id: number;
  name: string;
  description: string;
  image: string;
  rarity: string;
  tier: string;
  intelDiscount: string;
  point: number;
  symbol: string;
  balance: number;
}
