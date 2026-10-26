import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <p className="font-serif text-7xl font-bold text-mira-gradient">404</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-mira-700">Sahifa topilmadi</h1>
      <p className="mt-2 text-sm text-muted">Bu sahifa mavjud emas yoki ko‘chirilgan.</p>
      <Link href="/" className="btn-primary mt-6">
        Bosh sahifaga
      </Link>
    </div>
  );
}
