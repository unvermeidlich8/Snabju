import Link from 'next/link';

const company = {
  name: 'Общество с ограниченной ответственностью «Слоттофф»',
  shortName: 'ООО «Слоттофф»',
  inn: '9722096611',
  kpp: '772201001',
  ogrn: '1257700174357',
  checkingAccount: '40702810420000199189',
  correspondentAccount: '30101810745374525104',
  bankBik: '044525104',
  bankName: 'ООО «Банк Точка»',
  legalAddress: '111024, Россия, г. Москва, вн. тер. г. муниципальный округ Лефортово, ул. Авиамоторная, д. 50, стр. 2, помещение 9/Н',
  email: '79096870542@yandex.ru',
  managerEmail: 'snabjuManage@yandex.ru',
  phone: '+7 (996) 713-28-53',
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-5 rounded-[18px] border border-divider bg-white p-5">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/about" className="text-sm font-semibold text-accent">← О нас</Link>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Покупателям</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">Документы и условия</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Информация о продавце, оплате, получении и возврате заказа.</p>

      <nav className="mt-5 grid grid-cols-2 gap-2 text-sm font-semibold text-accent">
        <a className="rounded-xl border border-divider bg-white px-3 py-2.5" href="#requisites">Реквизиты</a>
        <a className="rounded-xl border border-divider bg-white px-3 py-2.5" href="#payment">Оплата</a>
        <a className="rounded-xl border border-divider bg-white px-3 py-2.5" href="#delivery">Получение</a>
        <a className="rounded-xl border border-divider bg-white px-3 py-2.5" href="#returns">Возврат</a>
        <a className="col-span-2 rounded-xl border border-divider bg-white px-3 py-2.5" href="#privacy">Политика конфиденциальности</a>
      </nav>

      <div className="mt-5 flex flex-col gap-4">
        <Section id="requisites" title="Реквизиты продавца">
          <dl className="grid grid-cols-[116px_1fr] gap-x-3 gap-y-2">
            <dt>Наименование</dt><dd className="font-medium text-ink">{company.name}</dd>
            <dt>Сокращённо</dt><dd>{company.shortName}</dd>
            <dt>ИНН / КПП</dt><dd>{company.inn} / {company.kpp}</dd>
            <dt>ОГРН</dt><dd>{company.ogrn}</dd>
            <dt>Юр. адрес</dt><dd>{company.legalAddress}</dd>
            <dt>Банк</dt><dd>{company.bankName}</dd>
            <dt>БИК банка</dt><dd>{company.bankBik}</dd>
            <dt>Расчётный счёт</dt><dd>{company.checkingAccount}</dd>
            <dt>Корр. счёт</dt><dd>{company.correspondentAccount}</dd>
            <dt>Телефон</dt><dd><a href="tel:+79967132853" className="text-accent">{company.phone}</a></dd>
            <dt>Email</dt><dd><a href={`mailto:${company.email}`} className="break-all text-accent">{company.email}</a></dd>
          </dl>
        </Section>

        <Section id="payment" title="Условия оплаты">
          <p>Стоимость товара указывается в рублях и отображается в корзине до оформления заказа. Способ оплаты выбирается при оформлении. После подключения онлайн-оплаты банковской картой платёж будет совершаться на защищённой странице платёжного сервиса.</p>
          <p className="mt-3">При успешной оплате покупатель получает подтверждение заказа и кассовый чек на указанный при оформлении адрес электронной почты.</p>
        </Section>

        <Section id="delivery" title="Получение заказа">
          <p>Сейчас доступен самовывоз по адресу: Москва, Новокуркинское шоссе, 14. Срок готовности заказа указывается при оформлении. Перед приездом дождитесь подтверждения от магазина.</p>
          <p className="mt-3">По вопросам получения заказа свяжитесь с нами по телефону <a href="tel:+79967132853" className="text-accent">{company.phone}</a> или email <a href={`mailto:${company.managerEmail}`} className="break-all text-accent">{company.managerEmail}</a>.</p>
        </Section>

        <Section id="returns" title="Возврат и обмен">
          <p>Для возврата или обмена товара напишите на <a href={`mailto:${company.managerEmail}`} className="break-all text-accent">{company.managerEmail}</a> либо позвоните по номеру <a href="tel:+79967132853" className="text-accent">{company.phone}</a>. Укажите номер заказа, наименование товара и причину обращения.</p>
          <p className="mt-3">Порядок, сроки и условия возврата определяются законодательством Российской Федерации и зависят от категории товара и причины возврата. Деньги за возвращённый товар возвращаются тем же способом, которым была произведена оплата, если иной порядок не согласован с покупателем.</p>
        </Section>

        <Section id="privacy" title="Политика конфиденциальности">
          <p>{company.shortName} обрабатывает персональные данные покупателей для оформления, исполнения и сопровождения заказа: имя, номер телефона, email, данные организации, адрес и комментарий к заказу.</p>
          <p className="mt-3">Данные используются только для связи с покупателем, обработки заказа, формирования кассового чека и выполнения обязанностей по закону. Мы не продаём персональные данные третьим лицам. Доступ к ним может предоставляться только подрядчикам, необходимым для исполнения заказа и соблюдения требований закона, в объёме, необходимом для этих целей.</p>
          <p className="mt-3">Покупатель может запросить уточнение, обновление или удаление данных, направив обращение на <a href={`mailto:${company.email}`} className="break-all text-accent">{company.email}</a>. Обработка прекращается при достижении целей либо по обращению, если хранение данных не требуется законом.</p>
          <p className="mt-3">Оператор персональных данных: {company.name}, ИНН {company.inn}, адрес: {company.legalAddress}.</p>
        </Section>
      </div>
    </main>
  );
}
