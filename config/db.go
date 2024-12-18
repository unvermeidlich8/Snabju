package config

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"log"
	"os"
)

var db *sql.DB

func InitDB() {
	LoadEnv()
	user := os.Getenv("DB_USER")
	dbname := os.Getenv("DB_NAME")
	host := os.Getenv("DB_HOST")
	pass := os.Getenv("DB_PASS")
	connStr := fmt.Sprintf("user=%s password=%s dbname=%s sslmode=disable host=%s", user, pass, dbname, host)

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("Failed to ping database", err)
	}

	log.Println("Successfully connected to database")

}

func GetDB() *sql.DB {
	if db == nil {
		log.Println("Ошибка: база данных не инициализирована")
	}
	return db
}
