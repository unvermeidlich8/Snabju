package handlers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gopkg.in/gomail.v2"
	"log"
	"net/http"
	"net/url"
	"site/config"
)

func ContactsHandler(c *gin.Context) {
	c.HTML(http.StatusOK, "contacts.html", nil)
}

func SubmitFormTelegram(c *gin.Context) {
	config.LoadEnv()
	name := c.PostForm("name")
	number := c.PostForm("number")
	message := c.PostForm("message")

	botToken := config.GetEnv("BOT_TOKEN")
	chatID := config.GetEnv("CHAT_ID")

	telegramMessage := fmt.Sprintf("Заявка с сайта:\nИмя: %s\nNumber: %s\nСообщение: %s", name, number, message)
	telegramAPI := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)

	resp, err := http.PostForm(telegramAPI, url.Values{
		"chat_id": {chatID},
		"text":    {telegramMessage},
	})

	if err != nil || resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось отправить сообщение в Telegram"})
		return
	}

	c.HTML(http.StatusOK, "success_modal.html", nil)
}

func SubmitFormEmail(c *gin.Context) {
	name := c.PostForm("name")
	number := c.PostForm("number")
	message := c.PostForm("message")

	BodyOfMessage := fmt.Sprintf("Заявка с сайта:\nИмя: %s\nТелефон: %s\nСообщение: %s", name, number, message)

	mail := gomail.NewMessage()
	mail.SetHeader("From", "morl0t@yandex.ru")
	mail.SetHeader("To", "snabjuManage@yandex.ru")
	mail.SetHeader("Subject", "Заявка с сайта")
	mail.SetBody("text/html", BodyOfMessage)

	dialer := gomail.NewDialer("smpt.yandex.ru", 587, "morl0t@yandex.ru", "ionovvptedaegmlt")
	if err := dialer.DialAndSend(mail); err != nil {
		c.JSON(http.StatusOK, gin.H{"error": err})
		log.Println(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ваше сообщение отправлено"})
}
