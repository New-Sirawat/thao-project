package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

func main() {
	// Load env
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warning: No .env file found")
	}

	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")

	if supabaseUrl == "" || supabaseKey == "" {
		log.Fatal("Missing SUPABASE_URL or SUPABASE_KEY in .env")
	}

	client, err := supabase.NewClient(supabaseUrl, supabaseKey, nil)
	if err != nil {
		log.Fatalf("Error creating Supabase client: %v", err)
	}

	// Open CSV file
	file, err := os.Open("old_data.csv")
	if err != nil {
		log.Fatalf("Error opening CSV file: %v. Please make sure old_data.csv exists in this folder.", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("Error reading CSV: %v", err)
	}

	if len(records) < 2 {
		log.Fatal("CSV file is empty or only has headers")
	}

	// Assuming CSV format: UserEmail, Date, CheckInTime, CheckOutTime, Status
	// We need to resolve UserEmail to user_id from the new users table first
	var users []map[string]interface{}
	_, err = client.From("users").Select("id,email", "exact", false).ExecuteTo(&users)
	if err != nil {
		log.Fatalf("Error fetching users from new schema: %v", err)
	}

	emailToId := make(map[string]string)
	for _, u := range users {
		email := u["email"].(string)
		id := u["id"].(string)
		emailToId[email] = id
	}

	var newAttendances []map[string]interface{}

	for i, row := range records {
		if i == 0 {
			continue // skip header
		}
		
		// Map columns (modify index if your CSV structure is different)
		if len(row) < 5 {
			continue
		}
		
		email := strings.TrimSpace(row[0])
		date := strings.TrimSpace(row[1])
		checkIn := strings.TrimSpace(row[2])
		checkOut := strings.TrimSpace(row[3])
		status := strings.TrimSpace(row[4])

		userId, ok := emailToId[email]
		if !ok {
			log.Printf("Warning: User %s not found in new DB. Skipping row %d", email, i)
			continue
		}

		// Map status to match enum (e.g., "Checked In" -> "CHECKED_IN", "Completed" -> "COMPLETED")
		// status = strings.ToUpper(strings.ReplaceAll(status, " ", "_"))

		record := map[string]interface{}{
			"id":           uuid.New().String(),
			"userId":       userId,
			"date":          date,
			"checkIn":       checkIn,
			"checkOut":      nil,
			"status":        status,
			"createdAt": time.Now().Format(time.RFC3339),
			"updatedAt": time.Now().Format(time.RFC3339),
		}

		if checkOut != "" && checkOut != "null" {
			record["checkOut"] = checkOut
		}

		newAttendances = append(newAttendances, record)
	}

	fmt.Printf("Parsed %d attendance records to import.\n", len(newAttendances))

	// Insert in batches or individually (for simplicity, insert all as an array)
	// Some PostgREST versions support bulk insert by passing an array of maps
	_, _, err = client.From("attendances").Insert(newAttendances, false, "", "", "").Execute()
	if err != nil {
		log.Fatalf("Error inserting records: %v", err)
	}

	fmt.Println("Migration completed successfully!")
}
