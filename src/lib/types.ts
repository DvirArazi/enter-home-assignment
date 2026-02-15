export type Classroom = {
  id: string;
  name: string;
}

export type Grade0 = {
  status: "ungraded" | "unsubmitted";
} | {
  status: "graded";
  score: number | "unsubmitted" | "ungraded";
}

export type Grade1 = {
  status: "unsubmitted";
  dueDate: string;
} |
{
  status: "ungraded";
} | {
  status: "graded";
  score: number | "unsubmitted" | "ungraded";
};

export type Grade2 = {
  status: "unsubmitted";
} |
  (
    { submittedAt: string; } &
    (
      { status: "ungraded"; } |
      { status: "graded"; score: number; }
    )
  )

export type Task0 = {
  id: string;
  title: string;
}

export type Task1 = {
  id: string;
  title: string;
  grade: Grade1;
}

export interface Student {
  name: string;
  grades: Grade0[];
}

export type Submission = {
  studentName: string;
  files: File[];
  grade: Grade2;
}