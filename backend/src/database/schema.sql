-- MIRA Cosmetics — baza sxemasi (qayta ishga tushirish xavfsiz)

CREATE TABLE IF NOT EXISTS images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL DEFAULT 'product',      -- product | category | receipt | banner
  mime        text NOT NULL DEFAULT 'image/jpeg',
  data        bytea NOT NULL,
  width       int,
  height      int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  emoji       text,
  image_id    uuid REFERENCES images(id) ON DELETE SET NULL,
  sort        int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id               serial PRIMARY KEY,
  name             text NOT NULL,
  brand            text,
  category_id      int REFERENCES categories(id) ON DELETE SET NULL,
  description      text,
  price_retail     int,            -- dona narxi (KRW)
  price_wholesale  int,            -- optom narxi (KRW)
  wholesale_min    int,            -- optom uchun minimal miqdor
  wholesale_note   text,
  price_box        int,            -- karobka narxi (bo'lsa)
  box_note         text,
  image_id         uuid REFERENCES images(id) ON DELETE SET NULL,
  is_hit           boolean NOT NULL DEFAULT false,
  is_new           boolean NOT NULL DEFAULT false,
  in_stock         boolean NOT NULL DEFAULT true,
  is_active        boolean NOT NULL DEFAULT true,
  sort             int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);

CREATE TABLE IF NOT EXISTS users (
  id             bigint PRIMARY KEY,           -- Telegram user id
  first_name     text,
  last_name      text,
  username       text,
  language_code  text,
  phone          text,
  is_blocked     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                serial PRIMARY KEY,
  public_id         uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id           bigint REFERENCES users(id) ON DELETE SET NULL,
  customer_name     text NOT NULL,
  phone             text NOT NULL,
  address           text,
  comment           text,
  price_mode        text NOT NULL DEFAULT 'retail' CHECK (price_mode IN ('retail','wholesale')),
  items_count       int NOT NULL DEFAULT 0,
  total             int NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','confirmed','shipped','delivered','cancelled')),
  receipt_image_id  uuid REFERENCES images(id) ON DELETE SET NULL,
  payment_card      text,
  admin_note        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id          serial PRIMARY KEY,
  order_id    int NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  int REFERENCES products(id) ON DELETE SET NULL,
  name        text NOT NULL,
  brand       text,
  image_id    uuid,
  price       int NOT NULL,
  qty         int NOT NULL,
  subtotal    int NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

CREATE TABLE IF NOT EXISTS settings (
  key    text PRIMARY KEY,
  value  text
);
