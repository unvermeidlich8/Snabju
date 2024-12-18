package sessions

import (
	"encoding/gob"
	"github.com/gorilla/sessions"
	"site/models" // Замените на ваш реальный путь к моделям
)

var Store *sessions.CookieStore

func init() {
	// Регистрируем типы, которые будут сохраняться в сессии
	gob.Register([]models.CartItem{})

	// Инициализируем CookieStore
	Store = sessions.NewCookieStore([]byte("38cbe72bb8f551f25aedd87abf78b59e0e049c40c0c87fceafb2920fd7f4d44d"))

	// Настраиваем опции CookieStore
	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   1800, // Время жизни сессии: 30 минут
		HttpOnly: true, // Cookies доступны только через HTTP
	}
}
