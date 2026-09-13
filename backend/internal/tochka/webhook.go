package tochka

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const publicKeyURL = "https://enter.tochka.com/doc/openapi/static/keys/public"

type WebhookVerifier struct {
	httpClient *http.Client
	mu         sync.Mutex
	key        *rsa.PublicKey
}

func NewWebhookVerifier() *WebhookVerifier {
	return &WebhookVerifier{httpClient: &http.Client{Timeout: 10 * time.Second}}
}

func (v *WebhookVerifier) Verify(ctx context.Context, raw string) (jwt.MapClaims, error) {
	key, err := v.publicKey(ctx)
	if err != nil {
		return nil, err
	}
	token, err := jwt.Parse(raw, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodRS256.Alg() {
			return nil, fmt.Errorf("unexpected JWT signing method")
		}
		return key, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodRS256.Alg()}))
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid webhook signature")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid webhook claims")
	}
	return claims, nil
}

func (v *WebhookVerifier) publicKey(ctx context.Context) (*rsa.PublicKey, error) {
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.key != nil {
		return v.key, nil
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, publicKeyURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := v.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download Tochka public key: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download Tochka public key: status %d", resp.StatusCode)
	}
	var jwk struct {
		N string `json:"n"`
		E string `json:"e"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&jwk); err != nil {
		return nil, fmt.Errorf("parse Tochka public key: %w", err)
	}
	n, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, fmt.Errorf("decode Tochka public modulus: %w", err)
	}
	e, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, fmt.Errorf("decode Tochka public exponent: %w", err)
	}
	exponent := 0
	for _, b := range e {
		exponent = exponent<<8 | int(b)
	}
	if exponent == 0 {
		return nil, fmt.Errorf("invalid Tochka public exponent")
	}
	v.key = &rsa.PublicKey{N: new(big.Int).SetBytes(n), E: exponent}
	return v.key, nil
}
