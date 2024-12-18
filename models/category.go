package models

import "site/config"

type Сategory struct {
	ID   int
	Name string
}

func GetAllCategories() ([]Сategory, error) {
	db := config.GetDB()
	rows, err := db.Query("SELECT * FROM categories")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := []Сategory{}
	for rows.Next() {
		var c Сategory
		if err = rows.Scan(&c.ID, &c.Name); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, nil
}
