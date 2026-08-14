import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">О нас</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">Материалы для ремонта по выгодной цене</h1>
      <div className="mt-5 rounded-[18px] border border-divider bg-white p-5 text-sm leading-6 text-muted">
        <p>
          Snabju — магазин товаров для дома, ремонта и стройки. В ассортименте герметики, монтажная пена, клеи и другие расходные материалы.
        </p>
        <p className="mt-4">
          Мы помогаем подобрать нужный материал для задачи и регулярно предлагаем уценённые позиции с большими скидками.
        </p>
        <Link href="/catalog" className="mt-5 inline-block font-semibold text-accent">
          Перейти в каталог →
        </Link>
      </div>

      <section className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Партнёры</p>
        <div className="mt-3 rounded-[18px] border border-divider bg-white p-5">
          <h2 className="text-lg font-bold text-ink">Сертификаты партнёров</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Здесь будут размещены сертификаты и подтверждающие документы наших партнёров.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-divider bg-brand">
            <div className="flex items-center gap-3 border-b border-divider bg-white px-4 py-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 3h7l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="#7a756d" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M14 3v5h5" stroke="#7a756d" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M8.5 15.5l1.8 1.8 4.2-4.2" stroke="#ff6a13" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-ink">Soudal — сертификат партнёра</span>
            </div>
            <object
              data="/certificates/partner-certificate.pdf"
              type="application/pdf"
              aria-label="Сертификат партнёра"
              className="block w-full"
              style={{ aspectRatio: '841 / 595' }}
            >
              <p className="p-4 text-sm text-muted">
                Предпросмотр PDF не поддерживается вашим браузером.
              </p>
            </object>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Контакты и адрес</p>
        <div className="mt-3 rounded-[18px] border border-divider bg-white p-5">
          <div className="flex gap-3">
            <svg className="mt-0.5 shrink-0" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z" stroke="#ff6a13" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" stroke="#ff6a13" strokeWidth="1.8" />
            </svg>
            <div>
              <h2 className="text-sm font-bold text-ink">Самовывоз</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Москва, Новокуркинское шоссе, 14</p>
              <a
                href="https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%9D%D0%BE%D0%B2%D0%BE%D0%BA%D1%83%D1%80%D0%BA%D0%B8%D0%BD%D1%81%D0%BA%D0%BE%D0%B5%20%D1%88%D0%BE%D1%81%D1%81%D0%B5%2C%2014"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-accent"
              >
                Построить маршрут →
              </a>
            </div>
          </div>
          <div className="my-5 border-t border-divider" />
          <div className="flex gap-3">
            <svg className="mt-0.5 shrink-0" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 15.5a2 2 0 01-2.2 2 19.5 19.5 0 01-8.5-3 19.2 19.2 0 01-6-6A19.5 19.5 0 01.3 0 2 2 0 012.3 5.8l2.7 1.3a2 2 0 012 1.8 13 13 0 005.2 5.2 2 2 0 011.8-2l1.3 2.7a2 2 0 01-.3 2.2z" stroke="#ff6a13" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <h2 className="text-sm font-bold text-ink">Поддержка</h2>
              <a href="tel:+79967132853" className="mt-1 block text-sm leading-6 text-muted">8 (996) 713-28-53</a>
              <a href="tel:+79268849112" className="block text-sm leading-6 text-muted">8 (926) 884-91-12</a>
              <a
                href="https://wa.me/79967132853"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-accent"
              >
                WhatsApp: 8 (996) 713-28-53 →
              </a>
              <a
                href="https://wa.me/79268849112"
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-sm font-semibold text-accent"
              >
                WhatsApp: 8 (926) 884-91-12 →
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
