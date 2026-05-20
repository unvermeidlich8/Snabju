export function StockPill({ stock, eta }: { stock: number; eta: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${stock > 0 ? 'bg-success' : 'bg-danger'}`} />
      <span className="text-xs text-ink2 font-medium">
        {stock > 0 ? `В наличии · ${eta}` : 'Под заказ'}
      </span>
    </div>
  );
}