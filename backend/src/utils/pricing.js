// Narx hisob-kitoblari — frontend'dagi lib/utils.ts bilan bir xil qoidalar

/** Tanlangan rejim narxi; u yo'q bo'lsa — boshqa rejim narxi */
export function unitPrice(product, mode) {
  const retail = product.price_retail ?? product.priceRetail ?? null;
  const wholesale = product.price_wholesale ?? product.priceWholesale ?? null;
  return mode === 'wholesale' ? wholesale ?? retail : retail ?? wholesale;
}

/** Optom rejimida minimal miqdor */
export function minQty(product, mode) {
  const min = product.wholesale_min ?? product.wholesaleMin ?? null;
  return mode === 'wholesale' && min ? min : 1;
}

export const formatKRW = (n) =>
  n == null ? 'Kelishiladi' : `${Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ')} ₩`;

export const modeLabel = (mode) => (mode === 'wholesale' ? 'Optom' : 'Dona');
