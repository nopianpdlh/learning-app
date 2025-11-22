# User Flow Diagrams

# Platform E-Learning Tutor Nomor Satu

**Version:** 1.0  
**Last Updated:** November 15, 2025

---

## 1. Student User Flows

### 1.1 Student Registration & First Enrollment

```mermaid
flowchart TD
    Start([Student visits platform]) --> Landing[View landing page]
    Landing --> ClickRegister[Click 'Register']
    ClickRegister --> FillForm[Fill registration form<br/>Email, Password, Name]
    FillForm --> SubmitForm[Submit form]
    SubmitForm --> ValidateForm{Form valid?}
    ValidateForm -->|No| ShowErrors[Show validation errors]
    ShowErrors --> FillForm
    ValidateForm -->|Yes| CreateAccount[Create account]
    CreateAccount --> SendVerification[Send verification email]
    SendVerification --> ShowMessage[Show 'Check your email' message]
    ShowMessage --> CheckEmail[Student opens email]
    CheckEmail --> ClickVerify[Click verification link]
    ClickVerify --> VerifyEmail[Verify email]
    VerifyEmail --> RedirectLogin[Redirect to login]
    RedirectLogin --> EnterCredentials[Enter email & password]
    EnterCredentials --> Login[Login]
    Login --> Dashboard[Redirect to Student Dashboard]
    Dashboard --> ViewCatalog[Click 'Browse Classes']
    ViewCatalog --> ClassList[View class catalog]
    ClassList --> FilterSearch[Search/filter classes]
    FilterSearch --> SelectClass[Click on class]
    SelectClass --> ClassDetail[View class detail page]
    ClassDetail --> ClickEnroll[Click 'Enroll Now']
    ClickEnroll --> CreateEnrollment[System creates enrollment]
    CreateEnrollment --> RedirectPayment[Redirect to payment page]
    RedirectPayment --> SelectMethod[Select payment method<br/>QRIS/VA/E-Wallet]
    SelectMethod --> CompletePayment[Complete payment]
    CompletePayment --> PaymentSuccess{Payment success?}
    PaymentSuccess -->|No| PaymentFailed[Show error message]
    PaymentFailed --> End1([End - can retry])
    PaymentSuccess -->|Yes| WebhookProcessed[System processes webhook]
    WebhookProcessed --> GrantAccess[Access granted to class]
    GrantAccess --> SendConfirmation[Send confirmation email]
    SendConfirmation --> RedirectDashboard[Redirect to dashboard]
    RedirectDashboard --> ShowEnrolled[Show enrolled class in 'My Classes']
    ShowEnrolled --> End2([End - Student ready to learn])
```

### 1.2 Student Accessing Materials

```mermaid
flowchart TD
    Start([Student logs in]) --> Dashboard[View dashboard]
    Dashboard --> MyClasses[View 'My Classes' section]
    MyClasses --> SelectClass[Click on enrolled class]
    SelectClass --> ClassHome[View class home page]
    ClassHome --> ClickMaterials[Click 'Materials' tab]
    ClickMaterials --> ViewMaterials[View materials organized by session]
    ViewMaterials --> SelectSession[Select session<br/>e.g., 'Pertemuan 1']
    SelectSession --> ViewContent[View material content]
    ViewContent --> CheckType{Material type?}
    CheckType -->|PDF| PreviewPDF[Preview PDF in browser]
    CheckType -->|Video| PlayVideo[Play embedded video]
    CheckType -->|Document| PreviewDoc[Preview document]
    PreviewPDF --> DownloadOption[Option to download]
    PlayVideo --> NextMaterial{More materials?}
    PreviewDoc --> DownloadOption
    DownloadOption --> ClickDownload[Click download button]
    ClickDownload --> SaveFile[Save file to device]
    SaveFile --> NextMaterial
    NextMaterial -->|Yes| SelectSession
    NextMaterial -->|No| BackToClass[Back to class home]
    BackToClass --> End([End])
```

### 1.3 Student Submitting Assignment

```mermaid
flowchart TD
    Start([Student receives notification]) --> Dashboard[View dashboard]
    Dashboard --> PendingAssignments[See 'Pending Assignments' widget]
    PendingAssignments --> ClickAssignment[Click on assignment]
    ClickAssignment --> ViewInstructions[View assignment details<br/>Instructions, Due date, Max points]
    ViewInstructions --> DownloadRef{Reference file?}
    DownloadRef -->|Yes| DownloadFile[Download reference file]
    DownloadRef -->|No| StartWork[Start working on assignment]
    DownloadFile --> StartWork
    StartWork --> CompleteWork[Complete assignment offline]
    CompleteWork --> ReturnToPlatform[Return to platform]
    ReturnToPlatform --> ClickUpload[Click 'Upload Submission']
    ClickUpload --> SelectFile[Select file from device<br/>PDF, DOCX, JPG]
    SelectFile --> ValidateFile{File valid?}
    ValidateFile -->|No| ShowError[Show error<br/>Invalid type or too large]
    ShowError --> SelectFile
    ValidateFile -->|Yes| UploadFile[Upload file<br/>Show progress bar]
    UploadFile --> CheckDeadline{Before deadline?}
    CheckDeadline -->|No| LateWarning[Show late submission warning]
    LateWarning --> AllowLate{Late submission allowed?}
    AllowLate -->|No| BlockSubmit[Cannot submit]
    BlockSubmit --> End1([End])
    AllowLate -->|Yes| CreateSubmission
    CheckDeadline -->|Yes| CreateSubmission[Create submission record]
    CreateSubmission --> ShowConfirmation[Show 'Submitted successfully' message]
    ShowConfirmation --> SendNotification[System notifies tutor]
    SendNotification --> UpdateStatus[Update assignment status to 'Submitted']
    UpdateStatus --> WaitGrade[Wait for grading]
    WaitGrade --> End2([End - will receive notification when graded])
```

### 1.4 Student Taking Quiz

```mermaid
flowchart TD
    Start([Student sees quiz notification]) --> Dashboard[View dashboard]
    Dashboard --> QuizList[View available quizzes]
    QuizList --> SelectQuiz[Click on quiz]
    SelectQuiz --> QuizDetails[View quiz details<br/>Title, Time limit, Max attempts]
    QuizDetails --> CheckAttempts{Attempts remaining?}
    CheckAttempts -->|No| ShowMessage[Show 'No attempts remaining']
    ShowMessage --> End1([End])
    CheckAttempts -->|Yes| CheckTime{Within availability?}
    CheckTime -->|No| ShowUnavailable[Show 'Quiz not available yet/anymore']
    ShowUnavailable --> End1
    CheckTime -->|Yes| ClickStart[Click 'Start Quiz']
    ClickStart --> CreateAttempt[System creates quiz attempt]
    CreateAttempt --> ShowQuestions[Display questions]
    ShowQuestions --> StartTimer[Start countdown timer]
    StartTimer --> AnswerQuestions[Student answers questions]
    AnswerQuestions --> AutoSave[System auto-saves every 5s]
    AutoSave --> CheckSubmit{Student clicks submit?}
    CheckSubmit -->|Yes| ConfirmSubmit[Show confirmation dialog]
    CheckSubmit -->|No| CheckTimer{Time expired?}
    CheckTimer -->|No| AnswerQuestions
    CheckTimer -->|Yes| AutoSubmit[System auto-submits]
    ConfirmSubmit --> Submit
    AutoSubmit --> Submit[Submit quiz]
    Submit --> AutoGrade[System auto-grades MCQ & T/F]
    AutoGrade --> CalculateScore[Calculate total score & percentage]
    CalculateScore --> UpdateGradebook[Update gradebook]
    UpdateGradebook --> ShowResults[Display quiz results<br/>Score, Correct/Incorrect answers]
    ShowResults --> ViewExplanations{Explanations available?}
    ViewExplanations -->|Yes| ShowExplanations[Show explanations for each question]
    ViewExplanations -->|No| End2([End])
    ShowExplanations --> End2
```

### 1.5 Student Joining Live Class

```mermaid
flowchart TD
    Start([24 hours before class]) --> Notification1[Receive H-1 notification]
    Notification1 --> Dashboard[View dashboard]
    Dashboard --> UpcomingWidget[See 'Upcoming Live Classes' widget]
    UpcomingWidget --> Wait[Wait for class time]
    Wait --> Notification2[Receive 1-hour before notification]
    Notification2 --> ReturnDashboard[Return to dashboard]
    ReturnDashboard --> TodayHighlight[See 'Class Today' highlighted card]
    TodayHighlight --> CheckTime{Class starting soon?}
    CheckTime -->|No| Wait
    CheckTime -->|Yes| ClickJoin[Click 'Join Class' button]
    ClickJoin --> OpenMeeting[System opens meeting URL in new tab]
    OpenMeeting --> ZoomMeet[Zoom/Google Meet interface]
    ZoomMeet --> AttendClass[Attend live class]
    AttendClass --> ClassEnds[Class ends]
    ClassEnds --> ReturnPlatform[Return to platform]
    ReturnPlatform --> ViewRecording{Recording available?}
    ViewRecording -->|Yes| WatchRecording[Option to watch recording]
    ViewRecording -->|No| End([End])
    WatchRecording --> End
```

### 1.6 Student Viewing Grades

```mermaid
flowchart TD
    Start([Student receives 'Graded' notification]) --> Dashboard[View dashboard]
    Dashboard --> ClickNotification[Click notification]
    ClickNotification --> ViewSubmission[View graded submission<br/>Score, Feedback]
    ViewSubmission --> ViewGradebook[Click 'View All Grades']
    ViewGradebook --> GradebookPage[View gradebook page]
    GradebookPage --> SelectClass[Select class filter]
    SelectClass --> ViewBreakdown[View grade breakdown<br/>Assignments, Quizzes]
    ViewBreakdown --> SeeTotal[See total score & percentage]
    SeeTotal --> ViewChart[View progress chart<br/>Line graph over time]
    ViewChart --> AnalyzePerformance[Analyze performance]
    AnalyzePerformance --> IdentifyWeak{Weak areas?}
    IdentifyWeak -->|Yes| ReviewMaterials[Go back to materials to review]
    IdentifyWeak -->|No| Satisfied[Satisfied with progress]
    ReviewMaterials --> End([End])
    Satisfied --> End
```

---

## 2. Tutor User Flows

### 2.1 Tutor Uploading Materials

```mermaid
flowchart TD
    Start([Tutor logs in]) --> Dashboard[View tutor dashboard]
    Dashboard --> MyClasses[View 'My Classes']
    MyClasses --> SelectClass[Click on class]
    SelectClass --> ClassManagement[View class management page]
    ClassManagement --> ClickMaterials[Click 'Materials' tab]
    ClickMaterials --> MaterialsList[View existing materials]
    MaterialsList --> ClickAdd[Click 'Add Material']
    ClickAdd --> FillForm[Fill material form<br/>Title, Description, Session]
    FillForm --> SelectType{Material type?}
    SelectType -->|File| UploadFile[Click 'Upload File']
    SelectType -->|Video| InputURL[Input YouTube/Vimeo URL]
    UploadFile --> SelectFileDevice[Select file from device]
    SelectFileDevice --> ValidateFile{File valid?}
    ValidateFile -->|No| ShowError[Show error<br/>Type or size invalid]
    ShowError --> SelectFileDevice
    ValidateFile -->|Yes| UploadProgress[Show upload progress]
    InputURL --> ValidateURL{URL valid?}
    ValidateURL -->|No| ShowURLError[Show 'Invalid URL' error]
    ShowURLError --> InputURL
    ValidateURL -->|Yes| PreviewEmbed[Preview video embed]
    UploadProgress --> SetPublish
    PreviewEmbed --> SetPublish[Set publish status<br/>Draft or Published]
    SetPublish --> ClickSave[Click 'Save']
    ClickSave --> CreateMaterial[Create material record]
    CreateMaterial --> NotifyStudents{Published?}
    NotifyStudents -->|Yes| SendNotifications[Send notifications to students]
    NotifyStudents -->|No| SaveDraft[Save as draft]
    SendNotifications --> ShowSuccess[Show 'Material uploaded' message]
    SaveDraft --> ShowSuccess
    ShowSuccess --> MoreMaterials{Upload more?}
    MoreMaterials -->|Yes| ClickAdd
    MoreMaterials -->|No| End([End])
```

### 2.2 Tutor Creating Assignment

```mermaid
flowchart TD
    Start([Tutor plans assignment]) --> Dashboard[View tutor dashboard]
    Dashboard --> SelectClass[Select class]
    SelectClass --> ClickAssignments[Click 'Assignments' tab]
    ClickAssignments --> AssignmentsList[View assignments list]
    AssignmentsList --> ClickCreate[Click 'Create Assignment']
    ClickCreate --> FillForm[Fill assignment form]
    FillForm --> InputTitle[Input title]
    InputTitle --> InputDescription[Input instructions<br/>Rich text editor]
    InputDescription --> SetDueDate[Set due date & time]
    SetDueDate --> SetMaxPoints[Set max points]
    SetMaxPoints --> AttachRef{Attach reference file?}
    AttachRef -->|Yes| UploadRef[Upload reference file]
    AttachRef -->|No| SetStatus
    UploadRef --> SetStatus[Set status: Draft or Published]
    SetStatus --> ClickSave[Click 'Save']
    ClickSave --> ValidateForm{Form valid?}
    ValidateForm -->|No| ShowErrors[Show validation errors]
    ShowErrors --> FillForm
    ValidateForm -->|Yes| CreateAssignment[Create assignment record]
    CreateAssignment --> CheckPublished{Published?}
    CheckPublished -->|Yes| NotifyStudents[Send notifications to enrolled students]
    CheckPublished -->|No| SaveDraft[Save as draft]
    NotifyStudents --> ShowSuccess[Show 'Assignment created' message]
    SaveDraft --> ShowSuccess
    ShowSuccess --> End([End - wait for submissions])
```

### 2.3 Tutor Grading Assignments

```mermaid
flowchart TD
    Start([Tutor receives notification<br/>'New submission']) --> Dashboard[View tutor dashboard]
    Dashboard --> PendingWidget[See 'Assignments to Grade' count]
    PendingWidget --> ClickView[Click 'View Pending']
    ClickView --> SubmissionsList[View submissions list]
    SubmissionsList --> FilterBy{Filter by assignment?}
    FilterBy -->|Yes| SelectAssignment[Select specific assignment]
    FilterBy -->|No| ViewAll
    SelectAssignment --> ViewAll[View all submissions]
    ViewAll --> SelectSubmission[Click on submission]
    SelectSubmission --> ViewDetails[View student info & submission date]
    ViewDetails --> ClickFile[Click to view submitted file]
    ClickFile --> OpenFile{File type?}
    OpenFile -->|PDF| PreviewPDF[Preview PDF in browser]
    OpenFile -->|Image| ShowImage[Show image]
    OpenFile -->|Document| PreviewDoc[Preview document]
    PreviewPDF --> EvaluateWork
    ShowImage --> EvaluateWork
    PreviewDoc --> EvaluateWork[Evaluate student work]
    EvaluateWork --> InputScore[Input score<br/>0 to max points]
    InputScore --> InputFeedback[Input feedback<br/>Textarea]
    InputFeedback --> ClickSaveGrade[Click 'Save Grade']
    ClickSaveGrade --> ValidateScore{Score valid?}
    ValidateScore -->|No| ShowError[Show 'Invalid score' error]
    ShowError --> InputScore
    ValidateScore -->|Yes| UpdateSubmission[Update submission record]
    UpdateSubmission --> UpdateGradebook[Update gradebook]
    UpdateGradebook --> NotifyStudent[Send notification to student]
    NotifyStudent --> ShowConfirmation[Show 'Grade saved' message]
    ShowConfirmation --> MoreSubmissions{More to grade?}
    MoreSubmissions -->|Yes| SubmissionsList
    MoreSubmissions -->|No| End([End])
```

### 2.4 Tutor Creating Quiz

```mermaid
flowchart TD
    Start([Tutor plans quiz]) --> Dashboard[View tutor dashboard]
    Dashboard --> SelectClass[Select class]
    SelectClass --> ClickQuizzes[Click 'Quizzes' tab]
    ClickQuizzes --> QuizzesList[View quizzes list]
    QuizzesList --> ClickCreate[Click 'Create Quiz']
    ClickCreate --> FillBasicInfo[Fill quiz info<br/>Title, Description]
    FillBasicInfo --> SetTimeLimit[Set time limit minutes]
    SetTimeLimit --> SetMaxAttempts[Set max attempts]
    SetMaxAttempts --> SetAvailability[Set start/end time]
    SetAvailability --> SetPassingScore[Set passing score optional]
    SetPassingScore --> AddQuestions[Click 'Add Question']
    AddQuestions --> SelectQuestionType{Question type?}
    SelectQuestionType -->|MCQ| CreateMCQ[Create Multiple Choice]
    SelectQuestionType -->|T/F| CreateTF[Create True/False]
    SelectQuestionType -->|Short| CreateShort[Create Short Answer]
    CreateMCQ --> InputQuestion1[Input question text]
    InputQuestion1 --> InputOptions[Input 4 options A, B, C, D]
    InputOptions --> SelectCorrect[Select correct answer]
    SelectCorrect --> SetPoints1
    CreateTF --> InputQuestion2[Input question text]
    InputQuestion2 --> SelectTF[Select TRUE or FALSE]
    SelectTF --> SetPoints2
    CreateShort --> InputQuestion3[Input question text]
    InputQuestion3 --> InputExpected[Input expected answer]
    InputExpected --> SetPoints3
    SetPoints1[Set points] --> AddExplanation1{Add explanation?}
    SetPoints2[Set points] --> AddExplanation2{Add explanation?}
    SetPoints3[Set points] --> AddExplanation3{Add explanation?}
    AddExplanation1 -->|Yes| InputExplanation1[Input explanation]
    AddExplanation1 -->|No| SaveQuestion1
    AddExplanation2 -->|Yes| InputExplanation2[Input explanation]
    AddExplanation2 -->|No| SaveQuestion2
    AddExplanation3 -->|Yes| InputExplanation3[Input explanation]
    AddExplanation3 -->|No| SaveQuestion3
    InputExplanation1 --> SaveQuestion1[Save question]
    InputExplanation2 --> SaveQuestion2[Save question]
    InputExplanation3 --> SaveQuestion3[Save question]
    SaveQuestion1 --> MoreQuestions
    SaveQuestion2 --> MoreQuestions
    SaveQuestion3 --> MoreQuestions{Add more questions?}
    MoreQuestions -->|Yes| AddQuestions
    MoreQuestions -->|No| ReorderQuestions[Reorder questions<br/>Drag & drop]
    ReorderQuestions --> SetStatus[Set status: Draft or Published]
    SetStatus --> ClickSaveQuiz[Click 'Save Quiz']
    ClickSaveQuiz --> CreateQuiz[Create quiz record]
    CreateQuiz --> CheckPublished{Published?}
    CheckPublished -->|Yes| NotifyStudents[Notify students]
    CheckPublished -->|No| SaveDraft[Save as draft]
    NotifyStudents --> ShowSuccess[Show 'Quiz created' message]
    SaveDraft --> ShowSuccess
    ShowSuccess --> End([End - students can now take quiz])
```

### 2.5 Tutor Scheduling Live Class

```mermaid
flowchart TD
    Start([Tutor plans live session]) --> Dashboard[View tutor dashboard]
    Dashboard --> SelectClass[Select class]
    SelectClass --> ClickLiveClasses[Click 'Live Classes' tab]
    ClickLiveClasses --> LiveClassList[View scheduled live classes]
    LiveClassList --> ClickSchedule[Click 'Schedule Live Class']
    ClickSchedule --> FillForm[Fill form]
    FillForm --> InputTitle[Input class title<br/>e.g., 'Pertemuan 3: Integral']
    InputTitle --> SelectMode{Mode?}
    SelectMode -->|Manual| InputURL[Input Zoom/Meet URL]
    SelectMode -->|Auto| GenerateLink[Click 'Generate Zoom Link'<br/>Future feature]
    InputURL --> ValidateURL{URL valid?}
    ValidateURL -->|No| ShowError[Show 'Invalid URL' error]
    ShowError --> InputURL
    ValidateURL -->|Yes| SetDateTime
    GenerateLink --> ZoomOAuth[Authenticate with Zoom]
    ZoomOAuth --> CreateMeeting[Create Zoom meeting via API]
    CreateMeeting --> SetDateTime[Set date & time]
    SetDateTime --> SetDuration[Set duration minutes]
    SetDuration --> ClickSave[Click 'Save']
    ClickSave --> CreateLiveClass[Create live class record]
    CreateLiveClass --> ScheduleReminders[System schedules H-1 & 1-hour reminders]
    ScheduleReminders --> ShowSuccess[Show 'Live class scheduled' message]
    ShowSuccess --> CalendarSync{Sync to calendar?}
    CalendarSync -->|Yes| AddToCalendar[Add to Google Calendar]
    CalendarSync -->|No| End([End])
    AddToCalendar --> End
```

### 2.6 Tutor Viewing Class Gradebook

```mermaid
flowchart TD
    Start([Tutor wants to see class performance]) --> Dashboard[View tutor dashboard]
    Dashboard --> SelectClass[Select class]
    SelectClass --> ClickGradebook[Click 'Gradebook' tab]
    ClickGradebook --> ViewTable[View gradebook table<br/>Rows: Students<br/>Columns: Assignments/Quizzes]
    ViewTable --> SeeScores[See all scores]
    SeeScores --> SortBy{Sort by?}
    SortBy -->|Name| SortName[Sort alphabetically]
    SortBy -->|Score| SortScore[Sort by total score]
    SortName --> ViewStats
    SortScore --> ViewStats[View statistics<br/>Class average, Highest, Lowest]
    ViewStats --> FilterBy{Filter by assignment?}
    FilterBy -->|Yes| SelectAssignment[Select specific assignment]
    FilterBy -->|No| ViewAll
    SelectAssignment --> ViewAll[View filtered results]
    ViewAll --> IdentifyStruggling[Identify struggling students]
    IdentifyStruggling --> ClickExport[Click 'Export to Excel']
    ClickExport --> DownloadFile[Download CSV/Excel file]
    DownloadFile --> AnalyzeOffline[Analyze offline or share with admin]
    AnalyzeOffline --> End([End])
```

---

## 3. Admin User Flows

### 3.1 Admin Creating Class

```mermaid
flowchart TD
    Start([Admin logs in]) --> Dashboard[View admin dashboard]
    Dashboard --> ClickClasses[Click 'Manage Classes']
    ClickClasses --> ClassesList[View all classes]
    ClassesList --> ClickCreate[Click 'Create Class']
    ClickCreate --> FillForm[Fill class form]
    FillForm --> InputTitle[Input title]
    InputTitle --> InputDescription[Input description]
    InputDescription --> SelectSubject[Select subject]
    SelectSubject --> SelectGrade[Select grade level]
    SelectGrade --> InputPrice[Input price]
    InputPrice --> SetCapacity[Set capacity max students]
    SetCapacity --> InputSchedule[Input schedule<br/>e.g., 'Mon & Wed 19:00-21:00']
    InputSchedule --> SetDates[Set start/end dates]
    SetDates --> AssignTutor[Select tutor from dropdown]
    AssignTutor --> ValidateTutor{Tutor exists?}
    ValidateTutor -->|No| ShowError[Show 'Invalid tutor' error]
    ShowError --> AssignTutor
    ValidateTutor -->|Yes| SetPublished[Set published true/false]
    SetPublished --> ClickSave[Click 'Save']
    ClickSave --> ValidateForm{Form valid?}
    ValidateForm -->|No| ShowErrors[Show validation errors]
    ShowErrors --> FillForm
    ValidateForm -->|Yes| CreateClass[Create class record]
    CreateClass --> CheckPublished{Published?}
    CheckPublished -->|Yes| ShowInCatalog[Class appears in catalog]
    CheckPublished -->|No| SaveDraft[Class saved as draft]
    ShowInCatalog --> NotifyTutor[Send notification to assigned tutor]
    SaveDraft --> ShowSuccess
    NotifyTutor --> ShowSuccess[Show 'Class created' message]
    ShowSuccess --> End([End])
```

### 3.2 Admin Managing Users

```mermaid
flowchart TD
    Start([Admin needs to add tutor]) --> Dashboard[View admin dashboard]
    Dashboard --> ClickUsers[Click 'Manage Users']
    ClickUsers --> UsersList[View users list]
    UsersList --> FilterRole{Filter by role?}
    FilterRole -->|Yes| SelectFilter[Select ADMIN/TUTOR/STUDENT]
    FilterRole -->|No| ViewAll
    SelectFilter --> ViewAll[View filtered users]
    ViewAll --> ActionType{Action?}
    ActionType -->|Create| ClickCreate[Click 'Create User']
    ActionType -->|Edit| SelectUser1[Select user from list]
    ActionType -->|Delete| SelectUser2[Select user from list]
    ActionType -->|Bulk Import| ClickImport[Click 'Bulk Import']

    ClickCreate --> FillForm[Fill user form<br/>Email, Name, Role, Phone]
    FillForm --> SetTempPassword[Set temporary password]
    SetTempPassword --> ClickSave1[Click 'Save']
    ClickSave1 --> CreateUser[Create user account]
    CreateUser --> SendWelcome[Send welcome email with credentials]
    SendWelcome --> ShowSuccess1[Show 'User created' message]
    ShowSuccess1 --> End1([End])

    SelectUser1 --> EditForm[Edit user form]
    EditForm --> UpdateFields[Update name/email/role/status]
    UpdateFields --> ClickSave2[Click 'Save']
    ClickSave2 --> UpdateUser[Update user record]
    UpdateUser --> LogAudit1[Log action in audit_log]
    LogAudit1 --> ShowSuccess2[Show 'User updated' message]
    ShowSuccess2 --> End2([End])

    SelectUser2 --> CheckEnrollments{Has active enrollments?}
    CheckEnrollments -->|Yes| ShowWarning[Show 'Cannot delete' warning]
    ShowWarning --> End3([End])
    CheckEnrollments -->|No| ConfirmDelete[Show confirmation dialog]
    ConfirmDelete --> UserConfirms{Admin confirms?}
    UserConfirms -->|No| End3
    UserConfirms -->|Yes| SoftDelete[Soft delete user archive]
    SoftDelete --> LogAudit2[Log action in audit_log]
    LogAudit2 --> ShowSuccess3[Show 'User deleted' message]
    ShowSuccess3 --> End3

    ClickImport --> UploadCSV[Upload CSV file]
    UploadCSV --> ValidateCSV{CSV valid?}
    ValidateCSV -->|No| ShowCSVErrors[Show validation errors]
    ShowCSVErrors --> UploadCSV
    ValidateCSV -->|Yes| PreviewImport[Preview import summary]
    PreviewImport --> ClickConfirm[Click 'Confirm Import']
    ClickConfirm --> BulkCreate[Create users in batch]
    BulkCreate --> SendEmails[Send welcome emails]
    SendEmails --> ShowSummary[Show import summary<br/>Success: X, Errors: Y]
    ShowSummary --> End4([End])
```

### 3.3 Admin Monitoring Payments

```mermaid
flowchart TD
    Start([Admin checks daily revenue]) --> Dashboard[View admin dashboard]
    Dashboard --> ViewMetrics[See metrics<br/>Total revenue, Pending payments]
    ViewMetrics --> ClickPayments[Click 'Manage Payments']
    ClickPayments --> PaymentsList[View payments list]
    PaymentsList --> FilterBy{Filter by?}
    FilterBy -->|Status| FilterStatus[Select PENDING/PAID/FAILED]
    FilterBy -->|Date| FilterDate[Select date range]
    FilterBy -->|Student| FilterStudent[Search by student name]
    FilterStatus --> ViewFiltered
    FilterDate --> ViewFiltered
    FilterStudent --> ViewFiltered[View filtered results]
    ViewFiltered --> CheckPending{Pending payments?}
    CheckPending -->|Yes| SelectPending[Select pending payment]
    CheckPending -->|No| ExportReport
    SelectPending --> ViewDetails[View payment details<br/>Student, Class, Amount, Date]
    ViewDetails --> CheckManual{Manual verification needed?}
    CheckManual -->|Yes| VerifyBank[Check bank statement]
    CheckManual -->|No| WaitWebhook[Wait for webhook]
    VerifyBank --> Confirmed{Payment confirmed?}
    Confirmed -->|Yes| ManualApprove[Manually update status to PAID]
    Confirmed -->|No| ContactStudent[Contact student]
    ManualApprove --> GrantAccess[Grant class access]
    GrantAccess --> SendReceipt[Send payment receipt]
    SendReceipt --> LogAction[Log in audit_log]
    LogAction --> PaymentsList
    ContactStudent --> End1([End])
    WaitWebhook --> End1
    ExportReport[Click 'Export Report']
    ExportReport --> SelectPeriod[Select period<br/>This week, This month, Custom]
    SelectPeriod --> GenerateReport[Generate revenue report]
    GenerateReport --> DownloadExcel[Download Excel file]
    DownloadExcel --> Review[Review offline]
    Review --> End2([End])
```

### 3.4 Admin Viewing Analytics Dashboard

```mermaid
flowchart TD
    Start([Admin wants to see platform performance]) --> Login[Login to admin panel]
    Login --> Dashboard[View admin dashboard]
    Dashboard --> ViewKPIs[View key metrics]
    ViewKPIs --> SeeUsers[Total Users<br/>Students: X, Tutors: Y]
    SeeUsers --> SeeRevenue[Revenue<br/>This Month: Rp X<br/>All Time: Rp Y]
    SeeRevenue --> SeePending[Pending Payments: X]
    SeePending --> SeeClasses[Active Classes: X]
    SeeClasses --> SeeEnrollments[Recent Enrollments<br/>Table with latest 10]
    SeeEnrollments --> ClickGraph[Click 'View Detailed Analytics']
    ClickGraph --> AnalyticsPage[View analytics page]
    AnalyticsPage --> ViewCharts[View charts]
    ViewCharts --> RevenueChart[Revenue trend<br/>Line chart monthly]
    RevenueChart --> UserGrowth[User growth<br/>Bar chart weekly/monthly]
    UserGrowth --> ClassPopularity[Class popularity<br/>Pie chart by subject]
    ClassPopularity --> SubmissionRate[Assignment submission rate<br/>Percentage by class]
    SubmissionRate --> IdentifyIssues{Issues found?}
    IdentifyIssues -->|Yes| TakeAction[Plan intervention<br/>Contact tutor, Adjust class]
    IdentifyIssues -->|No| Satisfied[Platform performing well]
    TakeAction --> End([End])
    Satisfied --> End
```

---

## 4. Common User Flows (All Roles)

### 4.1 Login Flow

```mermaid
flowchart TD
    Start([User visits platform]) --> Landing[View landing page]
    Landing --> ClickLogin[Click 'Login']
    ClickLogin --> LoginPage[View login page]
    LoginPage --> EnterCredentials[Enter email & password]
    EnterCredentials --> ClickSubmit[Click 'Login']
    ClickSubmit --> ValidateInput{Credentials valid?}
    ValidateInput -->|No| CheckAttempts{Failed attempts < 5?}
    CheckAttempts -->|Yes| ShowError[Show 'Invalid credentials' error]
    ShowError --> EnterCredentials
    CheckAttempts -->|No| LockAccount[Lock account for 15 minutes]
    LockAccount --> ShowLocked[Show 'Account locked' message]
    ShowLocked --> End1([End - retry after 15 min])
    ValidateInput -->|Yes| Authenticate[Authenticate via Supabase]
    Authenticate --> IssueToken[Issue JWT token]
    IssueToken --> CheckRole{User role?}
    CheckRole -->|ADMIN| RedirectAdmin[Redirect to /admin]
    CheckRole -->|TUTOR| RedirectTutor[Redirect to /tutor]
    CheckRole -->|STUDENT| RedirectStudent[Redirect to /student]
    RedirectAdmin --> AdminDashboard[Admin Dashboard]
    RedirectTutor --> TutorDashboard[Tutor Dashboard]
    RedirectStudent --> StudentDashboard[Student Dashboard]
    AdminDashboard --> End2([End - User logged in])
    TutorDashboard --> End2
    StudentDashboard --> End2
```

### 4.2 Notification Flow

```mermaid
flowchart TD
    Start([Event triggers notification]) --> CheckType{Event type?}
    CheckType -->|New Material| CreateNotif1[Create notification<br/>'New material uploaded']
    CheckType -->|Assignment Graded| CreateNotif2[Create notification<br/>'Assignment graded']
    CheckType -->|New Quiz| CreateNotif3[Create notification<br/>'New quiz available']
    CheckType -->|Live Class| CreateNotif4[Create notification<br/>'Class in 1 hour']
    CheckType -->|Payment| CreateNotif5[Create notification<br/>'Payment confirmed']
    CreateNotif1 --> SaveDB
    CreateNotif2 --> SaveDB
    CreateNotif3 --> SaveDB
    CreateNotif4 --> SaveDB
    CreateNotif5 --> SaveDB[Save to notifications table]
    SaveDB --> PushRealtime[Push via Supabase Realtime<br/>WebSocket]
    PushRealtime --> UserOnline{User online?}
    UserOnline -->|Yes| ShowBell[Update bell icon badge<br/>Increment unread count]
    UserOnline -->|No| QueueNotif[Queue for next login]
    ShowBell --> UserClicks{User clicks bell?}
    UserClicks -->|Yes| OpenDropdown[Open notifications dropdown]
    UserClicks -->|No| End1([End - notification visible])
    OpenDropdown --> DisplayList[Display latest 50 notifications]
    DisplayList --> UserClicksNotif[User clicks on notification]
    UserClicksNotif --> MarkRead[Mark as read]
    MarkRead --> Navigate[Navigate to relevant page<br/>Assignment, Quiz, Material, etc.]
    Navigate --> End2([End])
    QueueNotif --> UserLogsIn[User logs in]
    UserLogsIn --> ShowBell
```

---

## 5. Error & Edge Case Flows

### 5.1 Payment Failed Flow

```mermaid
flowchart TD
    Start([Student completes payment]) --> PaymentGateway[Payment Gateway processes]
    PaymentGateway --> PaymentFails{Payment fails?}
    PaymentFails -->|No| SuccessFlow[Normal success flow]
    SuccessFlow --> End1([End])
    PaymentFails -->|Yes| WebhookFailed[Webhook sent with FAILED status]
    WebhookFailed --> UpdatePayment[Update payment status to FAILED]
    UpdatePayment --> KeepEnrollment[Keep enrollment status PENDING]
    KeepEnrollment --> SendEmail[Send 'Payment failed' email]
    SendEmail --> StudentSees[Student sees 'Payment Failed' message]
    StudentSees --> RetryOption[Show 'Retry Payment' button]
    RetryOption --> ClickRetry{Student clicks retry?}
    ClickRetry -->|Yes| RedirectPayment[Redirect to payment page again]
    ClickRetry -->|No| ContactSupport[Student contacts support]
    RedirectPayment --> Start
    ContactSupport --> AdminHelps[Admin assists student]
    AdminHelps --> ManualProcess[Manual payment verification]
    ManualProcess --> End2([End])
```

### 5.2 File Upload Failed Flow

```mermaid
flowchart TD
    Start([Student uploads file]) --> SelectFile[Select file from device]
    SelectFile --> CheckSize{File size < 20MB?}
    CheckSize -->|No| ShowError1[Show 'File too large' error]
    ShowError1 --> End1([End - must reduce size])
    CheckSize -->|Yes| CheckType{File type valid?}
    CheckType -->|No| ShowError2[Show 'Invalid file type' error]
    ShowError2 --> End1
    CheckType -->|Yes| StartUpload[Start upload to Supabase]
    StartUpload --> ShowProgress[Show progress bar]
    ShowProgress --> UploadComplete{Upload successful?}
    UploadComplete -->|Yes| SaveRecord[Save submission record]
    SaveRecord --> ShowSuccess[Show 'Upload successful']
    ShowSuccess --> End2([End])
    UploadComplete -->|No| CheckError{Error type?}
    CheckError -->|Network| ShowRetry[Show 'Network error, retry?' dialog]
    CheckError -->|Server| ShowServerError[Show 'Server error, try again later']
    ShowRetry --> UserRetries{User clicks retry?}
    UserRetries -->|Yes| StartUpload
    UserRetries -->|No| End3([End])
    ShowServerError --> End3
```

---

**Document End**

> **Note**: These user flows represent the ideal paths and common edge cases. All flows are designed to be user-friendly with clear error messages and recovery options.
