package models

import (
	"database/sql"
	"errors"
	"log"
	"site/config"
)

type Product struct {
	ID          int
	Name        string
	Description string
	Price       float64
	Quantity    int
	CategoryID  int
	BrandId     *int
	ImageURL    string
}

func GetAllProducts() ([]Product, error) {
	db := config.GetDB()
	if db == nil {
		return nil, errors.New("соединение с базой данных не установлено")
	}

	rows, err := db.Query("SELECT * FROM products")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Quantity, &p.CategoryID, &p.BrandId, &p.ImageURL); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func GetAllProductsByCategoryId(categoryID int) ([]Product, error) {
	db := config.GetDB()
	if db == nil {
		return nil, errors.New("соединение с базой данных не установлено")
	}

	rows, err := db.Query("SELECT * FROM products WHERE category_id=$1", categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	Products := []Product{}
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Quantity, &p.CategoryID, &p.BrandId, &p.ImageURL); err != nil {
			return nil, err
		}
		Products = append(Products, p)
	}

	return Products, nil
}

func GetProductById(id int) (*Product, error) {
	db := config.GetDB()
	if db == nil {
		return nil, errors.New("соединение с БД не установленно")
	}

	var product Product
	query := "SELECT * FROM products WHERE id = $1"
	err := db.QueryRow(query, id).Scan(
		&product.ID,
		&product.Name,
		&product.Description,
		&product.Price,
		&product.Quantity,
		&product.CategoryID,
		&product.BrandId,
		&product.ImageURL,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Продукт с ID %d не найден", id)
			return nil, nil
		}
		log.Printf("Ошибка при запросе продукта с ID %d: %v", id, err)
		return nil, err //
	}

	return &product, nil
}
