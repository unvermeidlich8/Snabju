package handlers

import (
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"site/models"
	"strconv"
)

func CatalogHandler(c *gin.Context) {
	categoryIDParam := c.Query("category")
	var products []models.Product
	var err error

	// Проверка параметра категории и фильтрация товаров
	if categoryIDParam != "" {
		categoryID, parseErr := strconv.Atoi(categoryIDParam)
		if parseErr != nil {
			log.Printf("Ошибка преобразования ID категории: %v", parseErr)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID категории"})
			return
		}
		products, err = models.GetAllProductsByCategoryId(categoryID)
		if err != nil {
			log.Printf("Ошибка при получении продуктов по категории: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера"})
			return
		}
	} else {
		products, err = models.GetAllProducts() // Получение всех товаров
		if err != nil {
			log.Printf("Ошибка при получении всех продуктов: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера"})
			return
		}
	}

	// Проверка запроса от htmx для обновления только #product-list
	if c.Request.Header.Get("HX-Request") != "" {
		log.Println("HTMX запрос: только обновление списка товаров")
		c.HTML(http.StatusOK, "product-list.html", gin.H{"Products": products})
	} else {
		categories, err := models.GetAllCategories()
		if err != nil {
			log.Printf("Ошибка при получении категорий: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сервера"})
			return
		}
		c.HTML(http.StatusOK, "catalog.html", gin.H{
			"Products":   products,
			"Categories": categories,
		})
	}
}
