## 4. Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                │
├─────────────────────────────────────────────────────────────┤
│ - id: string                                                │
│ - email: string                                             │
│ - phone: string                                             │
│ - name: string                                              │
│ - avatar: string?                                           │
│ - role: UserRole (STUDENT/TUTOR/ADMIN)                      │
│ - authId: string                                            │
│ - createdAt: Date                                           │
│ - updatedAt: Date                                           │
├─────────────────────────────────────────────────────────────┤
│ + register(): Promise<User>                                 │
│ + login(credentials): Promise<AuthResponse>                 │
│ + updateProfile(data): Promise<User>                        │
│ + changePassword(oldPwd, newPwd): Promise<void>            │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌──────────────────┐ ┌──────────────────┐
│ StudentProfile   │ │  TutorProfile    │
├──────────────────┤ ├──────────────────┤
│ - id: string     │ │ - id: string     │
│ - userId: string │ │ - userId: string │
│ - grade: string  │ │ - bio: text      │
│ - school: string │ │ - subjects: []   │
│ - parentName     │ │ - createdAt      │
│ - parentPhone    │ │                  │
│ - createdAt      │ │                  │
├──────────────────┤ ├──────────────────┤
│+ enroll()        │ │+ createClass()   │
│+ submitAssign()  │ │+ gradeAssign()   │
│+ takeQuiz()      │ │+ createQuiz()    │
└──────┬───────────┘ └──────┬───────────┘
       │                    │
       │                    ▼
       │      ┌──────────────────────┐
       │      │       Class          │
       │      ├──────────────────────┤
       │      │ - id: string         │
       │      │ - title: string      │
       │      │ - description: string│
       │      │ - subject: string    │
       │      │ - gradeLevel: string │
       │      │ - price: decimal     │
       │      │ - capacity: int      │
       │      │ - schedule: string   │
       │      │ - startDate: Date    │
       │      │ - endDate: Date      │
       │      │ - published: boolean │
       │      │ - tutorId: string    │
       │      ├──────────────────────┤
       │      │ + publish(): void    │
       │      │ + addMaterial(): void│
       │      │ + enroll(userId): void│
       │      └──────────┬───────────┘
       │                 │
       │                 │
       │      ┌──────────┼──────────────────────┐
       │      │          │                      │
       │      ▼          ▼                      ▼
       │  ┌──────────┐ ┌──────────┐      ┌──────────────┐
       │  │ Material │ │Assignment│      │   Quiz       │
       │  ├──────────┤ ├──────────┤      ├──────────────┤
       │  │ - id     │ │ - id     │      │ - id         │
       │  │ - title  │ │ - title  │      │ - title      │
       │  │ - type   │ │ - desc   │      │ - timeLimit  │
       │  │ - fileUrl│ │ - dueDate│      │ - maxAttempts│
       │  │ - session│ │ - maxPts │      │ - startTime  │
       │  ├──────────┤ ├──────────┤      ├──────────────┤
       │  │+ view()  │ │+ submit()│      │+ take()      │
       │  └──────────┘ └─────┬────┘      └──────┬───────┘
       │                     │                   │
       │                     ▼                   ▼
       │            ┌─────────────────┐  ┌──────────────┐
       │            │Assignment       │  │QuizQuestion  │
       │            │Submission       │  ├──────────────┤
       │            ├─────────────────┤  │ - id         │
       │            │ - id            │  │ - question   │
       │            │ - studentId     │  │ - type       │
       │            │ - assignmentId  │  │ - options    │
       │            │ - fileUrl       │  │ - correctAns │
       │            │ - status        │  │ - points     │
       │            │ - score         │  └──────────────┘
       │            │ - feedback      │          │
       │            │ - submittedAt   │          │
       │            │ - gradedAt      │          ▼
       │            ├─────────────────┤  ┌──────────────┐
       │            │+ grade()        │  │QuizAttempt   │
       │            └─────────────────┘  ├──────────────┤
       │                                 │ - id         │
       │                                 │ - studentId  │
       │                                 │ - quizId     │
       │                                 │ - score      │
       │                                 │ - percentage │
       │                                 │ - startedAt  │
       │                                 │ - submittedAt│
       │                                 ├──────────────┤
       │                                 │+ calculate() │
       │                                 └──────────────┘
       │
       ▼
┌──────────────────┐
│   Enrollment     │
├──────────────────┤
│ - id: string     │
│ - studentId      │
│ - classId        │
│ - status: enum   │
│ - enrolledAt     │
├──────────────────┤
│ + trackProgress()│
│ + complete()     │
└──────────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   Payment    │
    ├──────────────┤
    │ - id         │
    │ - enrollId   │
    │ - amount     │
    │ - method     │
    │ - status     │
    │ - externalId │
    │ - paidAt     │
    ├──────────────┤
    │ + process()  │
    │ + verify()   │
    └──────────────┘

┌──────────────────┐
│   LiveClass      │
├──────────────────┤
│ - id: string     │
│ - classId        │
│ - title          │
│ - meetingUrl     │
│ - scheduledAt    │
│ - duration       │
├──────────────────┤
│ + start()        │
│ + end()          │
└──────────────────┘

┌──────────────────┐
│  ForumThread     │
├──────────────────┤
│ - id: string     │
│ - classId        │
│ - title          │
│ - isPinned       │
│ - isLocked       │
├──────────────────┤
│ + pin()          │
│ + lock()         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    ForumPost     │
├──────────────────┤
│ - id: string     │
│ - threadId       │
│ - authorId       │
│ - authorType     │
│ - content        │
│ - parentId?      │
│ - createdAt      │
├──────────────────┤
│ + reply()        │
│ + edit()         │
└──────────────────┘

┌──────────────────┐
│  Notification    │
├──────────────────┤
│ - id: string     │
│ - userId         │
│ - type           │
│ - title          │
│ - message        │
│ - link           │
│ - read: boolean  │
│ - createdAt      │
├──────────────────┤
│ + markAsRead()   │
│ + send()         │
└──────────────────┘
```
