package main

import (
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq" // github.com/lib/pq/go1.8.1.html
	"site/config"
	"site/handlers"
	//_ "site/sessions"
)

func main() {
	config.InitDB()
	defer config.GetDB().Close()

	router := gin.Default()
	router.LoadHTMLGlob("Templates/*.html")
	router.Static("/static", "./static")
	router.Static("/Templates/assets", "./Templates/assets")

	router.GET("/", handlers.HomeHandler)
	router.GET("/catalog", handlers.CatalogHandler)
	router.GET("/categories", handlers.CategoriesHandler)

	router.POST("cart/add", handlers.AddToCart)
	router.POST("cart/remove", handlers.RemoveFromCart)
	router.POST("cart/update", handlers.UpdateCart)
	router.GET("cart", handlers.ViewCart)

	router.GET("/contacts", handlers.ContactsHandler)
	router.POST("submit-email", handlers.SubmitFormTelegram)

	router.GET("/about", handlers.AboutHandler)

	router.POST("/checkout", handlers.CheckoutHandler)
	router.GET("/order-confirm", handlers.OrderHandler)

	router.Run(":8000")

}
