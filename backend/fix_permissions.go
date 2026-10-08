package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	dbUrl := "postgres://postgres:New_0909512583@db.vescjjkwgkmjhbsgbvvt.supabase.co:5432/postgres"
	
	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	queries := []string{
		"GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;",
		"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;",
		"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;",
		"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;",
		"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;",
	}

	for _, query := range queries {
		_, err := db.Exec(query)
		if err != nil {
			fmt.Printf("Error executing %s: %v\n", query, err)
		} else {
			fmt.Printf("Successfully executed: %s\n", query)
		}
	}
}
