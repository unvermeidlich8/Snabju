package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"site/models"
)

func CategoriesHandler(c *gin.Context) {
	categories, err := models.GetAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.HTML(http.StatusOK, "catalog.html", gin.H{
		"Categories": categories,
	})
}
