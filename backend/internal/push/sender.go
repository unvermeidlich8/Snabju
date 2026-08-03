package push

import (
	"Snabju/backend/internal/domain"
	"context"
	"encoding/json"
	"github.com/SherClockHolmes/webpush-go"
	"io"
	"log/slog"
	"strings"
)

type Sender struct {
	repo                     domain.PushRepository
	public, private, subject string
}

func New(r domain.PushRepository, public, private, subject string) *Sender {
	return &Sender{
		repo:    r,
		public:  public,
		private: private,
		subject: strings.TrimPrefix(subject, "mailto:"),
	}
}
func (s *Sender) Send(ctx context.Context, title, body string) error {
	subs, e := s.repo.List(ctx)
	if e != nil {
		return e
	}
	data, _ := json.Marshal(map[string]string{"title": title, "body": body, "url": "/admin/orders"})
	for _, x := range subs {
		res, err := webpush.SendNotificationWithContext(ctx, data, &webpush.Subscription{Endpoint: x.Endpoint, Keys: webpush.Keys{P256dh: x.Keys.P256dh, Auth: x.Keys.Auth}}, &webpush.Options{Subscriber: s.subject, VAPIDPublicKey: s.public, VAPIDPrivateKey: s.private, TTL: 60})
		if err != nil {
			slog.Error("web push delivery failed", "endpoint", x.Endpoint, "err", err)
			continue
		}
		if res != nil {
			raw, _ := io.ReadAll(res.Body)
			res.Body.Close()
			if res.StatusCode < 200 || res.StatusCode >= 300 {
				slog.Error("web push rejected", "status", res.StatusCode, "endpoint", x.Endpoint, "response", string(raw))
			} else {
				slog.Info("web push delivered", "status", res.StatusCode)
			}
		}
	}
	return nil
}
