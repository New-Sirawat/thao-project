# DEVPLUS APP - STUDENT MOBILE APP TEST CASES

เอกสารนี้ใช้สำหรับทดสอบการทำงานของ Mobile App (ฝั่ง Student) ตาม Use Case ทั้งหมดที่ได้รับมอบหมาย โดยมีจุดประสงค์เพื่อให้แน่ใจว่าทุกฟังก์ชันทำงานได้อย่างถูกต้องร่วมกับระบบฐานข้อมูล Supabase

---

## 🟢 1. AUTHENTICATION & AUTHORIZATION
### Test Case 1.1: Login (Developer Bypass)
- **Use Case:** UC-1.1
- **Steps:**
  1. เปิดแอปพลิเคชัน (หรือรัน `npm run web`)
  2. ในช่อง Email พิมพ์คำว่า `test`
  3. ในช่อง Password พิมพ์รหัสผ่านอะไรก็ได้ (เช่น `1234`)
  4. กดปุ่ม "Sign In"
- **Expected Result:** เข้าสู่ระบบได้สำเร็จ และเปลี่ยนหน้าไปยัง HomeScreen พร้อมแสดงชื่อนักศึกษา "Somchai Jaidee (Test Mode)"

### Test Case 1.2: Logout
- **Use Case:** UC-1.2
- **Steps:**
  1. ไปที่เมนู "Profile" (แท็บขวาสุด)
  2. เลื่อนลงมาด้านล่างสุด แล้วกดปุ่ม "Log Out"
  3. ยืนยันการออกจากระบบบน Popup
- **Expected Result:** ระบบนำผู้ใช้กลับไปยังหน้า LoginScreen ทันที

---

## 🟢 2. PROFILE MANAGEMENT
### Test Case 2.1: View Personal Profile
- **Use Case:** UC-2.2
- **Steps:**
  1. ล็อคอินเข้าสู่ระบบ
  2. ไปที่แท็บ "Profile"
- **Expected Result:** แสดงข้อมูลส่วนตัวของนักศึกษา (Email, Phone, Location) โดยดึงข้อมูลล่าสุดมาจากตาราง `profiles` ในฐานข้อมูล

### Test Case 2.2: Edit Personal Profile
- **Use Case:** UC-2.3
- **Steps:**
  1. ในหน้า Profile กดปุ่ม "Edit Profile" (ไอคอนสีฟ้า)
  2. แก้ไขข้อมูลเบอร์โทรศัพท์ (Phone) หรือที่อยู่ (Location)
  3. กดปุ่ม "Save Changes"
- **Expected Result:** มี Popup แจ้งเตือนอัปเดตสำเร็จ และหน้าต่าง Profile จะแสดงข้อมูลใหม่ที่เพิ่งแก้ไข (ข้อมูลจะถูกบันทึกลง Supabase)

---

## 🟢 3. TRAINING PLAN
### Test Case 3.1: View Training Plan
- **Use Case:** UC-3.2
- **Steps:**
  1. ไปที่แท็บ "Training"
- **Expected Result:** แสดงข้อมูลแผนการฝึกงานที่ดึงมาจากตาราง `training_plans` ในฐานข้อมูล เช่น หัวข้อการฝึกงาน (Phase), ระยะเวลา, และสถานะความคืบหน้า (Progress)

---

## 🟢 4. ATTENDANCE (GPS CHECK-IN)
### Test Case 4.1: GPS Check-in
- **Use Case:** UC-5.1
- **Steps:**
  1. ไปที่แท็บ "Home"
  2. ระบบจะทำการดึงพิกัด GPS ปัจจุบันของคุณ และเทียบกับระยะทางของบริษัท (96 Nguyễn Đình Hoàn)
  3. กดปุ่ม "Check In" สีเขียวใหญ่ตรงกลางจอ
- **Expected Result:** 
  - ถ้าระยะทาง **ไม่เกิน 500 เมตร**: ระบบจะบันทึก Check-in สำเร็จ และเริ่มจับเวลาทำงาน
  - ถ้าระยะทาง **เกิน 500 เมตร**: จะมี Popup แจ้งเตือนว่า "คุณอยู่นอกพื้นที่บริษัท" (สามารถกดปุ่ม Bypass Location เพื่อจำลองการเข้าใกล้บริษัทได้)

### Test Case 4.2: View Attendance History
- **Use Case:** UC-5.3
- **Steps:**
  1. ไปที่แท็บ "Home"
  2. กดปุ่ม "View History" ใต้ปุ่ม Check-in
- **Expected Result:** นำทางไปยังหน้า Attendance History และแสดงรายการการเข้างานที่ผ่านมา (ดึงจากตาราง `attendances`) โดยจะแสดงเวลาเข้า-ออก และสถานะ (เช่น On Time, Late)

---

## 🟢 5. LEAVE REQUEST
### Test Case 5.1: Submit Leave Request
- **Use Case:** UC-6.1
- **Steps:**
  1. ไปที่หน้าแรก (Home) แล้วกดการ์ด "Leave Request" (หรือไปจากเมนูลัด)
  2. กรอกวันที่ลา (Start Date - End Date)
  3. เลือกประเภทการลา (Type) เช่น Sick Leave, Personal Leave
  4. ระบุเหตุผลการลา (Reason) แล้วกด "Submit Request"
- **Expected Result:** คำขอลาจะถูกบันทึกสำเร็จลงตาราง `leave_requests` และกลับมาที่หน้าหลัก

### Test Case 5.2: View Leave Request Status
- **Use Case:** UC-6.2
- **Steps:**
  1. ไปที่เมนู Leave Request 
  2. ดูที่หมวด "My Requests" หรือ "Pending Requests"
- **Expected Result:** แสดงรายการที่เคยขอลาไว้ และสถานะปัจจุบัน (เช่น Pending, Approved) แบบ Real-time ตามฐานข้อมูล

---

## 🟢 6. Q&A MANAGEMENT
### Test Case 6.1: Submit & View Q&A
- **Use Case:** UC-8.1, UC-8.2
- **Steps:**
  1. ไปที่แท็บ "Q&A" (ไอคอนรูปแชท)
  2. กดปุ่ม "+ New Question"
  3. พิมพ์หัวข้อคำถาม (Title) และเนื้อหา (Content)
  4. กดปุ่ม "Submit"
  5. กลับมาดูที่หน้ารวม Q&A
- **Expected Result:** คำถามที่ตั้งใหม่จะโผล่ในรายการ (ดึงจาก `qa_questions`) และเมื่อมี Mentor มาตอบ จะมีข้อความแสดงในหน้ารายละเอียด (ดึงจาก `qa_answers`)

---

## 🟢 7. EVENT MANAGEMENT
### Test Case 7.1: View Event List & Details
- **Use Case:** UC-9.1
- **Steps:**
  1. ไปที่หน้าแรก (Home) เลื่อนลงมาที่หมวด "Upcoming Events" (หรือเข้าจากไอคอนปฏิทิน Events/Announcements)
  2. สังเกตรายการ Event ที่แสดงอยู่
  3. กดคลิกที่ Event เพื่ออ่านรายละเอียดเพิ่มเติม
- **Expected Result:** แสดงรายชื่อและรายละเอียดของกิจกรรมที่มาจากตาราง `events` ใน Supabase อย่างถูกต้อง (เช่น วันที่จัดงาน, สถานที่, และคำอธิบาย)
