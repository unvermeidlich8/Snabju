package server

import (
	"Snabju/backend/internal/domain"
	"Snabju/backend/internal/transport/http/handler"
	appmiddleware "Snabju/backend/internal/transport/http/middleware"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func NewRouter(
	auth *handler.AuthHandler,
	catalog *handler.CatalogHandler,
	cart *handler.CartHandler,
	order *handler.OrderHandler,
	profile *handler.ProfileHandler,
	admin *handler.AdminHandler,
	upload *handler.UploadHandler,
	markdown *handler.MarkdownHandler,
	sessionStore domain.SessionStore,
	userRepo domain.UserRepository,
	uploadsDir string,
	allowedOrigins []string,
) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(appmiddleware.CORS(allowedOrigins))
	r.Use(appmiddleware.Logger)
	r.Use(appmiddleware.Metrics)
	r.Use(appmiddleware.Session(sessionStore))

	r.Handle("/metrics", promhttp.Handler())

	// Serve uploaded files publicly
	r.Handle("/uploads/*", http.StripPrefix("/uploads", http.FileServer(http.Dir(uploadsDir))))

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", auth.Register)
		r.Post("/auth/login", auth.Login)
		r.Post("/auth/logout", auth.Logout)

		r.Get("/categories", catalog.Categories)
		r.Get("/brands", catalog.Brands)
		r.Get("/products", catalog.ListProducts)
		r.Get("/products/{id}", catalog.GetProduct)

		r.Get("/markdown", markdown.List)

		r.Get("/cart", cart.GetCart)
		r.Post("/cart/items", cart.AddItem)
		r.Patch("/cart/items/{id}", cart.UpdateItem)
		r.Delete("/cart/items/{id}", cart.RemoveItem)

		r.Post("/orders", order.Create)
		r.Get("/orders", order.List)
		r.Get("/orders/{id}", order.GetByID)

		r.Get("/profile", profile.GetProfile)
		r.Patch("/profile", profile.UpdateProfile)

		r.Group(func(r chi.Router) {
			r.Use(appmiddleware.AdminOnly(userRepo))
			r.Post("/admin/upload", upload.Upload)
			r.Post("/admin/markdown", markdown.Create)
			r.Delete("/admin/markdown/{id}", markdown.Delete)
			r.Post("/admin/categories", admin.CreateCategory)
			r.Patch("/admin/categories/{id}", admin.UpdateCategory)
			r.Delete("/admin/categories/{id}", admin.DeleteCategory)
			r.Get("/admin/brands", admin.ListBrands)
			r.Get("/admin/products", admin.ListProducts)
			r.Post("/admin/products", admin.CreateProduct)
			r.Patch("/admin/products/{id}", admin.UpdateProduct)
			r.Delete("/admin/products/{id}", admin.DeleteProduct)
			r.Get("/admin/orders", admin.ListOrders)
			r.Patch("/admin/orders/{id}/status", admin.UpdateOrderStatus)
		})
	})

	return r
}
