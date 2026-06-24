package main

import (
	"log"
	"math"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

type CheckInRequest struct {
	UserID    string  `json:"user_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type CheckOutRequest struct {
	UserID string `json:"user_id"`
}

type LeaveRequestPayload struct {
	UserID    string `json:"user_id"`
	LeaveType string `json:"leave_type"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
	Reason    string `json:"reason"`
}

const (
	officeLat         = 16.09831 // 96 Nguyễn Đình Hoàn, Sơn Trà, Đà Nẵng
	officeLng         = 108.22820
	maxDistanceMeters = 100.0 // Set back to strict 100m radius
)

func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const r = 6371e3 // Earth radius in meters
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	deltaPhi := (lat2 - lat1) * math.Pi / 180
	deltaLambda := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaPhi/2)*math.Sin(deltaPhi/2) +
		math.Cos(phi1)*math.Cos(phi2)*
			math.Sin(deltaLambda/2)*math.Sin(deltaLambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return r * c
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	app := fiber.New()

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Initialize Supabase client
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")
	
	client, err := supabase.NewClient(supabaseUrl, supabaseKey, nil)
	if err != nil {
		log.Fatalf("cannot initialize supabase client: %v", err)
	}

	// Health check route
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "success",
			"message": "DevplusApp backend is up and running!",
		})
	})

	// Get users route
	app.Get("/api/users", func(c *fiber.Ctx) error {
		var users []map[string]interface{}
		_, err := client.From("users").Select("*", "exact", false).ExecuteTo(&users)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch users"})
		}

		return c.JSON(fiber.Map{"status": "success", "data": users})
	})

	// Check-in route
	app.Post("/api/attendance/checkin", func(c *fiber.Ctx) error {
		var req CheckInRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
		}

		distance := haversine(req.Latitude, req.Longitude, officeLat, officeLng)
		if distance > maxDistanceMeters {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":    "Too far from office",
				"distance": distance,
			})
		}

		today := time.Now().Format("2006-01-02")
		
		// Insert new record
		record := map[string]interface{}{
			"user_id":       req.UserID,
			"date":          today,
			"check_in_time": time.Now().Format(time.RFC3339),
			"status":        "Checked In",
		}

		_, _, err := client.From("attendance").Insert(record, false, "", "", "").Execute()
		if err != nil {
			log.Printf("Error saving attendance: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save record"})
		}

		return c.JSON(fiber.Map{"status": "success", "message": "Check-in successful", "distance": distance})
	})

	// Check-out route
	app.Post("/api/attendance/checkout", func(c *fiber.Ctx) error {
		var req CheckOutRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
		}

		today := time.Now().Format("2006-01-02")
		
		// Update record for today
		record := map[string]interface{}{
			"check_out_time": time.Now().Format(time.RFC3339),
			"status":         "Completed",
		}

		// Use Eq to target today's attendance for this user
		_, _, err := client.From("attendance").Update(record, "", "").Eq("user_id", req.UserID).Eq("date", today).Execute()
		if err != nil {
			log.Printf("Error updating attendance: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to checkout"})
		}

		return c.JSON(fiber.Map{"status": "success", "message": "Check-out successful"})
	})

	// Get today's attendance state
	app.Get("/api/attendance/today", func(c *fiber.Ctx) error {
		userId := c.Query("user_id")
		if userId == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing user_id"})
		}

		today := time.Now().Format("2006-01-02")
		var records []map[string]interface{}
		_, err := client.From("attendance").Select("*", "exact", false).Eq("user_id", userId).Eq("date", today).ExecuteTo(&records)
		
		if err != nil || len(records) == 0 {
			return c.JSON(fiber.Map{"status": "success", "data": nil}) // Not checked in yet
		}

		return c.JSON(fiber.Map{"status": "success", "data": records[0]})
	})

	// Get attendance history
	app.Get("/api/attendance/history", func(c *fiber.Ctx) error {
		userId := c.Query("user_id")
		if userId == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing user_id"})
		}

		var records []map[string]interface{}
		// Fetch history without Order to avoid undefined module error. We can sort it on the frontend if needed.
		_, err := client.From("attendance").Select("*", "exact", false).Eq("user_id", userId).ExecuteTo(&records)
		
		if err != nil {
			log.Printf("Error fetching history: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch history"})
		}

		return c.JSON(fiber.Map{"status": "success", "data": records})
	})

	// Submit a leave request
	app.Post("/api/leaves", func(c *fiber.Ctx) error {
		var req LeaveRequestPayload
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
		}

		record := map[string]interface{}{
			"user_id":    req.UserID,
			"leave_type": req.LeaveType,
			"start_date": req.StartDate,
			"end_date":   req.EndDate,
			"reason":     req.Reason,
			"status":     "Pending",
		}

		_, _, err := client.From("leave_requests").Insert(record, false, "", "", "").Execute()
		if err != nil {
			log.Printf("Error saving leave request: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to submit leave request"})
		}

		return c.JSON(fiber.Map{"status": "success", "message": "Leave request submitted"})
	})

	// Get leave requests history
	app.Get("/api/leaves", func(c *fiber.Ctx) error {
		userId := c.Query("user_id")
		if userId == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing user_id"})
		}

		var records []map[string]interface{}
		_, err := client.From("leave_requests").Select("*", "exact", false).Eq("user_id", userId).ExecuteTo(&records)
		
		if err != nil {
			log.Printf("Error fetching leave requests: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch leave requests"})
		}

		return c.JSON(fiber.Map{"status": "success", "data": records})
	})

	// Get training programs
	app.Get("/api/training", func(c *fiber.Ctx) error {
		// Mock data for MVP if table doesn't exist or is empty
		mockPrograms := []map[string]interface{}{
			{
				"id": "1",
				"title": "React Native Masterclass",
				"description": "Learn to build mobile apps",
				"progress": 75,
				"image_url": "https://reactnative.dev/img/logo-og.png",
			},
			{
				"id": "2",
				"title": "Go Fiber Backend API",
				"description": "High performance APIs",
				"progress": 100,
				"image_url": "https://gofiber.io/assets/images/logo.svg",
			},
			{
				"id": "3",
				"title": "UI/UX Design Systems",
				"description": "Build beautiful interfaces",
				"progress": 30,
				"image_url": "https://cdn.dribbble.com/users/121337/screenshots/10660602/media/078d49a039ff030c69d80d24eab537de.png",
			},
		}

		// Try fetching from Supabase table `training_programs`
		var records []map[string]interface{}
		_, err := client.From("training_programs").Select("*", "exact", false).ExecuteTo(&records)
		
		if err != nil || len(records) == 0 {
			// Fallback to mock data if table doesn't exist
			return c.JSON(fiber.Map{"status": "success", "data": mockPrograms})
		}

		return c.JSON(fiber.Map{"status": "success", "data": records})
	})

	// Background Cron Job for Auto-Checkout
	go func() {
		for {
			// Run every hour, but only act if it's 23:00 to 23:59 (for simplicity in MVP)
			// For testing, we can just run it every 10 minutes or mock it.
			now := time.Now()
			// If it's near midnight (e.g., hour 23)
			if now.Hour() == 23 {
				log.Println("Running Auto-Checkout Cron Job...")
				today := now.Format("2006-01-02")
				
				// Find all "Checked In" from today and force close them
				autoCheckOutRecord := map[string]interface{}{
					"check_out_time": now.Format(time.RFC3339),
					"status":         "Auto-Checkout",
				}
				
				client.From("attendance").Update(autoCheckOutRecord, "", "").Eq("date", today).Eq("status", "Checked In").Execute()
			}
			
			time.Sleep(1 * time.Hour)
		}
	}()

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
