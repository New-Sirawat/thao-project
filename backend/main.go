package main

import (
	"log"
	"math"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
	"encoding/json"
	"io/ioutil"
	"path/filepath"
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

	app := fiber.New(fiber.Config{
		BodyLimit: 100 * 1024 * 1024, // Allow up to 100MB for video uploads
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Ensure uploads directory exists
	os.MkdirAll("./uploads", os.ModePerm)
	// Serve static files from uploads directory
	app.Static("/uploads", "./uploads")

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
		
		var records []map[string]interface{}
		var err error
		
		if userId == "" {
			// Fetch all leave requests (for Mentor)
			_, err = client.From("leave_requests").Select("*", "exact", false).ExecuteTo(&records)
		} else {
			// Fetch leave requests for specific user
			_, err = client.From("leave_requests").Select("*", "exact", false).Eq("user_id", userId).ExecuteTo(&records)
		}
		
		if err != nil {
			log.Printf("Error fetching leave requests: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch leave requests"})
		}

		return c.JSON(fiber.Map{"status": "success", "data": records})
	})

	// Update leave request status (Approve/Reject)
	app.Put("/api/leaves/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		
		var payload struct {
			Status string `json:"status"`
		}
		
		if err := c.BodyParser(&payload); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
		}

		updateRecord := map[string]interface{}{
			"status": payload.Status,
		}

		_, _, err := client.From("leave_requests").Update(updateRecord, "", "").Eq("id", id).Execute()
		if err != nil {
			log.Printf("Error updating leave request: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update leave request"})
		}

		return c.JSON(fiber.Map{"status": "success", "message": "Leave request updated"})
	})

	// Get training programs
	app.Get("/api/training", func(c *fiber.Ctx) error {
		var programs []map[string]interface{}
		
		// Read from local JSON DB
		data, err := ioutil.ReadFile("training_db.json")
		if err == nil {
			json.Unmarshal(data, &programs)
		} else {
			// Initialize with mock data if file doesn't exist
			programs = []map[string]interface{}{
				{
					"id": "1",
					"title": "React Native Masterclass",
					"description": "Learn to build mobile apps",
					"progress": 75,
					"image_url": "https://reactnative.dev/img/logo-og.png",
					"syllabus": []map[string]interface{}{
						{"id": "1", "title": "Introduction to React Native", "completed": true},
						{"id": "2", "title": "Navigation & Routing", "completed": true},
						{"id": "3", "title": "State Management", "completed": false},
					},
				},
			}
			fileData, _ := json.MarshalIndent(programs, "", "  ")
			ioutil.WriteFile("training_db.json", fileData, 0644)
		}

		return c.JSON(fiber.Map{"status": "success", "data": programs})
	})

	// Create training program
	app.Post("/api/training", func(c *fiber.Ctx) error {
		title := c.FormValue("title")
		description := c.FormValue("description")
		
		if title == "" || description == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Title and description are required"})
		}

		program := map[string]interface{}{
			"id":          uuid.New().String(),
			"title":       title,
			"description": description,
			"progress":    0,
			"image_url":   "",
			"pdf_url":     "",
			"video_url":   "",
		}

		baseURL := "http://192.168.2.28:3000/uploads/"

		// Handle Cover Image
		if file, err := c.FormFile("coverImage"); err == nil {
			filename := uuid.New().String() + filepath.Ext(file.Filename)
			c.SaveFile(file, fmt.Sprintf("./uploads/%s", filename))
			program["image_url"] = baseURL + filename
		} else {
			program["image_url"] = "https://reactnative.dev/img/logo-og.png" // default
		}

		// Handle PDF
		if file, err := c.FormFile("pdfFile"); err == nil {
			filename := uuid.New().String() + filepath.Ext(file.Filename)
			c.SaveFile(file, fmt.Sprintf("./uploads/%s", filename))
			program["pdf_url"] = baseURL + filename
		}

		// Handle Video
		if file, err := c.FormFile("videoFile"); err == nil {
			filename := uuid.New().String() + filepath.Ext(file.Filename)
			c.SaveFile(file, fmt.Sprintf("./uploads/%s", filename))
			program["video_url"] = baseURL + filename
		}

		// Save to JSON DB
		var programs []map[string]interface{}
		data, err := ioutil.ReadFile("training_db.json")
		if err == nil {
			json.Unmarshal(data, &programs)
		}
		
		programs = append([]map[string]interface{}{program}, programs...) // Add to beginning
		
		fileData, _ := json.MarshalIndent(programs, "", "  ")
		ioutil.WriteFile("training_db.json", fileData, 0644)

		return c.JSON(fiber.Map{"status": "success", "data": program})
	})

	// Get schedules
	app.Get("/api/schedules", func(c *fiber.Ctx) error {
		var schedules []map[string]interface{}
		data, err := ioutil.ReadFile("schedule_db.json")
		if err == nil {
			json.Unmarshal(data, &schedules)
		} else {
			// Mock default
			schedules = []map[string]interface{}{
				{
					"id": "1",
					"title": "React Native Workshop",
					"time": "10:00 AM - 11:30 AM",
					"location": "Room 302",
					"type": "workshop",
				},
				{
					"id": "2",
					"title": "Project Demo Prep",
					"time": "3:00 PM - 4:00 PM",
					"location": "Google Meet",
					"type": "meeting",
				},
			}
			fileData, _ := json.MarshalIndent(schedules, "", "  ")
			ioutil.WriteFile("schedule_db.json", fileData, 0644)
		}
		return c.JSON(fiber.Map{"status": "success", "data": schedules})
	})

	// Create schedule
	app.Post("/api/schedules", func(c *fiber.Ctx) error {
		var body struct {
			Title    string `json:"title"`
			Time     string `json:"time"`
			Location string `json:"location"`
			Type     string `json:"type"`
		}
		
		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}

		if body.Title == "" || body.Time == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Title and time are required"})
		}

		schedule := map[string]interface{}{
			"id":       uuid.New().String(),
			"title":    body.Title,
			"time":     body.Time,
			"location": body.Location,
			"type":     body.Type,
		}

		var schedules []map[string]interface{}
		data, err := ioutil.ReadFile("schedule_db.json")
		if err == nil {
			json.Unmarshal(data, &schedules)
		}
		
		schedules = append([]map[string]interface{}{schedule}, schedules...) // Add to beginning
		fileData, _ := json.MarshalIndent(schedules, "", "  ")
		ioutil.WriteFile("schedule_db.json", fileData, 0644)

		// Create Alert for the new schedule
		var alerts []map[string]interface{}
		alertData, err := ioutil.ReadFile("alerts_db.json")
		if err == nil {
			json.Unmarshal(alertData, &alerts)
		}

		alert := map[string]interface{}{
			"id":    uuid.New().String(),
			"title": fmt.Sprintf("New Schedule: %s", body.Title),
			"time":  "Just now",
			"type":  "info", // info, warning, success
		}
		alerts = append([]map[string]interface{}{alert}, alerts...)
		alertFileData, _ := json.MarshalIndent(alerts, "", "  ")
		ioutil.WriteFile("alerts_db.json", alertFileData, 0644)

		return c.JSON(fiber.Map{"status": "success", "data": schedule})
	})

	// Get alerts (used for Recent Activity)
	app.Get("/api/alerts", func(c *fiber.Ctx) error {
		var alerts []map[string]interface{}
		data, err := ioutil.ReadFile("alerts_db.json")
		if err == nil {
			json.Unmarshal(data, &alerts)
		}
		return c.JSON(fiber.Map{"status": "success", "data": alerts})
	})

	// Get notifications
	app.Get("/api/notifications", func(c *fiber.Ctx) error {
		var notifications []map[string]interface{}
		data, err := ioutil.ReadFile("notifications_db.json")
		if err == nil {
			json.Unmarshal(data, &notifications)
		} else {
			notifications = []map[string]interface{}{
				{
					"id": "1",
					"title": "Welcome to Devplus",
					"message": "Please complete your onboarding profile.",
					"time": "2 hours ago",
					"isRead": false,
				},
				{
					"id": "2",
					"title": "Leave Request Approved",
					"message": "Your leave request for tomorrow has been approved.",
					"time": "5 hours ago",
					"isRead": true,
				},
			}
			fileData, _ := json.MarshalIndent(notifications, "", "  ")
			ioutil.WriteFile("notifications_db.json", fileData, 0644)
		}
		return c.JSON(fiber.Map{"status": "success", "data": notifications})
	})

	// Get announcements
	app.Get("/api/announcements", func(c *fiber.Ctx) error {
		var announcements []map[string]interface{}
		data, err := ioutil.ReadFile("announcements_db.json")
		if err == nil {
			json.Unmarshal(data, &announcements)
		} else {
			announcements = []map[string]interface{}{
				{
					"id": "1",
					"title": "Townhall Meeting this Friday",
					"content": "Don't forget to join our monthly townhall meeting at 3 PM in the main hall.",
					"date": "24 Jun 2026",
					"author": "HR Department",
					"isNew": true,
				},
				{
					"id": "2",
					"title": "New React Native Course Available",
					"content": "Check out the Training tab for the new advanced React Native masterclass.",
					"date": "22 Jun 2026",
					"author": "Training Team",
					"isNew": false,
				},
			}
			fileData, _ := json.MarshalIndent(announcements, "", "  ")
			ioutil.WriteFile("announcements_db.json", fileData, 0644)
		}
		return c.JSON(fiber.Map{"status": "success", "data": announcements})
	})

	// Get mentor's students
	app.Get("/api/students", func(c *fiber.Ctx) error {
		var students []map[string]interface{}
		data, err := ioutil.ReadFile("students_db.json")
		if err == nil {
			json.Unmarshal(data, &students)
		} else {
			students = []map[string]interface{}{
				{
					"id": "1",
					"name": "Nguyen Van A",
					"role": "Frontend Intern",
					"phone": "098-123-4567",
					"email": "nguyenvana@devplus.edu.vn",
					"isCheckedIn": true,
				},
				{
					"id": "2",
					"name": "Tran Thi B",
					"role": "Backend Intern",
					"phone": "091-234-5678",
					"email": "tranthib@devplus.edu.vn",
					"isCheckedIn": true,
				},
				{
					"id": "3",
					"name": "Le Van C",
					"role": "UI/UX Intern",
					"phone": "090-345-6789",
					"email": "levanc@devplus.edu.vn",
					"isCheckedIn": false,
				},
				{
					"id": "4",
					"name": "Pham D",
					"role": "Mobile Intern",
					"phone": "093-456-7890",
					"email": "phamd@devplus.edu.vn",
					"isCheckedIn": false,
				},
			}
			fileData, _ := json.MarshalIndent(students, "", "  ")
			ioutil.WriteFile("students_db.json", fileData, 0644)
		}

		// Calculate stats
		total := len(students)
		checkedIn := 0
		for _, s := range students {
			if s["isCheckedIn"] == true {
				checkedIn++
			}
		}

		return c.JSON(fiber.Map{
			"status": "success", 
			"data": students,
			"stats": map[string]interface{}{
				"total": total,
				"checkedIn": checkedIn,
				"absent": total - checkedIn,
			},
		})
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
