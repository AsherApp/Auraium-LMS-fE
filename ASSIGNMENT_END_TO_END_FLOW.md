# Assignment End-to-End Flow Documentation

## 📋 **Overview**
This document outlines the complete assignment workflow from teacher creation to student submission, grading, and feedback. This serves as the definitive reference for the assignment system implementation.

## 🔄 **Assignment Status Flow**

### **Status Definitions:**
1. **`not_started`** - Student hasn't submitted anything yet
2. **`submitted`** - Student has submitted their work
3. **`graded`** - Teacher has graded the submission (final)
4. **`returned`** - Teacher has returned it for resubmission (with feedback)
5. **`awaiting_response`** - Student needs to resubmit after teacher requested changes

### **Status Flow Diagram:**
```
not_started → submitted → graded
                    ↓
                returned → awaiting_response → submitted (again)
```

### **Status Mapping (Backend → Frontend):**
- `returned` (database) → `awaiting_response` (frontend display)
- `submitted` (database) → `submitted` (frontend display)
- `graded` (database) → `graded` (frontend display)
- No submission → `not_started` (frontend display)

## 🎯 **Complete End-to-End Flow**

### **Phase 1: Teacher Creates Assignment**

#### **1.1 Assignment Creation**
- **Location**: Teacher Course Detail Page → "Add Assignment" button
- **Context**: Course-level, Module-level, or Lesson-level assignment
- **Required Fields**:
  - Title, Description, Points, Due Date
  - Assignment Type (essay, quiz, project, file_upload, etc.)
  - Scope (course, module, lesson)
- **Database**: Creates record in `assignments` table
- **Status**: Assignment is `published` and `available`

#### **1.2 Assignment Types Supported**
- **Essay**: Text-based responses
- **Quiz**: Multiple choice, true/false, short answer
- **Project**: File uploads, presentations
- **File Upload**: Document submissions
- **Code Submission**: Programming assignments
- **Discussion**: Forum-style responses
- **Peer Review**: Student-to-student feedback

### **Phase 2: Student Views Assignment**

#### **2.1 Assignment Discovery**
- **Student Assignments Page**: `/student/assignments`
- **Course Assignments**: `/student/course/[id]`
- **Assignment Detail**: `/student/assignment/[id]`

#### **2.2 Assignment Information Displayed**
- Title, Description, Points, Due Date
- Assignment Type and Requirements
- Current Status (Not Started, Submitted, Graded, Awaiting Response)
- Submission History (if resubmissions)

### **Phase 3: Student Submits Assignment**

#### **3.1 Submission Process**
- **Location**: `/student/course/[id]/assignment/[aid]`
- **Content Types**:
  - **Essay**: Rich text editor
  - **Quiz**: Interactive quiz interface
  - **File Upload**: Drag & drop file uploader
  - **Code**: Syntax-highlighted code editor
- **Auto-save**: Drafts saved automatically
- **Validation**: Content validation based on assignment type

#### **3.2 Submission Creation**
- **API**: `POST /api/submissions`
- **Database**: Creates record in `submissions` table
- **Fields**:
  - `assignment_id`, `student_id`, `student_email`
  - `content` (JSONB with type-specific data)
  - `response` (text response)
  - `status: 'submitted'`
  - `attempt_number` (incremental)

#### **3.3 Status Update**
- **Student View**: Status changes to "Submitted"
- **Teacher View**: Assignment appears in "Pending Grading"

### **Phase 4: Teacher Reviews Submission**

#### **4.1 Teacher Access**
- **Location**: `/teacher/assignment/[aid]`
- **Submission List**: All student submissions for the assignment
- **Individual Submission**: `/teacher/assignment/[aid]/submission/[studentId]`

#### **4.2 Submission Review**
- **Content Display**: Type-specific content viewer
- **Student Information**: Name, submission date, attempt number
- **Previous Attempts**: History of resubmissions

### **Phase 5: Teacher Grades Assignment**

#### **5.1 Grading Interface**
- **Location**: `/teacher/assignment/[aid]/submission/[studentId]`
- **Grading Options**:
  - **Grade**: Numerical score (0 to assignment points)
  - **Feedback**: Text feedback to student
  - **Request Resubmission**: Boolean flag

#### **5.2 Grading Decision**
- **Final Grade**: `status: 'graded'` - No resubmission allowed
- **Request Resubmission**: `status: 'returned'` - Student can resubmit

#### **5.3 Grading API**
- **API**: `PUT /api/submissions/[submissionId]/grade`
- **Request Body**:
  ```json
  {
    "grade": 85,
    "feedback": "Good work, but needs more detail in section 3",
    "requestResubmission": false
  }
  ```

### **Phase 6: Student Receives Feedback**

#### **6.1 Status Notification**
- **Student Dashboard**: Assignment status updates
- **Assignment Page**: Shows grade and feedback
- **Notifications**: In-app notification of grade/feedback

#### **6.2 Feedback Display**
- **Graded Assignment**: Shows final grade and feedback
- **Returned Assignment**: Shows feedback and "Resubmission Required" status

### **Phase 7: Resubmission Process (If Required)**

#### **7.1 Resubmission Trigger**
- **Status**: `returned` → `awaiting_response`
- **Student View**: "Awaiting Response" badge
- **Action Required**: Student must resubmit

#### **7.2 Resubmission Process**
- **Same as Phase 3**: Student submits new content
- **Attempt Number**: Increments (attempt_number: 2, 3, etc.)
- **Status**: Returns to `submitted`
- **Teacher**: Can grade again or request another resubmission

## 🗄️ **Database Schema**

### **Assignments Table**
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id),
  module_id UUID REFERENCES modules(id),
  lesson_id UUID REFERENCES lessons(id),
  type VARCHAR NOT NULL, -- essay, quiz, project, etc.
  points INTEGER DEFAULT 0,
  due_at TIMESTAMP,
  available_from TIMESTAMP,
  available_until TIMESTAMP,
  is_published BOOLEAN DEFAULT false,
  settings JSONB, -- type-specific settings (quiz questions, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Submissions Table**
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID NOT NULL,
  student_email VARCHAR NOT NULL,
  content JSONB, -- type-specific submission content
  response TEXT, -- general text response
  status submission_status DEFAULT 'submitted',
  attempt_number INTEGER DEFAULT 1,
  grade INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP,
  graded_by VARCHAR, -- teacher email
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE submission_status AS ENUM (
  'submitted',
  'graded', 
  'returned'
);
```

## 🔌 **API Endpoints**

### **Assignment Management**
- `GET /api/assignments` - List assignments (teacher)
- `GET /api/assignments/[id]` - Get assignment details
- `POST /api/assignments` - Create assignment (teacher)
- `PUT /api/assignments/[id]` - Update assignment (teacher)
- `DELETE /api/assignments/[id]` - Delete assignment (teacher)

### **Submission Management**
- `GET /api/submissions/assignment/[assignmentId]` - Get submissions for assignment (teacher)
- `GET /api/submissions/[submissionId]` - Get specific submission
- `POST /api/submissions` - Create submission (student)
- `PUT /api/submissions/[submissionId]` - Update submission (student)
- `PUT /api/submissions/[submissionId]/grade` - Grade submission (teacher)

### **Student-Specific Endpoints**
- `GET /api/assignments/course/[courseId]` - Get course assignments (student)
- Assignment endpoint includes `student_submission` field for students

## 🎨 **Frontend Components**

### **Teacher Components**
- `AssignmentCreator` - Create/edit assignments
- `AssignmentList` - List all assignments
- `SubmissionList` - List student submissions
- `GradingInterface` - Grade individual submissions
- `AssignmentAnalytics` - Assignment statistics

### **Student Components**
- `AssignmentCard` - Display assignment info
- `SubmissionForm` - Submit assignment content
- `GradeDisplay` - Show grade and feedback
- `ResubmissionPrompt` - Handle resubmission requests

## 🔐 **Access Control**

### **Teacher Permissions**
- Create, edit, delete assignments in their courses
- View all submissions for their assignments
- Grade submissions and provide feedback
- Request resubmissions

### **Student Permissions**
- View assignments in enrolled courses
- Submit assignments (before due date)
- View their own grades and feedback
- Resubmit if requested by teacher

## 📊 **Status Computed Fields**

### **Backend Computation (for students)**
```typescript
const assignmentWithComputedFields = {
  ...assignment,
  is_submitted: !!studentSubmission,
  is_graded: studentSubmission?.status === 'graded',
  status: studentSubmission ? 
    (studentSubmission.status === 'returned' ? 'awaiting_response' : 
     studentSubmission.status === 'graded' ? 'graded' : 
     studentSubmission.status === 'submitted' ? 'submitted' : 'not_started') : 
    'not_started',
  can_resubmit: studentSubmission?.status === 'returned',
  student_submission: studentSubmission
}
```

### **Frontend Status Display**
- **Not Started**: Gray badge, "Start Assignment" button
- **Submitted**: Blue badge, "View Submission" button
- **Graded**: Green badge, "View Result" button
- **Awaiting Response**: Orange badge, "Resubmit" button

## 🚨 **Error Handling**

### **Common Error Scenarios**
1. **Student not enrolled**: 403 Forbidden
2. **Assignment not found**: 404 Not Found
3. **Invalid submission content**: 400 Bad Request
4. **Unauthorized grading**: 403 Forbidden
5. **Assignment overdue**: 400 Bad Request (if late submissions disabled)

### **Validation Rules**
- Assignment content must match assignment type
- File uploads must meet size/type requirements
- Quiz answers must be valid for quiz questions
- Grades must be within 0 to assignment points range

## 🔄 **Resubmission Logic**

### **When Resubmission is Allowed**
- Teacher sets `requestResubmission: true` during grading
- Student status becomes `awaiting_response`
- Student can submit new content
- Attempt number increments

### **When Resubmission is Not Allowed**
- Teacher sets `requestResubmission: false` during grading
- Student status becomes `graded`
- Assignment is marked as complete
- No further submissions allowed

## 📱 **Mobile Responsiveness**

### **Key Considerations**
- Touch-friendly submission forms
- Responsive file upload areas
- Mobile-optimized grading interface
- Swipe gestures for navigation

## 🔍 **Testing Scenarios**

### **End-to-End Test Cases**
1. **Complete Flow**: Create → Submit → Grade → Complete
2. **Resubmission Flow**: Create → Submit → Return → Resubmit → Grade
3. **Multiple Attempts**: Multiple resubmissions with feedback
4. **Different Types**: Test all assignment types
5. **Access Control**: Verify permissions for teachers/students
6. **Error Handling**: Test invalid submissions, unauthorized access

### **Performance Considerations**
- Lazy loading of assignment content
- Efficient submission queries
- Optimized file upload handling
- Caching of assignment metadata

---

## 📝 **Implementation Notes**

### **Key Files**
- **Backend**: `Endubackend/src/routes/assignments/index.ts`
- **Frontend**: `app/(lms)/student/course/[id]/assignment/[aid]/page.tsx`
- **Hooks**: `services/assignments/hook.ts`
- **API**: `services/assignments/api.ts`

### **Status Consistency**
- Always use computed status from backend
- Never rely on raw database status in frontend
- Ensure status mapping is consistent across all components

### **Data Flow**
1. Backend computes status based on submission data
2. Frontend receives computed status via API
3. UI components display status using consistent mapping
4. User actions update status through proper API calls

This documentation serves as the definitive reference for the assignment system. Any changes to the flow should be reflected in this document to maintain consistency across the system.
