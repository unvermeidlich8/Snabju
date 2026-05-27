package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
	HttpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "snabju_http_requests_total",
			Help: "Total HTTP requests",
		},
		[]string{"method", "route", "status"},
	)

	HttpDurationSeconds = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "snabju_http_request_duration_seconds",
			Help:    "HTTP request duration",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
		},
		[]string{"method", "route"},
	)

	OrdersCreatedTotal = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "snabju_orders_created_total",
		Help: "Total orders created",
	})

	UsersRegisteredTotal = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "snabju_users_registered_total",
		Help: "Total users registered",
	})
)

func init() {
	prometheus.MustRegister(
		HttpRequestsTotal,
		HttpDurationSeconds,
		OrdersCreatedTotal,
		UsersRegisteredTotal,
	)
}
