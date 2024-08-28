export interface Survey {
  id: string;
  title: string;
  questions: Question[];
  createdAt: Date;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}
