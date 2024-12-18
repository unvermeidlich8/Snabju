package handlers

import (
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"site/models"
	"site/sessions"
	"strconv"
)

func AddToCart(c *gin.Context) {
	session, err := sessions.Store.Get(c.Request, "cart")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания сессии"})
		return
	}
	productID, _ := strconv.Atoi(c.PostForm("product_id"))
	quantity, _ := strconv.Atoi(c.PostForm("quantity"))

	var cart []models.CartItem
	if session.Values["cart"] == nil {
		cart = []models.CartItem{}
	} else {
		cart = session.Values["cart"].([]models.CartItem)
	}

	itemIndex := -1
	for i, cartItem := range cart {
		if cartItem.ProductID == productID {
			itemIndex = i
			break
		}
	}

	if itemIndex != -1 {
		cart[itemIndex].Quantity += quantity
	} else {
		product, _ := models.GetProductById(productID)
		cart = append(cart, models.CartItem{
			ProductID: product.ID,
			Name:      product.Name,
			Price:     product.Price,
			Quantity:  quantity,
		})
	}

	session.Values["cart"] = cart
	session.Save(c.Request, c.Writer)

	log.Printf("Добавление товара в корзину: productID=%d, quantity=%d", productID, quantity)
	c.HTML(http.StatusOK, "notification.html", gin.H{
		"Message": "Товар успешно добавлен в корзину!",
	})

}

func ViewCart(c *gin.Context) {
	session, _ := sessions.Store.Get(c.Request, "cart")

	var cart []models.CartItem
	if session.Values["cart"] != nil {
		cart = session.Values["cart"].([]models.CartItem)
	}

	total := calculateCartTotal(cart)

	// Рендерим полную страницу
	c.HTML(http.StatusOK, "cart.html", gin.H{
		"Cart":  cart,
		"Total": total,
	})
}

func RemoveFromCart(c *gin.Context) {
	productID, err := strconv.Atoi(c.PostForm("product_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID товара"})
		return
	}

	session, _ := sessions.Store.Get(c.Request, "cart")
	var cart []models.CartItem
	if session.Values["cart"] != nil {
		cart = session.Values["cart"].([]models.CartItem)

		// Удаляем товар
		for i, item := range cart {
			if item.ProductID == productID {
				cart = append(cart[:i], cart[i+1:]...)
				break
			}
		}
	}

	session.Values["cart"] = cart
	session.Save(c.Request, c.Writer)

	if len(cart) == 0 {
		c.HTML(http.StatusOK, "empty_cart.html", nil)
		return
	}

	total := calculateCartTotal(cart)

	c.HTML(http.StatusOK, "cart_items.html", gin.H{
		"Cart":  cart,
		"Total": total,
	})
}

func UpdateCart(c *gin.Context) {
	productID, _ := strconv.Atoi(c.PostForm("product_id"))
	quantity, _ := strconv.Atoi(c.PostForm("quantity"))

	session, _ := sessions.Store.Get(c.Request, "cart")
	var cart []models.CartItem
	if session.Values["cart"] != nil {
		cart = session.Values["cart"].([]models.CartItem)

		// Обновляем количество
		for i, item := range cart {
			if item.ProductID == productID {
				cart[i].Quantity = quantity
				break
			}
		}
	}

	session.Values["cart"] = cart
	session.Save(c.Request, c.Writer)

	// Рассчитываем итоговую сумму
	total := calculateCartTotal(cart)

	// Рендерим обновлённый cart-items.html
	c.HTML(http.StatusOK, "cart_items.html", gin.H{
		"Cart":  cart,
		"Total": total,
	})
}

// Вспомогательная функция для пересчёта итоговой суммы корзины
func calculateCartTotal(cart []models.CartItem) float64 {
	total := 0.0
	for _, item := range cart {
		total += item.Price * float64(item.Quantity)
	}
	return total
}

func GetCart(c *gin.Context) {
	session, _ := sessions.Store.Get(c.Request, "cart")
	var cart []models.CartItem
	if session.Values["cart"] != nil {
		cart = session.Values["cart"].([]models.CartItem)
	}

	if len(cart) == 0 {
		c.HTML(http.StatusOK, "empty_cart.html", gin.H{})
		return
	}

	total := calculateCartTotal(cart)

	c.HTML(http.StatusOK, "cart_items.html", gin.H{
		"Cart":  cart,
		"Total": total,
	})
}
