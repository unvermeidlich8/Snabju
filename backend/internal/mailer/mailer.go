package mailer

import (
	"Snabju/backend/internal/domain"
	"context"
	"fmt"

	"github.com/wneessen/go-mail"
)

type Sender interface {
	SendRegistrationEmail(ctx context.Context, p domain.UserRegisteredPayload) error
	SendOrderConfirmationEmail(ctx context.Context, p domain.OrderConfirmedPayload) error
	SendAdminRegistrationEmail(ctx context.Context, to string, p domain.UserRegisteredPayload) error
	SendAdminOrderEmail(ctx context.Context, to string, p domain.OrderConfirmedPayload) error
}

func (m *Mailer) SendAdminRegistrationEmail(ctx context.Context, to string, p domain.UserRegisteredPayload) error {
	return m.send(ctx, to, "Новая регистрация — Snabju", fmt.Sprintf("<h2>Новая регистрация</h2><p><strong>%s</strong><br>%s<br>%v</p>", p.Name, p.Phone, p.Email))
}

func (m *Mailer) SendAdminOrderEmail(ctx context.Context, to string, p domain.OrderConfirmedPayload) error {
	return m.send(ctx, to, "Новый заказ — Snabju", fmt.Sprintf("<h2>Новый заказ #%s</h2><p><strong>%s</strong><br>%s<br>%s</p><p>Сумма: <strong>%.2f ₽</strong></p>", p.OrderID, p.ContactName, p.ContactPhone, p.Address, p.Total))
}

type TLSPolicy string

const (
	TLSNone     TLSPolicy = "none"
	TLSStartTLS TLSPolicy = "starttls"
	TLSTLS      TLSPolicy = "tls"
)

type Mailer struct {
	host      string
	port      int
	username  string
	password  string
	from      string
	tlsPolicy TLSPolicy
}

func New(host string, port int, username, password, from string, tlsPolicy TLSPolicy) *Mailer {
	return &Mailer{host: host, port: port, username: username, password: password, from: from, tlsPolicy: tlsPolicy}
}

func ParseTLSPolicy(s string) TLSPolicy {
	switch s {
	case "tls":
		return TLSTLS
	case "starttls":
		return TLSStartTLS
	default:
		return TLSNone
	}
}

func (m *Mailer) send(_ context.Context, to, subject, body string) error {
	msg := mail.NewMsg()
	if err := msg.From(m.from); err != nil {
		return fmt.Errorf("mailer: from: %w", err)
	}
	if err := msg.To(to); err != nil {
		return fmt.Errorf("mailer: to: %w", err)
	}
	msg.Subject(subject)
	msg.SetBodyString(mail.TypeTextHTML, body)

	opts := []mail.Option{mail.WithPort(m.port)}
	switch m.tlsPolicy {
	case TLSTLS:
		opts = append(opts, mail.WithTLSPolicy(mail.TLSMandatory))
	case TLSStartTLS:
		opts = append(opts, mail.WithTLSPolicy(mail.TLSOpportunistic))
	default:
		opts = append(opts, mail.WithTLSPolicy(mail.NoTLS))
	}
	if m.username != "" {
		opts = append(opts,
			mail.WithSMTPAuth(mail.SMTPAuthPlain),
			mail.WithUsername(m.username),
			mail.WithPassword(m.password),
		)
	}

	client, err := mail.NewClient(m.host, opts...)
	if err != nil {
		return fmt.Errorf("mailer: new client: %w", err)
	}
	if err := client.DialAndSend(msg); err != nil {
		return fmt.Errorf("mailer: send: %w", err)
	}
	return nil
}

func (m *Mailer) SendRegistrationEmail(ctx context.Context, p domain.UserRegisteredPayload) error {
	if p.Email == nil {
		return nil
	}
	greeting := "Здравствуйте"
	if p.Name != "" {
		greeting = "Здравствуйте, " + p.Name
	}
	body := fmt.Sprintf(`
<h2>Добро пожаловать в Snabju!</h2>
<p>%s! Вы успешно зарегистрировались.</p>
<p>Ваш телефон: <strong>%s</strong></p>
<p>Теперь вы можете оформлять заказы и отслеживать историю покупок.</p>
`, greeting, p.Phone)
	return m.send(ctx, *p.Email, "Добро пожаловать в Snabju", body)
}

func (m *Mailer) SendOrderConfirmationEmail(ctx context.Context, p domain.OrderConfirmedPayload) error {
	if p.Email == nil {
		return nil
	}
	body := fmt.Sprintf(`
<h2>Заказ принят!</h2>
<p>Здравствуйте, <strong>%s</strong>!</p>
<p>Ваш заказ <strong>#%s</strong> на сумму <strong>%.2f ₽</strong> принят в обработку.</p>
<p>Мы свяжемся с вами по номеру %s для уточнения деталей доставки.</p>
<p>Адрес доставки: %s</p>
`, p.ContactName, p.OrderID, p.Total, p.ContactPhone, p.Address)
	return m.send(ctx, *p.Email, "Заказ принят — Snabju", body)
}
