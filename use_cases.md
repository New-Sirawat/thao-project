USE CASE SPECIFICATION DOCUMENT – DEVPLUS APP
Platform scope:
BD Team: Uses the Web interface
Mentor: Uses the Web interface
Student: Uses the Mobile App (iOS/Android)
1. AUTHENTICATION AND AUTHORIZATION MANAGEMENT
1.1. Login
Use case ID
1.1
Use case name
Login
Description
Allows users to log in to the DevPlusApp system. The system automatically detects the user's role in order to direct BD Team to the Web interface, direct Mentor to the Web interface, and direct Student to the corresponding Mobile App interface.
Actors
BD Team (Web User), Mentor (Web User), Student (App User)
Priority
High
Triggers
✅ The user opens the system website (BD Team and Mentor) or opens the DevPlusApp mobile application (Student) and performs login. 
Pre-conditions
The user's account has been saved in the database and is active. ⚠️should change to “The user's account has been created.”
- BD Team and Mentor access the system via the Web interface. ✅
- Student has downloaded and opened the Mobile App on their phone. @new
Post-conditions
✅ The user logs in successfully and is directed to the corresponding module on their platform.
Main flow
✅1. The user accesses the login screen (Web page for BD Team/Mentor or Mobile App for Student). 
2. The user enters account information including Email and Password.
✅3. The user requests the system to perform login. 
✅4. The system checks the input data format and authenticates the account information against the database. 
✅5. The system confirms the login information is valid and initializes a session for the account. 
✅6. The system directs the user to the corresponding home interface: 
- BD Team: Goes to the admin Dashboard page on the Web. 
- Mentor: Goes to the internship program management page on the Web. 
⚠️first page go to the mentor dashboard also
@new - Student: Goes to the main screen interface on the Mobile App.
Alternative flows
This flow is triggered after step 4 of the Main flow, applicable to Students logging in with a temporary password: 
✅ 4.1. The system detects the account is in "Pending Active" status. 
✅ 4.2. The system displays a mandatory new-password screen. 
✅ 4.3. Student enters a new password and confirms it. 
✅ 4.4. Student requests to save the new password. 
✅ 4.5. The system checks validity, updates the new password, and changes the account status to "Activated". 
✅4.6. The system continues with steps 5 and 6 of the Main flow.
Exception flows
✅4.a. Incorrect login information: The system displays the error 
"Incorrect username or password. Please try again!" and keeps the login screen unchanged. 
4.b. More than 3 failed login attempts: The system locks the account for 2 minutes and displays a temporary lockout notice. 
⚠️ wait to dev
 4.c. Incorrect email format: The system displays the error message directly below the input field.
⚠️ swap 4.b with 4.c
Business rules
✅- BD Team and Mentor
 accounts cannot log in to the Mobile App. 
✅- Student accounts cannot log in to the admin Web page.
Non-functional requirements
✅- The Web interface (BD Team and Mentor) must display well on popular browsers (Chrome, Edge, Safari). 
✅- The App interface (Student) must be compatible with both Android and iOS.



✅ 1.2. Logout
Use case ID
1.2
Use case name
Logout
Description
✅Allows users (Student, Mentor, BD Team) to exit their current session. 
The system terminates the login session (Session/Token) and returns the user to the corresponding login screen for their platform (Web or Mobile App).
Actors
• Student (App User)
✅• Mentor (Web User) 
✅• BD Team (Web User)
Priority
High
Triggers
✅The user clicks the "Log out" button or icon on the system interface.
Pre-conditions
✅The user has successfully logged in and is active ⚠️change to has a valid active session. on the Web interface (BD Team/Mentor) or Mobile App (Student).
Post-conditions
✅- The user's session (Session/Token) is completely removed from the system. - The user cannot use the "Back" button to return to the internal interface without logging in again.
Main flow
✅ 1. The user clicks "Log out" on the menu bar. 
✅ 2. The system displays a confirmation dialog: "Are you sure you want to log out?" with [OK] and [Cancel] buttons. 
✅ 3. The user clicks [OK]. 
✅ 4. The system clears the account's session (Clear Session/Token). 
✅ 5. The system redirects the user to the corresponding login screen.
Alternative flows
✅ At step 3, if the user clicks [Cancel]: 
- The system closes the dialog and keeps the current working interface unchanged.
Exception flows
If the device loses network connection while logging out: 
The system deletes the login information on the device (Local Storage/Cookies) and displays the message "You have logged out offline."
⚠️ Remove this exception flow. Offline logout is not supported by the current system, and this scenario is outside the project scope.
Business rules
N/A
Non-functional requirements
N/A 



2. ACCOUNT MANAGEMENT
2.1. Create account
Use case ID
2.1
Use case name
Create account
Description
✅Allows the BD Team to create a new account for a Mentor or Student on the Web interface. Once created successfully, the system sends an email containing an activation link for the user to set up their own password.
Actors
BD Team (Web User)
Priority
Very High
Triggers
✅BD Team needs to provision an account for a new Mentor or Student joining the program.
Pre-conditions
✅BD Team has successfully logged in to the Web interface and has access to the "Account Management" module.
Post-conditions
✅- A new account is recorded in the database with "Pending Active" status. 
✅- An email containing a password-setup link is sent successfully.
Main flow
✅1. BD Team accesses the "User Management" menu on the Web interface and clicks "Create new account". 
2. The system displays a form with fields: Full name, Email (required), Phone number, Role (Mentor or Student).
⚠️ Change the form fields to: Email, Role, Organization
✅3. BD Team fills in all information and clicks "Save/Create account". ⚠️Change to “Send Invite” 
✅4. The system checks for validity and duplicates in the database.
✅5. The system saves the account with "Pending Active" status and generates an authentication token. 
✅6. The system sends an activation email to the user's email address. 
✅7. The system displays a success message and updates the account list. 
✅8. The user opens the email and clicks the activation link to go to the setup their account.
9. The user enters their password, confirms it, and clicks "Activate account". 
10. The system encrypts and saves the password, changes the account status to "Activated", and displays a success notification.
Alternative flows
N/A
Exception flows
4.a. Email already exists: The system displays an error at the Email field: "This email already exists in the system. Please check again!" 
9.a. Invalid or mismatched password: The system displays a warning and requires re-entry.
Business rules
N/A
Non-functional requirements
The time to save data and trigger the email-sending process must not exceed 2 seconds.


✅ 2.2. View account information
Use case ID
2.2
Use case name
View account information
Description
Allows users to view account profile details. BD Team has the right to search for and view the information of any Mentor/Student on the Web. Mentor and Student have the right to view their own personal information on their respective platforms.
Actors
Student (App User), Mentor (Web User), BD Team (Web User)
Priority
Very High
Triggers
- BD Team accesses the "User Management" menu on the Web. - Mentor clicks "My Profile" on the Web. - Student opens the app and clicks "My Profile" on the Mobile App.
Pre-conditions
The user has successfully logged in to the system.
Post-conditions
The account information is queried by the system and accurately displayed on the screen.
Main flow
BRANCH 1 – BD Team (Web): 1. BD Team selects "User Management" on the dashboard. 2. The system displays the user list with a search bar and advanced filters. 3. BD Team searches or filters to locate the user to check. 4. BD Team clicks the "View" icon in the Actions column to view the profile details. BRANCH 2 – Mentor (Web): 1. Mentor clicks "My Profile" on the Web menu bar. 2. The system displays the personal information of the logged-in Mentor. BRANCH 3 – Student (Mobile App): 1. Student opens the app and accesses the personal account module. 2. The system navigates to the My Profile interface and displays full personal information.
Alternative flows
N/A
Exception flows
N/A
Business rules
Student and Mentor do not have permission to view other users' information. The Profile screen only displays data for the currently logged-in account.
Non-functional requirements
N/A


✅ 2.3. Edit account information
Use case ID
2.3
Use case name
Edit account information
Description
Allows users to update account information. BD Team uses the Web interface to edit information, permissions, or transfer any member to a different unit. Mentor uses the Web and Student uses the Mobile App to update their own personal information.
Actors
BD Team (Web User), Mentor (Web User), Student (App User)
Priority
High
Triggers
The user needs to change or update account information in the system.
Pre-conditions
The user has successfully logged in to the system with the corresponding role.
Post-conditions
The changed information is successfully updated in the database and synchronously displayed on the user interface.
Main flow
BRANCH 1 – BD Team (Web): 1. BD Team requests the system to display the user list. 2. BD Team selects the account to edit. 3. BD Team requests to edit information (role, unit, status). 4. The system displays the current information and allows entry of new information. 5. BD Team enters new information and confirms saving. 6. The system validates, updates the data, and displays a success message. BRANCH 2 – Mentor (Web) and Student (Mobile App): 1. The user accesses the view-personal-information function. 2. The user requests to edit profile information. 3. The system displays editable fields (Phone number, Location, Avatar). 4. The user enters new information and confirms the update. 5. The system records the new data and re-displays the latest information.
Alternative flows
N/A
Exception flows
N/A
Business rules
- Mentor and Student are not permitted to edit their own "Email" and "Role" fields. These fields can only be changed by BD Team on the Web. - When BD Team changes an account's role, the system must synchronize permissions and update the interface in the next session.
Non-functional requirements
After confirming save, the processing and re-display time for the new information must not exceed 1.5 seconds.


2.4. Deactivate account
Use case ID
2.4
Use case name
Deactivate account
Description
Allows the BD Team to temporarily lock or revoke access for one or more accounts (Student or Mentor) in the system without deleting data.
Actors
BD Team (Web User)
Priority
High
Triggers
N/A
Pre-conditions
BD Team has successfully logged in to the Web system and is in the "Account Management" module. The affected account must currently be in Active status.
Post-conditions
- The status of the selected account changes to "Inactive" in the database. - The user owning the deactivated account is immediately logged out and cannot log in again.
Main flow
1. BD Team requests the system to display the user list. 2. BD Team selects one or more accounts to deactivate. 3. BD Team requests the system to deactivate the account(s). 4. The system displays a warning dialog and requests confirmation. 5. BD Team confirms. 6. The system updates the account status to "Inactive" and displays a success message.
Alternative flows
At step 4, if BD Team declines to confirm: - The system closes the dialog. - The account status remains unchanged.
Exception flows
N/A
Business rules
Any account with "Inactive" status will be denied access at the login flow (UC-1.1).
Non-functional requirements
N/A



3. INTERNSHIP PROGRAM MANAGEMENT
3.1. Upload Training Plan
Use case ID
3.1
Use case name
Upload Training Plan
Description
Allows the responsible Mentor to upload training plan documents in PDF format to the system via the Web interface, in order to store and share the learning roadmap with Students under their supervision.
Actors
Mentor (Web User)
Priority
High
Triggers
Mentor reaches a stage requiring preparation or update of a new training roadmap for the course/internship term.
Pre-conditions
Mentor has successfully logged in to the Web interface and the account is in Active status.
Post-conditions
The PDF document file is uploaded successfully, stored in the database, and made publicly available for relevant Students to view/download.
Main flow
1. Mentor accesses the Training Management module on the Web interface. 2. Mentor requests to upload a new training plan document. 3. The system displays a form requesting file selection. 4. Mentor selects the document file from their computer. 5. Mentor confirms the Upload command. 6. The system receives the file and checks its validity in terms of format and size. 7. The system stores the file, records the information in the database, and notifies the Mentor of success.
Alternative flows
N/A
Exception flows
N/A
Business rules
N/A
Non-functional requirements
N/A


✅ 3.2. View Training Plan
Use case ID
3.2
Use case name
View Training Plan
Description
Allows Mentor and Student to view the content of the training plan uploaded to the system. Mentor views it on the Web interface; Student views it on the Mobile App.
Actors
Mentor (Web User), Student (App User)
Priority
High
Triggers
The user needs to view the training plan for the internship program.
Pre-conditions
The user has successfully logged in to the system. The Training Plan has been uploaded by the Mentor.
Post-conditions
The Training Plan content is accurately displayed on the user's interface.
Main flow
BRANCH 1 – Mentor (Web): 1. Mentor accesses the Training Management module on the Web interface. 2. The system displays the list of uploaded Training Plans. 3. Mentor clicks on a specific Training Plan to view its detailed content. BRANCH 2 – Student (Mobile App): 1. Student opens the app and accesses the Training Plan section. 2. The system displays the Training Plan assigned to the Student. 3. Student clicks to view the detailed content of each stage.
Alternative flows
N/A
Exception flows
N/A
Business rules
Student can only view the Training Plan of the program they are participating in, not those of other programs.
Non-functional requirements
N/A



4. LEAVE REQUEST MANAGEMENT (MENTOR)
4.1. Approve leave request
Use case ID
4.1
Use case name
Approve leave request
Description
Allows Mentor to review, approve, or reject leave requests submitted by Students under their supervision. Mentor performs this action on the Web interface.
Actors
Mentor (Web User)
Priority
High
Triggers
Mentor receives a notification of a new leave request from a Student that needs to be processed.
Pre-conditions
Mentor has successfully logged in to the Web interface. Student has submitted a leave request and the request is in "Pending" status.
Post-conditions
The leave request status is updated in the database (Approved or Rejected). The system automatically sends a result notification to the corresponding Student's account.
Main flow
1. Mentor accesses the leave request management list on the Web interface. 
2. The system displays the list of leave requests currently pending processing. 
3. Mentor selects a specific leave request to view details (including: Student name, Leave date, Reason, Supporting documents if any). 
4. Mentor performs one of two actions: - Approve: Mentor confirms approval of the request. - Reject: Mentor enters a reason for rejection and confirms disapproval. 
5. The system records the result, updates the request status in the database, notifies the Mentor, and sends a status-change notification to the Student.
Alternative flows
At step 4, before clicking confirm, Mentor can choose to go back to the list: - The system closes the detail view screen. - The request status remains "Pending".
Exception flows
N/A
Business rules
Once a request has been approved or rejected by the Mentor, the request status is locked. Neither the Student nor the Mentor can change the decision.
Non-functional requirements
N/A



5. ATTENDANCE MANAGEMENT
✅ 5.1. Check-in
Use case ID
5.1
Use case name
Check-in
Description
Allows Student to perform daily check-in on the Mobile App upon arriving at the internship unit, so the system can record the time and calculate attendance.
Actors
Student (App User)
Priority
High
Triggers
Student arrives at the internship company and opens the app to check in at the start of the work session.
Pre-conditions
- Student has successfully logged in to the Mobile App. 
- The mobile device must have location access (GPS) enabled and have an internet connection.
Post-conditions
The system records the date, time, coordinates, and check-in status in the database, and simultaneously syncs it to the supervising Mentor's account.
Main flow
1. Student accesses the Check-in function on the app. 
2. The system automatically activates GPS and retrieves the Student's actual location coordinates. 
3. The system retrieves the address and original coordinates of the company where the Student is interning. 
4. The system displays the actual timestamp along with location information and asks the Student to confirm. 
5. Student clicks to confirm Check-in. 
6. The system calculates the distance between the Student's coordinates and the company's coordinates to verify validity. 
7. The system records the Check-in data successfully and displays the message "Check-in successful" along with the timestamp.
Alternative flows
N/A
Exception flows
N/A
Business rules
N/A
Non-functional requirements
The GPS positioning and distance calculation process must respond within no more than 3 seconds.


✅ 5.2. Check-out
Use case ID
5.2
Use case name
Check-out
Description
Allows Student to check out on the Mobile App at the end of a work shift. The system automatically records the time and classifies the attendance status (On time, Left early, Overtime).
Actors
Student (App User)
Priority
High
Triggers
Student finishes their work shift and opens the app to check out.
Pre-conditions
- Student has successfully logged in to the Mobile App. 
- The Student's account has a successfully recorded Check-in for the same day/shift.
Post-conditions
The system records the actual check-out time, total working hours, and check-out status in the database.
Main flow
1. Student accesses the Check-out function on the app. 
2. The system automatically records the actual timestamp from the server and displays it on screen. 
3. Student clicks to confirm Check-out. 
4. The system retrieves the company's official shift end time. 
5. The system compares the actual check-out time with the official time to assign the corresponding status. 
6. The system calculates the total working hours, saves it to the database, and displays "Check-out successful" along with the status.
Alternative flows
N/A
Exception flows
N/A
Business rules
- Student must have checked in first before being able to check out. If not checked in, the Check-out button will be disabled. 
- Status classification: Left early (before 17:00), On time (17:00–17:30), Overtime (from 17:31 onward).
Non-functional requirements
N/A


✅ 5.3. View attendance history
Use case ID
5.3
Use case name
View attendance history
Description
Allows Student to track their own attendance data on the Mobile App. Allows Mentor to view the detailed attendance history of the Students in the group they supervise on the Web interface.
Actors
Student (App User), Mentor (Web User)
Priority
Medium
Triggers
The user selects the "View attendance history" function in the system.
Pre-conditions
The user (Student/Mentor) has successfully logged in to the system.
Post-conditions
The attendance history data is retrieved and accurately displayed on the interface.
Main flow
BRANCH 1 – Student (Mobile App): 
1. Student accesses "Attendance history" on the app. 
2. The system identifies the account ID and retrieves the Student's entire attendance data. 
3. The system displays the history list in chronological order: Date, Check-in time, Check-out time, Status, Total working hours.
 BRANCH 2 – Mentor (Web): 
1. Mentor accesses the "Attendance Management" module on the Web interface. 2. The system identifies the Mentor and retrieves the list of Students in their group. 
3. Mentor selects the specific Student to check. 
4. The system displays the detailed attendance table for that Student.
Alternative flows
Student can use a time filter (by month or date range). The system re-queries and displays results matching the selected time period.
Exception flows
N/A
Business rules
- Data Isolation: Student can only view their own data. 
- Real-time: After a successful Check-in/Check-out, the data must be displayed immediately in the history table.
Non-functional requirements
N/A



6. LEAVE REQUEST MANAGEMENT (STUDENT)
✅ 6.1. Fill out leave request form
Use case ID
6.1
Use case name
Fill out leave request form
Description
Allows Student to create and submit a leave request (full-day or half-day) on the Mobile App. Once submitted, the request is forwarded to the responsible Mentor for approval.
Actors
Student (App User)
Priority
High
Triggers
Student has a planned commitment or unexpected matter and needs to submit a leave request.
Pre-conditions
Student has successfully logged in to the Mobile App and the account is in Active status.
Post-conditions
- The leave request is saved in the database with "Pending" status. 
- The system sends a push notification to the responsible Mentor.
Main flow
1. Student accesses the "Leave Request Management" module and selects to create a new request. 
2. The system displays a form with basic information pre-filled. 
3. Student selects the leave type: Full day or Half day. 
4. Student fills in the time information according to the selected type. 
5. Student enters the reason for the leave and clicks to confirm submission. 
6. The system saves the request with "Pending" status, displays a success message, and sends a notification to the Mentor.
Alternative flows
At any point before step 5, Student can cancel: - The system closes the form and does not save any data.
Exception flows
6.a. Invalid time data (End date < Start date, or a date in the past): The system blocks submission and displays an error message.
Business rules
N/A
Non-functional requirements
N/A


✅ 6.2. View request status
Use case ID
6.2
Use case name
View Request Status
Description
Allows Student to access the list of their personal leave requests submitted, in order to track processing progress and view the approval results from the Mentor.
Actors
Student (App User)
Priority
Medium
Triggers
Student wants to check whether their leave request has been approved by the Mentor.
Pre-conditions
Student has successfully logged in to the Mobile App and the account is in Active status.
Post-conditions
The list of leave requests along with detailed status is accurately displayed on the interface.
Main flow
1. Student accesses the Leave Request Management module on the Mobile App. 2. The system identifies the account and retrieves the Student's entire list of leave requests. 
3. The system displays the list in order from most recent: Request ID, Submission date, Leave period, Status (Pending / Approved / Rejected). 
4. Student clicks on a request to view its details. 
5. The system displays the full request content along with the Mentor's processing information (approval date, Mentor's name, rejection reason if applicable).
Alternative flows
Student can filter requests by status (Pending / Processing history). The system updates the list according to the filter condition.
Exception flows
N/A
Business rules
- Data Isolation: Student can only view requests they created themselves. - Real-time Sync: As soon as the Mentor approves/rejects (UC-4.1), the request status must update immediately. 
- The rejection reason must be displayed when the request status is "Rejected".
Non-functional requirements
The time to retrieve and display the request list must not exceed 1.5 seconds.


7. DASHBOARD MONITORING
7.1. View program overview
Use case ID
UC-7.1
Use case name
View Program Overview Dashboard
Description
Allows the BD Team to view overall statistics and visual charts for the entire internship program, including the number of students, the list of partner businesses, and the progress of training plan completion.
Actors
BD Team (Web User)
Priority
High
Triggers
BD Team accesses the Dashboard module to check, evaluate overall effectiveness, or prepare reporting figures.
Pre-conditions
BD Team has successfully logged in to the Web system and the account is in Active status.
Post-conditions
The system aggregates real-time data and displays the metrics and visual charts on the Dashboard screen.
Main flow
1. BD Team selects the "Dashboard Monitoring" function and selects the "Program Overview" tab. 
2. The system calculates and displays overview metrics (KPI Cards): Total Students currently interning, Total Mentors, Total partner businesses. 
3. The system displays visual charts on the distribution ratio of students and internship progress status. 
4. BD Team hovers over the chart to view detailed figures.
Alternative flows
N/A
Exception flows
N/A
Business rules
BD Team has the right to view the statistics of all companies and all Mentor groups, without permission restrictions.
Non-functional requirements
N/A


7.2. View attendance statistics
Use case ID
UC-7.2
Use case name
View Attendance Statistics Dashboard
Description
Allows the BD Team to monitor and analyze attendance statistics, late arrivals, early departures, and leave situations for all Students by time period, by course, or by receiving business.
Actors
BD Team (Web User)
Priority
High
Triggers
BD Team needs to assess Students' discipline, conduct a spot check, or extract data to work with schools/businesses.
Pre-conditions
BD Team has successfully logged in to the Web system and the account is in Active status.
Post-conditions
The system aggregates attendance metrics in real time and displays attendance analysis charts.
Main flow
1. BD Team selects the "Dashboard Monitoring" function and switches to the "Attendance Statistics" tab.
2. The system calculates based on all Check-in/Check-out data and leave requests. 
3. The system displays KPI Cards: On-time rate, Number of late arrivals/early departures, Number of absent Students. 
4. The system displays trend charts (Line Chart, Stacked Bar Chart).
5. BD Team can hover over the chart to view details, or click to view the list of Students in violation.
Alternative flows
BD Team can customize advanced filters (date range, business, Mentor, status). The system refreshes the data according to the conditions.
Exception flows
N/A
Business rules
- Real-time Sync: When a Student checks in late, the figures on the Dashboard must update immediately. - Classification logic: No Check-in + approved request = Approved leave; No Check-in + no request = Unapproved absence.
Non-functional requirements
N/A


8. Q&A MANAGEMENT
Use case ID
UC-8
Use case name
✅ Q&A Management
Description
Provides an interactive channel for sending questions and receiving online responses between Student (App), Mentor (Web), and BD Team (Web), to resolve inquiries during the internship.
Actors
Student (App User), Mentor (Web User), BD Team (Web User)
Priority
Medium
Triggers
- Student or Mentor has a question to submit to the system. 
- The recipient (Mentor or BD Team) receives the notification and accesses it to respond.
Pre-conditions
The user has successfully logged in to the system.
Post-conditions
The question/answer is recorded in the database. The system sends real-time notifications to relevant parties.
Main flow
FLOW 1 – Submit a question: 
1. The user accesses the "Q&A" module. 
2. The user selects "Create new question". 
3. The system displays a form: Title, Content, Recipient (Mentor or BD Team). 
4. The user completes the content and clicks "Send". 
5. The system saves the data with "Unanswered" status and sends a notification to the recipient. 
FLOW 2 – Respond/Answer: 
1. The recipient (Mentor or BD Team) clicks the notification or accesses the Q&A list. 
2. The recipient enters the answer content in the "Response" field. 
3. The recipient clicks "Send answer". 
4. The system updates the status to "Answered" and sends a notification back to the person who asked the question.
Alternative flows
N/A
Exception flows
N/A
Business rules
- Routing Rule: If a Student sends a question to a Mentor, the system only sends it to the Mentor directly supervising that Student. If sent to BD Team, all BD Team members can see it. 
- Mentor can send questions to BD Team regarding matters beyond their authority.
Non-functional requirements
N/A


9. EVENT MANAGEMENT
Overview UC-9: BD Team and Mentor have the right to Create Events and View Events on the Web interface. Student only has the right to View Events on the Mobile App.
Use case ID
UC-9
Use case name
Event Management
Description
Allows BD Team and Mentor to create and manage events in the internship program on the Web interface. Student can view the list and details of related events on the Mobile App.
Actors
BD Team (Web User), Mentor (Web User), Student (App User)
Priority
Medium
Triggers
- BD Team or Mentor needs to organize a new event in the internship program. - Student wants to view the program's event calendar.
Pre-conditions
The user has successfully logged in to the system. - BD Team and Mentor access via the Web interface.
- Student accesses via the Mobile App.
Post-conditions
- The new event is created successfully and displayed to relevant parties. 
- Student can view detailed information for events they participate in.
Main flow
BRANCH 1 – Create Event (BD Team / Mentor on Web): 
1. BD Team or Mentor accesses the "Event Management" module on the Web interface. 
2. The system displays the list of existing events. 
3. The user clicks "Create new Event". 
4. The system displays a form with the following required fields: - Event name - Date and time - Location - Description - Target audience (All / Specific group). 
5. The user fills in all information and clicks "Save". 
6. The system checks the validity of the input data. 
7. The system saves the event information in the database, sends a notification to the Students in the target audience, and displays a success message. 
BRANCH 2 – View Event (BD Team / Mentor on Web): 
1. BD Team or Mentor accesses the "Event Management" module on the Web. 
2. The system displays the list of all events along with information: Name, Date, Location, Status. 
3. The user clicks on a specific event. 
4. The system displays the event details and the list of participating Students. BRANCH 3 – View Event (Student on Mobile App): 
1. Student opens the app and accesses the "Events" section. 
2. The system displays the list of events for this Student. 
3. Student clicks on an event to view details: Name, Date/Time, Location, Description.
Alternative flows
At step 5 (Branch 1), the user can cancel creating the event: 
- The system closes the form and does not save any data.
Exception flows
6.a. Invalid data (missing required field or event date in the past): 
- The system displays an error message at the corresponding field and requires the user to correct it before saving.
Business rules
- Event creation permission: Only BD Team and Mentor have the right to create events on the Web interface. Student does not have permission to create events. - Event viewing permission: Student can only view events they are part of the target audience for, and cannot view events for other groups. 
- BD Team and Mentor can view all events within the scope of the program.
Non-functional requirements
The event list loading and display time must not exceed 1 second.


✅ 9.1. View Event
Use case ID
UC-9.1
Use case name
View Event
Description
Allows BD Team and Mentor to view the list and details of all events on the Web interface. Allows Student to view the events they are assigned to participate in on the Mobile App.
Actors
BD Team (Web User), Mentor (Web User), Student (App User)
Priority
Medium
Triggers
The user wants to view event information in the internship program.
Pre-conditions
The user has successfully logged in to the system.
Post-conditions
The list and details of events are accurately displayed according to each role's permissions.
Main flow
BRANCH 1 – BD Team / Mentor (Web): 
1. The user accesses the "Event Management" module on the Web. 
2. The system displays the entire list of events with summary information. 
3. The user clicks on an event to view full details. 
BRANCH 2 – Student (Mobile App): 1. Student accesses the "Events" section on the app. 
2. The system filters and displays only the events the Student is part of the target audience for. 
3. Student clicks on an event to view details.
Alternative flows
N/A
Exception flows
N/A
Business rules
Student can only view events within their own scope. BD Team and Mentor can view all events.
Non-functional requirements
N/A


9.2. Create Event
Use case ID
UC-9.2
Use case name
Create Event
Description
Allows BD Team and Mentor to create a new event in the internship program on the Web interface. Student does not have permission to create events.
Actors
BD Team (Web User), Mentor (Web User)
Priority
Medium
Triggers
BD Team or Mentor needs to organize a new event in the program.
Pre-conditions
BD Team or Mentor has successfully logged in to the Web interface.
Post-conditions
- The event is saved successfully in the database. 
- The system sends a notification to the Students in the target audience.
Main flow
1. BD Team or Mentor clicks "Create new Event" in the Event Management module. 
2. The system displays the event creation form. 
3. The user fills in all information: Event name, Date/time, Location, Description, Target audience. 
4. The user clicks "Save". 
5. The system checks the validity of the data. 
6. The system saves the event to the database, sends a notification to the relevant Students, and displays a success message.
Alternative flows
The user can cancel creating the event at any time before step 4. The system does not save the data.
Exception flows
5.a. Invalid data: The system displays an error at the corresponding field and requests correction.
Business rules
Only BD Team and Mentor have the right to create events. Student does not have creation permission.
Non-functional requirements
N/A


