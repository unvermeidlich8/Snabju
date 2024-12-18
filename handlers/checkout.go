package handlers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"os"
	"site/config"
	"site/models"
	"site/sessions"
)

func CheckoutHandler(c *gin.Context) {
	config.LoadEnv()
	session, _ := sessions.Store.Get(c.Request, "cart")
	var cart []models.CartItem
	if session.Values["cart"] != nil {
		cart = session.Values["cart"].([]models.CartItem)
	}

	if len(cart) == 0 {
		c.JSON(200, gin.H{"error": "No items found"})
	}
	name := c.PostForm("name")
	phone := c.PostForm("phone")
	deliveryMethod := c.PostForm("delivery-method")
	address := c.PostForm("address")
	log.Println(deliveryMethod, "/////////////////////////////////", name)
	message := fmt.Sprintf("Новый заказ:\nИмя: %s\nТелефон: %s\n", name, phone)
	if deliveryMethod == "delivery" {
		message += fmt.Sprintf("Способ получения: Доставка\nАдрес: %s\n\n", address)
	} else {
		message += "Способ получения: Самовывоз\n\n"
	}

	total := 0.0
	for _, item := range cart {
		itemTotal := float64(item.Quantity) * item.Price
		message += fmt.Sprintf("• %s x %d = %.2f руб.\n", item.Name, item.Quantity, itemTotal)
		total += itemTotal
	}
	message += fmt.Sprintf("\nОбщая стоимость: %.2f руб.", total)

	botToken := os.Getenv("BOT_TOKEN")
	chatID := os.Getenv("CHAT_ID")
	chatIDsec := os.Getenv("CHAT_ID2")
	telegramURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)

	resp, err := http.PostForm(
		telegramURL,
		map[string][]string{
			"chat_id": {chatID},
			"text":    {message},
		},
	)

	respSec, err := http.PostForm(
		telegramURL,
		map[string][]string{
			"chat_id": {chatIDsec},
			"text":    {message},
		},
	)

	if err != nil || resp.StatusCode != http.StatusOK || respSec.StatusCode != http.StatusOK {
		log.Printf("Ошибка отправки в Telegram: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка отправки заказа"})
		return
	}
	defer resp.Body.Close()
	defer respSec.Body.Close()

	// Очищаем корзину после отправки
	session.Values["cart"] = nil
	session.Save(c.Request, c.Writer)
	c.JSON(http.StatusOK, gin.H{
		"redirect": "/cart?success=true",
	})
}
