export type PriceMode = 'retail' | 'wholesale';

export type Product = {
  id: number;
  name: string;
  brand: string | null;
  categoryId: number | null;
  categoryName?: string | null;
  description: string | null;
  priceRetail: number | null;
  priceWholesale: number | null;
  wholesaleMin: number | null;
  wholesaleNote: string | null;
  priceBox: number | null;
  boxNote: string | null;
  image: string | null;
  imageId: string | null;
  isHit: boolean;
  isNew: boolean;
  inStock: boolean;
  isActive: boolean;
  sort: number;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  emoji: string | null;
  image: string | null;
  imageId: string | null;
  sort: number;
  count: number;
};

export type Settings = {
  shop_name: string;
  currency: string;
  card_number: string;
  card_holder: string;
  card_bank: string;
  contact_phone: string;
  contact_username: string;
  delivery_note: string;
  announcement: string;
};

export type Catalog = { categories: Category[]; products: Product[]; settings: Settings };

export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type OrderItem = {
  id: number;
  productId: number | null;
  name: string;
  brand: string | null;
  image: string | null;
  price: number;
  qty: number;
  subtotal: number;
};

export type Order = {
  id: number;
  publicId: string;
  userId?: number | null;
  username?: string | null;
  customerName: string;
  phone: string;
  address: string | null;
  comment: string | null;
  priceMode: PriceMode;
  itemsCount: number;
  total: number;
  status: OrderStatus;
  receipt?: string | null;
  paymentCard?: string | null;
  adminNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
};
