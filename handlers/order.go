package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func OrderHandler(c *gin.Context) {
	c.HTML(http.StatusOK, "order_confirm.html", gin.H{})
}
