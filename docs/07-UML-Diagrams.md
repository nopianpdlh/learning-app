# UML Diagrams

## Platform E-Learning - Tutor Nomor Satu

---

## 1. Use Case Diagrams

### 1.1 Student Use Cases

```
                    Student Use Cases
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                           ┌──────────┐                      │
│     ┌─────────────────────│ Student  │───────────────┐     │
│     │                     └──────────┘               │     │
│     │                                                 │     │
│     │                                                 │     │
│     ▼                                                 ▼     │
│  (Register)                                     (Login)    │
│     │                                                 │     │
│     │                                                 │     │
│     ▼                                                 ▼     │
│  (Browse Courses) ──────────> (Search Courses)            │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (View Course Detail)          (Filter Courses)           │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Add to Cart) ───────────> (Add to Wishlist)             │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Checkout)                                                │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Make Payment) ──────────> (Apply Coupon)                │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Enroll in Course)                                        │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Watch Video Lessons) ────> (Track Progress)             │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Take Quiz)                  (Submit Assignment)         │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Take Notes)                 (Ask Questions)             │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Complete Course)            (Write Review)              │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Download Certificate)                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Instructor Use Cases

```
                   Instructor Use Cases
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                        ┌──────────────┐                     │
│     ┌──────────────────│  Instructor  │──────────────┐     │
│     │                  └──────────────┘              │     │
│     │                                                 │     │
│     │                                                 │     │
│     ▼                                                 ▼     │
│  (Register as Instructor)                      (Login)     │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Create Course) ──────────> (Set Course Info)            │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Add Sections)               (Set Pricing)               │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Add Lessons) ──────────> (Upload Videos)                │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Create Quiz)                (Create Assignment)         │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Preview Course)             (Submit for Approval)       │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Publish Course)             (View Analytics)            │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Manage Students)            (Answer Questions)          │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Grade Assignments)          (Respond to Reviews)        │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (View Revenue)               (Create Coupons)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Admin Use Cases

```
                      Admin Use Cases
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ┌──────────┐                       │
│     ┌────────────────────│  Admin   │────────────────┐     │
│     │                    └──────────┘                │     │
│     │                                                 │     │
│     │                                                 │     │
│     ▼                                                 ▼     │
│  (Login)                                    (View Dashboard)│
│     │                                                 │     │
│     │                                                 │     │
│     ▼                                                 ▼     │
│  (Manage Users) ────────> (View User Details)             │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Suspend/Delete Users)      (Change User Roles)          │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Review Pending Courses)                                  │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Approve/Reject Courses) ──> (Provide Feedback)          │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Feature Courses)                                         │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Moderate Content) ─────> (Review Reported Content)      │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Delete Inappropriate Content)  (Warn Users)             │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (Manage Categories)                                       │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (View Analytics) ───────> (Generate Reports)             │
│     │                              │                       │
│     │                              │                       │
│     ▼                              ▼                       │
│  (Manage Payments)            (View Transactions)         │
│     │                                                       │
│     │                                                       │
│     ▼                                                       │
│  (System Settings)                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Activity Diagrams

### 2.1 User Registration Activity

```
                  User Registration Flow
┌─────────────────────────────────────────────────────────┐
│                        START                            │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ User clicks      │
                  │ "Register"       │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Fill registration│
                  │ form (email,     │
                  │ password, name)  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Submit form      │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Validate input   │
                  └────────┬─────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                Valid?         Invalid
                    │             │
                    │             ▼
                    │    ┌──────────────────┐
                    │    │ Show error       │
                    │    │ message          │
                    │    └────────┬─────────┘
                    │             │
                    │             └──────┐
                    │                    │
                    ▼                    │
          ┌──────────────────┐          │
          │ Check if email   │          │
          │ already exists   │          │
          └────────┬─────────┘          │
                   │                    │
            ┌──────┴──────┐            │
            │             │            │
         Exists?      Not exists       │
            │             │            │
            ▼             ▼            │
   ┌──────────────┐  ┌──────────────┐ │
   │ Show error   │  │ Create user  │ │
   │ "Email taken"│  │ in database  │ │
   └──────┬───────┘  └──────┬───────┘ │
          │                 │         │
          └─────────┬───────┘         │
                    │                 │
                    ▼                 │
          ┌──────────────────┐        │
          │ Generate         │        │
          │ verification     │        │
          │ token            │        │
          └────────┬─────────┘        │
                   │                  │
                   ▼                  │
          ┌──────────────────┐        │
          │ Send verification│        │
          │ email            │        │
          └────────┬─────────┘        │
                   │                  │
                   ▼                  │
          ┌──────────────────┐        │
          │ Show success     │        │
          │ message          │        │
          └────────┬─────────┘        │
                   │                  │
                   │◄─────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │       END         │
          └───────────────────┘
```

### 2.2 Course Purchase & Enrollment Activity

```
              Course Purchase & Enrollment Flow
┌────────────────────────────────────────────────────────┐
│                      START                             │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Browse courses   │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Select course    │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ View course      │
              │ details          │
              └────────┬─────────┘
                       │
                ┌──────┴──────┐
                │             │
            Free course?   Paid course
                │             │
                │             ▼
                │    ┌─────────────────┐
                │    │ Add to cart     │
                │    └────────┬─────────┘
                │             │
                │             ▼
                │    ┌─────────────────┐
                │    │ Go to checkout  │
                │    └────────┬─────────┘
                │             │
                │             ▼
                │    ┌─────────────────┐
                │    │ Apply coupon?   │
                │    └────────┬─────────┘
                │             │
                │      ┌──────┴──────┐
                │      │             │
                │    Yes            No
                │      │             │
                │      ▼             │
                │ ┌─────────────┐   │
                │ │ Validate    │   │
                │ │ coupon      │   │
                │ └──────┬──────┘   │
                │        │          │
                │  ┌─────┴──────┐   │
                │  │            │   │
                │Valid?     Invalid │
                │  │            │   │
                │  ▼            ▼   │
                │ ┌─────────┐ ┌────┐│
                │ │Apply    │ │Show││
                │ │discount │ │error││
                │ └────┬────┘ └──┬─┘│
                │      │         │  │
                │      └────┬────┘  │
                │           │◄──────┘
                │           │
                │           ▼
                │  ┌─────────────────┐
                │  │ Create payment  │
                │  │ transaction     │
                │  └────────┬─────────┘
                │           │
                │           ▼
                │  ┌─────────────────┐
                │  │ Redirect to     │
                │  │ payment gateway │
                │  └────────┬─────────┘
                │           │
                │           ▼
                │  ┌─────────────────┐
                │  │ Complete payment│
                │  └────────┬─────────┘
                │           │
                │     ┌─────┴──────┐
                │     │            │
                │ Success?      Failed
                │     │            │
                │     │            ▼
                │     │   ┌─────────────────┐
                │     │   │ Show error      │
                │     │   │ message         │
                │     │   └────────┬─────────┘
                │     │            │
                │     │            └──────┐
                │     │                   │
                ▼     ▼                   │
        ┌──────────────────┐             │
        │ Create enrollment│             │
        └────────┬──────────┘             │
                 │                        │
                 ▼                        │
        ┌──────────────────┐             │
        │ Send confirmation│             │
        │ email            │             │
        └────────┬──────────┘             │
                 │                        │
                 ▼                        │
        ┌──────────────────┐             │
        │ Redirect to      │             │
        │ course page      │             │
        └────────┬──────────┘             │
                 │                        │
                 │◄───────────────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │       END         │
        └───────────────────┘
```

### 2.3 Course Creation Activity (Instructor)

```
                 Course Creation Flow
┌────────────────────────────────────────────────────────┐
│                      START                             │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Click "Create   │
              │ New Course"     │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Enter course    │
              │ basic info      │
              │ (title, desc)   │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Select category │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Set pricing &   │
              │ level           │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Upload thumbnail│
              │ & preview video │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Save as draft   │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Create sections │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Add lessons to  │
              │ sections        │
              └────────┬─────────┘
                       │
                       ▼
          ┌────────────┴────────────┐
          │                         │
    ┌─────▼──────┐          ┌──────▼──────┐
    │ Video      │          │ Quiz/       │
    │ lesson     │          │ Assignment  │
    └─────┬──────┘          └──────┬──────┘
          │                        │
          ▼                        ▼
    ┌─────────────┐          ┌─────────────┐
    │ Upload video│          │ Create      │
    │ & resources │          │ questions   │
    └─────┬───────┘          └──────┬──────┘
          │                         │
          └────────────┬────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Preview course  │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ All content     │
              │ complete?       │
              └────────┬─────────┘
                       │
                 ┌─────┴─────┐
                 │           │
               Yes           No
                 │           │
                 │           ▼
                 │  ┌─────────────────┐
                 │  │ Continue editing│
                 │  └────────┬─────────┘
                 │           │
                 │           └──────┐
                 │                  │
                 ▼                  │
        ┌─────────────────┐         │
        │ Submit for      │         │
        │ admin review    │         │
        └────────┬─────────┘         │
                 │                   │
                 ▼                   │
        ┌─────────────────┐         │
        │ Wait for        │         │
        │ approval        │         │
        └────────┬─────────┘         │
                 │                   │
          ┌──────┴──────┐           │
          │             │           │
      Approved?     Rejected        │
          │             │           │
          │             ▼           │
          │    ┌─────────────────┐  │
          │    │ View feedback & │  │
          │    │ make changes    │  │
          │    └────────┬─────────┘  │
          │             │            │
          │             └────────────┘
          │
          ▼
  ┌─────────────────┐
  │ Course published│
  └────────┬─────────┘
           │
           ▼
  ┌─────────────────┐
  │       END       │
  └─────────────────┘
```

---

## 3. Sequence Diagrams

### 3.1 User Authentication Sequence

```
 Student    Frontend      API        Auth        Database
   │           │           │        Service        │
   │           │           │           │           │
   │  Login    │           │           │           │
   │──────────>│           │           │           │
   │           │           │           │           │
   │           │ POST /login           │           │
   │           │──────────>│           │           │
   │           │           │ Validate  │           │
   │           │           │──────────>│           │
   │           │           │           │ Query user│
   │           │           │           │──────────>│
   │           │           │           │           │
   │           │           │           │<──────────│
   │           │           │           │ User data │
   │           │           │           │           │
   │           │           │<──────────│           │
   │           │           │ Verify    │           │
   │           │           │ password  │           │
   │           │           │           │           │
   │           │           │ Generate  │           │
   │           │           │ JWT token │           │
   │           │           │           │           │
   │           │<──────────│           │           │
   │           │ JWT +     │           │           │
   │           │ User data │           │           │
   │           │           │           │           │
   │<──────────│           │           │           │
   │ Redirect  │           │           │           │
   │ Dashboard │           │           │           │
   │           │           │           │           │
```

### 3.2 Video Streaming Sequence

```
 Student   Frontend   API    Video      Redis     CDN
   │          │        │     Service      │        │
   │          │        │        │         │        │
   │ Play     │        │        │         │        │
   │ video    │        │        │         │        │
   │─────────>│        │        │         │        │
   │          │        │        │         │        │
   │          │ GET /video/:id  │         │        │
   │          │────────────────>│         │        │
   │          │        │        │         │        │
   │          │        │ Verify │         │        │
   │          │        │ enrollment       │        │
   │          │        │────────>         │        │
   │          │        │        │ Check   │        │
   │          │        │        │ cache   │        │
   │          │        │        │────────>│        │
   │          │        │        │         │        │
   │          │        │        │<────────│        │
   │          │        │        │ Cache   │        │
   │          │        │        │ hit     │        │
   │          │        │<───────│         │        │
   │          │        │ Signed │         │        │
   │          │        │ URL    │         │        │
   │          │<───────│        │         │        │
   │          │ Video  │        │         │        │
   │          │ URL    │        │         │        │
   │          │        │        │         │        │
   │          │ Request video   │         │        │
   │          │────────────────────────────────────>│
   │          │        │        │         │        │
   │          │<────────────────────────────────────│
   │          │ Stream video    │         │        │
   │<─────────│        │        │         │        │
   │ Video    │        │        │         │        │
   │ playing  │        │        │         │        │
   │          │        │        │         │        │
   │ Update   │        │        │         │        │
   │ progress │        │        │         │        │
   │─────────>│        │        │         │        │
   │          │        │        │         │        │
   │          │ POST /progress  │         │        │
   │          │────────────────>│         │        │
   │          │        │        │ Save    │        │
   │          │        │        │ progress│        │
   │          │        │        │────────>│        │
   │          │        │        │         │        │
   │          │<───────│        │         │        │
   │          │ Success│        │         │        │
   │<─────────│        │        │         │        │
   │          │        │        │         │        │
```

### 3.3 Course Purchase Sequence

```
Student  Frontend   API   Payment    Xendit   Enrollment   Email
  │         │        │     Service      │        Service    Service
  │         │        │        │         │           │         │
  │ Buy     │        │        │         │           │         │
  │ course  │        │        │         │           │         │
  │────────>│        │        │         │           │         │
  │         │        │        │         │           │         │
  │         │ POST /checkout  │         │           │         │
  │         │────────────────>│         │           │         │
  │         │        │        │         │           │         │
  │         │        │ Create │         │           │         │
  │         │        │ payment│         │           │         │
  │         │        │────────>         │           │         │
  │         │        │        │         │           │         │
  │         │        │        │ Create  │           │         │
  │         │        │        │ invoice │           │         │
  │         │        │        │────────>│           │         │
  │         │        │        │         │           │         │
  │         │        │        │<────────│           │         │
  │         │        │        │ Invoice │           │         │
  │         │        │<───────│ URL     │           │         │
  │         │        │ Payment│         │           │         │
  │         │        │ URL    │         │           │         │
  │         │<───────│        │         │           │         │
  │         │ URL    │        │         │           │         │
  │         │        │        │         │           │         │
  │ Redirect to Xendit        │         │           │         │
  │──────────────────────────────────────>          │         │
  │         │        │        │         │           │         │
  │ Complete payment          │         │           │         │
  │<──────────────────────────────────────          │         │
  │         │        │        │         │           │         │
  │         │        │        │ Webhook │           │         │
  │         │        │        │<────────│           │         │
  │         │        │        │         │           │         │
  │         │        │ Update │         │           │         │
  │         │        │ status │         │           │         │
  │         │        │────────>         │           │         │
  │         │        │        │         │           │         │
  │         │        │        │ Create  │           │         │
  │         │        │        │ enrollment          │         │
  │         │        │        │─────────────────────>         │
  │         │        │        │         │           │         │
  │         │        │        │         │           │ Send    │
  │         │        │        │         │           │ email   │
  │         │        │        │         │           │────────>│
  │         │        │        │         │           │         │
  │         │        │<───────│         │           │         │
  │         │        │ Success│         │           │         │
  │         │<───────│        │         │           │         │
  │         │ Success│        │         │           │         │
  │<────────│        │        │         │           │         │
  │ Redirect│        │        │         │           │         │
  │ to      │        │        │         │           │         │
  │ course  │        │        │         │           │         │
  │         │        │        │         │           │         │
```

---

## 4. Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                │
├─────────────────────────────────────────────────────────────┤
│ - id: string                                                │
│ - email: string                                             │
│ - password: string                                          │
│ - name: string                                              │
│ - image: string?                                            │
│ - role: UserRole                                            │
│ - createdAt: Date                                           │
├─────────────────────────────────────────────────────────────┤
│ + register(): Promise<User>                                 │
│ + login(credentials): Promise<AuthResponse>                 │
│ + updateProfile(data): Promise<User>                        │
│ + changePassword(oldPwd, newPwd): Promise<void>            │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┼───────────────────┐
       │           │                   │
       ▼           ▼                   ▼
┌──────────┐ ┌──────────┐      ┌──────────┐
│ Student  │ │Instructor│      │  Admin   │
├──────────┤ ├──────────┤      ├──────────┤
│          │ │          │      │          │
├──────────┤ ├──────────┤      ├──────────┤
│+ enroll()│ │+ create  │      │+ approve │
│+ learn() │ │  Course()│      │  Course()│
└──────────┘ └──────────┘      └──────────┘
     │             │                  │
     │             │                  │
     │             ▼                  │
     │      ┌──────────────────────┐ │
     │      │      Course          │ │
     │      ├──────────────────────┤ │
     │      │ - id: string         │ │
     │      │ - title: string      │ │
     │      │ - description: string│ │
     │      │ - price: number      │ │
     │      │ - instructorId: string│ │
     │      │ - status: CourseStatus│ │
     │      ├──────────────────────┤ │
     │      │ + publish(): void    │ │
     │      │ + addSection(): Section│ │
     │      │ + enroll(userId): void│ │
     │      └──────────┬───────────┘ │
     │                 │              │
     │                 ▼              │
     │          ┌──────────────┐     │
     │          │   Section    │     │
     │          ├──────────────┤     │
     │          │ - id: string │     │
     │          │ - title: str │     │
     │          │ - order: int │     │
     │          ├──────────────┤     │
     │          │ + addLesson()│     │
     │          └──────┬───────┘     │
     │                 │              │
     │                 ▼              │
     │          ┌──────────────┐     │
     │          │   Lesson     │     │
     │          ├──────────────┤     │
     │          │ - id: string │     │
     │          │ - title: str │     │
     │          │ - type: enum │     │
     │          │ - duration:int│    │
     │          ├──────────────┤     │
     │          │ + complete() │     │
     │          └──────┬───────┘     │
     │                 │              │
     │        ┌────────┼────────┐    │
     │        │        │        │    │
     │        ▼        ▼        ▼    │
     │   ┌──────┐ ┌──────┐ ┌──────┐ │
     │   │Video │ │ Quiz │ │Assign│ │
     │   ├──────┤ ├──────┤ ├──────┤ │
     │   │-url  │ │-ques │ │-inst │ │
     │   └──────┘ └──────┘ └──────┘ │
     │                                │
     ▼                                │
┌──────────────────┐                 │
│   Enrollment     │                 │
├──────────────────┤                 │
│ - id: string     │                 │
│ - userId: string │                 │
│ - courseId: string│                │
│ - progress: float│                 │
│ - status: enum   │                 │
├──────────────────┤                 │
│ + trackProgress()│                 │
│ + complete()     │                 │
└──────────┬───────┘                 │
           │                         │
           ▼                         │
    ┌──────────────┐                │
    │   Progress   │                │
    ├──────────────┤                │
    │ - lessonId   │                │
    │ - completed  │                │
    │ - watchTime  │                │
    ├──────────────┤                │
    │ + update()   │                │
    └──────────────┘                │
                                    │
┌──────────────────┐                │
│    Payment       │                │
├──────────────────┤                │
│ - id: string     │                │
│ - userId: string │                │
│ - amount: decimal│                │
│ - status: enum   │                │
├──────────────────┤                │
│ + process()      │                │
│ + refund()       │                │
└──────────────────┘                │
                                    │
┌──────────────────┐                │
│   Certificate    │                │
├──────────────────┤                │
│ - id: string     │                │
│ - userId: string │                │
│ - courseId: string│               │
│ - certificateNumber│              │
├──────────────────┤                │
│ + generate()     │                │
│ + download()     │                │
│ + verify()       │                │
└──────────────────┘                │
                                    │
┌──────────────────┐                │
│     Review       │                │
├──────────────────┤                │
│ - id: string     │                │
│ - userId: string │                │
│ - courseId: string│               │
│ - rating: int    │                │
│ - comment: text  │                │
├──────────────────┤                │
│ + submit()       │                │
│ + update()       │                │
└──────────────────┘                │
```

---

## 5. State Diagram

### 5.1 Course Status State Diagram

```
              Course Lifecycle States

         ┌─────────────────┐
         │                 │
         │     DRAFT       │◄──────────┐
         │                 │           │
         └────────┬────────┘           │
                  │                    │
                  │ Submit for         │ Reject
                  │ Review             │
                  │                    │
                  ▼                    │
         ┌─────────────────┐           │
         │                 │           │
         │ PENDING_REVIEW  │───────────┘
         │                 │
         └────────┬────────┘
                  │
                  │ Approve
                  │
                  ▼
         ┌─────────────────┐
         │                 │
         │   PUBLISHED     │◄──────────┐
         │                 │           │
         └────────┬────────┘           │
                  │                    │
                  │ Unpublish          │ Republish
                  │                    │
                  ▼                    │
         ┌─────────────────┐           │
         │                 │           │
         │    ARCHIVED     │───────────┘
         │                 │
         └─────────────────┘
```

### 5.2 Payment Status State Diagram

```
            Payment Transaction States

         ┌─────────────────┐
         │                 │
         │    PENDING      │
         │                 │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
    Success            Failed
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│                 │ │                 │
│    SUCCESS      │ │     FAILED      │
│                 │ │                 │
└────────┬────────┘ └─────────────────┘
         │
         │ Request refund
         │
         ▼
┌─────────────────┐
│                 │
│    REFUNDED     │
│                 │
└─────────────────┘
```

---

## 6. Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │   Pages    │  │Components  │  │   State Management │    │
│  │            │  │  (UI/UX)   │  │     (Zustand)      │    │
│  └─────┬──────┘  └─────┬──────┘  └──────────┬─────────┘    │
│        │               │                     │              │
│        └───────────────┴─────────────────────┘              │
│                        │                                    │
│                        ▼                                    │
│              ┌──────────────────┐                          │
│              │   API Client     │                          │
│              │  (React Query)   │                          │
│              └──────────┬───────┘                          │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    Backend Layer                           │
│                                                            │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐    │
│  │Controllers │  │ Middleware │  │    Services      │    │
│  │            │  │   (Auth,   │  │  (Business Logic)│    │
│  │            │  │ Validation)│  │                  │    │
│  └─────┬──────┘  └─────┬──────┘  └──────────┬───────┘    │
│        │               │                     │            │
│        └───────────────┴─────────────────────┘            │
│                        │                                  │
│                        ▼                                  │
│              ┌──────────────────┐                        │
│              │   Repositories   │                        │
│              │  (Data Access)   │                        │
│              └──────────┬───────┘                        │
└─────────────────────────┼────────────────────────────────┘
                          │
                          │ Database Queries
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    Data Layer                              │
│                                                            │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐    │
│  │ PostgreSQL │  │   Redis    │  │   File Storage   │    │
│  │            │  │   Cache    │  │   (S3/CDN)       │    │
│  └────────────┘  └────────────┘  └──────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: November 2, 2025  
**Owner**: PT. Tutor Nomor Satu - Development Team  
**Status**: Approved
