package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"os"
	"path/filepath"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
	"golang.org/x/crypto/bcrypt"
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

var jwtSecret = []byte("devplus-super-secret-key")

// User represents the users table model
type User struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	PasswordHash string `json:"password_hash"`
	Name         string `json:"name"`
	Role         string `json:"role"`
}

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
	if supabaseUrl == "" {
		supabaseUrl = "https://vescjjkwgkmjhbsgbvvt.supabase.co"
	}
	supabaseKey := os.Getenv("SUPABASE_KEY")
	if supabaseKey == "" {
		supabaseKey = "sb_publishable_b8XTCsANXZ6VAzy4pICO6Q__XsIpI5Y"
	}
	
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

	// Custom Auth Login
	app.Post("/api/auth/login", func(c *fiber.Ctx) error {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
		}

		var users []User
		_, err := client.From("users").Select("*", "exact", false).Eq("email", req.Email).ExecuteTo(&users)
		if err != nil || len(users) == 0 {
			// For testing / fallback if DB query misses
			if req.Email == "admin@devplus.co.th" || req.Email == "admin@devplus.io" || req.Email == "admin" {
				users = []User{{ID: "b31e7bbe-a75a-4aeb-a6ca-b4d1d0777026", Email: "admin@devplus.io", Name: "Alex Morgan", Role: "SUPER_ADMIN"}}
			} else if req.Email == "student@devplus.co.th" || req.Email == "student" || req.Email == "test" {
				users = []User{{ID: "f5cdfe50-528c-4bb2-8289-8f7895e49f6c", Email: "student@devplus.co.th", Name: "Student User", Role: "STUDENT"}}
			} else {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid email or password"})
			}
		} else {
			// Verify bcrypt or fallback testing passwords
			err = bcrypt.CompareHashAndPassword([]byte(users[0].PasswordHash), []byte(req.Password))
			if err != nil && req.Password != "Password1234!" && req.Password != "1234" && req.Password != "admin" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid email or password"})
			}
		}

		user := users[0]

		// Create JWT token
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":   user.ID,
			"email": user.Email,
			"role":  user.Role,
			"name":  user.Name,
			"exp":   time.Now().Add(time.Hour * 72).Unix(),
		})

		tokenString, err := token.SignedString(jwtSecret)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not login"})
		}

		return c.JSON(fiber.Map{
			"status": "success",
			"token":  tokenString,
			"user": map[string]string{
				"id":    user.ID,
				"email": user.Email,
				"name":  user.Name,
				"role":  user.Role,
			},
		})
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
			"id":            uuid.New().String(),
			"userId":       req.UserID,
			"date":          today,
			"checkIn": time.Now().Format(time.RFC3339),
			"status":        "PRESENT",
			"createdAt": time.Now().Format(time.RFC3339),
			"updatedAt": time.Now().Format(time.RFC3339),
		}

		_, _, err := client.From("attendances").Insert(record, false, "", "", "").Execute()
		if err != nil {
			log.Printf("Error saving attendance: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		// Return the checkIn back to frontend so it can calculate duration
		return c.JSON(fiber.Map{"status": "success", "message": "Check-in successful", "distance": distance, "data": map[string]interface{}{"check_in_time": record["checkIn"]}})
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
			"checkOut": time.Now().Format(time.RFC3339),
			"updatedAt": time.Now().Format(time.RFC3339),
		}

		// Use Eq to target today's attendance for this user
		_, _, err := client.From("attendances").Update(record, "", "").Eq("userId", req.UserID).Eq("date", today).Execute()
		if err != nil {
			log.Printf("Error updating attendance: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		return c.JSON(fiber.Map{"status": "success", "message": "Checked out successfully"})
	})

	// Reset attendance for testing
	app.Delete("/api/attendance/reset", func(c *fiber.Ctx) error {
		userId := c.Query("user_id")
		if userId == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User ID is required"})
		}

		today := time.Now().Format("2006-01-02")
		_, _, err := client.From("attendances").Delete("", "").Eq("userId", userId).Eq("date", today).Execute()
		if err != nil {
			log.Printf("Error deleting attendance: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to reset attendance"})
		}

		return c.JSON(fiber.Map{"status": "success", "message": "Reset successfully"})
	})

	// Get today's attendance state
	app.Get("/api/attendance/today", func(c *fiber.Ctx) error {
		userId := c.Query("user_id")
		if userId == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing user_id"})
		}

		today := time.Now().Format("2006-01-02")
		var records []map[string]interface{}
		_, err := client.From("attendances").Select("*", "exact", false).Eq("userId", userId).Eq("date", today).ExecuteTo(&records)
		
		if err != nil || len(records) == 0 {
			return c.JSON(fiber.Map{"status": "success", "data": map[string]string{"status": "NOT_CHECKED_IN"}})
		}

		if records[0]["checkOut"] != nil {
			return c.JSON(fiber.Map{"status": "success", "data": map[string]interface{}{"status": "COMPLETED", "check_in_time": records[0]["checkIn"]}})
		}

		return c.JSON(fiber.Map{"status": "success", "data": map[string]interface{}{"status": "CHECKED_IN", "check_in_time": records[0]["checkIn"]}})
	})

	// Get attendance history
	app.Get("/api/attendance/history", func(c *fiber.Ctx) error {
		userId := c.Query("user_id")
		if userId == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing user_id"})
		}

		var records []map[string]interface{}
		// Fetch history without Order to avoid undefined module error. We can sort it on the frontend if needed.
		_, err := client.From("attendances").Select("*", "exact", false).Eq("userId", userId).ExecuteTo(&records)
		
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
			"id":         uuid.New().String(),
			"studentId":  req.UserID,
			"type":       req.LeaveType,
			"startDate":  req.StartDate,
			"endDate":    req.EndDate,
			"reason":     req.Reason,
			"status":     "PENDING",
			"createdAt": time.Now().Format(time.RFC3339),
			"updatedAt": time.Now().Format(time.RFC3339),
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
			_, err = client.From("leave_requests").Select("*", "exact", false).Eq("studentId", userId).ExecuteTo(&records)
		}
		
		if err != nil {
			log.Printf("Error fetching leave requests: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
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

		baseURL := "http://172.16.0.58:3000/uploads/"

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

	// Q&A Routes
	app.Get("/api/programs/:id/questions", func(c *fiber.Ctx) error {
		programId := c.Params("id")
		
		var allQuestions []map[string]interface{}
		data, err := ioutil.ReadFile("questions_db.json")
		if err == nil {
			json.Unmarshal(data, &allQuestions)
		}

		var allReplies []map[string]interface{}
		replyData, err := ioutil.ReadFile("replies_db.json")
		if err == nil {
			json.Unmarshal(replyData, &allReplies)
		}

		var questions []map[string]interface{}
		for _, q := range allQuestions {
			if q["program_id"] == programId {
				qId := q["id"].(string)
				qReplies := make([]map[string]interface{}, 0)
				for _, r := range allReplies {
					if r["question_id"] == qId {
						qReplies = append(qReplies, r)
					}
				}
				q["replyList"] = qReplies
				q["replies"] = len(qReplies)
				questions = append(questions, q)
			}
		}

		// Sort questions by time (descending) can be skipped for simplicity, or just reverse
		for i, j := 0, len(questions)-1; i < j; i, j = i+1, j-1 {
			questions[i], questions[j] = questions[j], questions[i]
		}

		return c.JSON(fiber.Map{"status": "success", "data": questions})
	})

	app.Post("/api/programs/:id/questions", func(c *fiber.Ctx) error {
		programId := c.Params("id")
		var payload map[string]interface{}
		if err := c.BodyParser(&payload); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
		}
		
		var allQuestions []map[string]interface{}
		data, _ := ioutil.ReadFile("questions_db.json")
		if len(data) > 0 {
			json.Unmarshal(data, &allQuestions)
		}

		newQuestion := map[string]interface{}{
			"id":         uuid.New().String(),
			"program_id": programId,
			"author":     payload["author"],
			"title":      payload["title"],
			"content":    payload["content"],
			"tags":       payload["tags"],
			"likes":      0,
			"time":       "Just now",
			"created_at": time.Now().Format(time.RFC3339),
		}

		allQuestions = append(allQuestions, newQuestion)
		
		fileData, _ := json.MarshalIndent(allQuestions, "", "  ")
		ioutil.WriteFile("questions_db.json", fileData, 0644)
		
		return c.JSON(fiber.Map{"status": "success", "data": newQuestion})
	})

	app.Post("/api/questions/:id/replies", func(c *fiber.Ctx) error {
		questionId := c.Params("id")
		var payload map[string]interface{}
		if err := c.BodyParser(&payload); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
		}
		
		var allReplies []map[string]interface{}
		data, _ := ioutil.ReadFile("replies_db.json")
		if len(data) > 0 {
			json.Unmarshal(data, &allReplies)
		}

		newReply := map[string]interface{}{
			"id":          uuid.New().String(),
			"question_id": questionId,
			"author":      payload["author"],
			"content":     payload["content"],
			"time":        "Just now",
			"created_at":  time.Now().Format(time.RFC3339),
		}

		allReplies = append(allReplies, newReply)
		
		fileData, _ := json.MarshalIndent(allReplies, "", "  ")
		ioutil.WriteFile("replies_db.json", fileData, 0644)
		
		return c.JSON(fiber.Map{"status": "success", "data": newReply})
	})

	app.Post("/api/questions/:id/like", func(c *fiber.Ctx) error {
		questionId := c.Params("id")
		var payload map[string]interface{}
		c.BodyParser(&payload)
		
		var allQuestions []map[string]interface{}
		data, _ := ioutil.ReadFile("questions_db.json")
		if len(data) > 0 {
			json.Unmarshal(data, &allQuestions)
		}

		currentLikes := 0
		for i, q := range allQuestions {
			if q["id"] == questionId {
				likes := 0
				if val, ok := q["likes"].(float64); ok {
					likes = int(val)
				}
				if payload["increment"] == false {
					likes--
				} else {
					likes++
				}
				if likes < 0 {
					likes = 0
				}
				allQuestions[i]["likes"] = likes
				currentLikes = likes
				break
			}
		}

		fileData, _ := json.MarshalIndent(allQuestions, "", "  ")
		ioutil.WriteFile("questions_db.json", fileData, 0644)
		
		return c.JSON(fiber.Map{"status": "success", "likes": currentLikes})
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
					"checkOut": now.Format(time.RFC3339),
					"updatedAt": now.Format(time.RFC3339),
				}
				
				client.From("attendances").Update(autoCheckOutRecord, "", "").Is("checkOut", "null").Eq("date", today).Execute()
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
