package push

import (
	"Snabju/backend/internal/domain"
	"context"
	"encoding/json"
	"github.com/SherClockHolmes/webpush-go"
)

type Sender struct {
	repo                     domain.PushRepository
	public, private, subject string
}

func New(r domain.PushRepository, public, private, subject string) *Sender {
	return &Sender{r, public, private, subject}
}
func (s *Sender) Send(ctx context.Context, title, body string) error {
	subs, e := s.repo.List(ctx)
	if e != nil {
		return e
	}
	data, _ := json.Marshal(map[string]string{"title": title, "body": body, "url": "/admin/orders"})
	for _, x := range subs {
		res, err := webpush.SendNotificationWithContext(ctx, data, &webpush.Subscription{Endpoint: x.Endpoint, Keys: webpush.Keys{P256dh: x.Keys.P256dh, Auth: x.Keys.Auth}}, &webpush.Options{Subscriber: s.subject, VAPIDPublicKey: s.public, VAPIDPrivateKey: s.private, TTL: 60})
		if res != nil {
			res.Body.Close()
		}
		_ = err
	}
	return nil
}
