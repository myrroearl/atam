"use client";
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

const programKeys = ["BSIT", "BSCS", "BSA", "BSECE", "BSN"] as const;
type ProgramKey = typeof programKeys[number];
type GraduationTrendsRow = {
  year: string;
  BSIT: number;
  BSCS: number;
  BSA: number;
  BSECE: number;
  BSN: number;
};
const graduationTrendsData: GraduationTrendsRow[] = [
  { year: "2019", BSIT: 85, BSCS: 88, BSA: 91, BSECE: 89, BSN: 93 },
  { year: "2020", BSIT: 88, BSCS: 90, BSA: 92, BSECE: 90, BSN: 94 },
  { year: "2021", BSIT: 91, BSCS: 92, BSA: 94, BSECE: 92, BSN: 96 },
  { year: "2022", BSIT: 89, BSCS: 91, BSA: 93, BSECE: 91, BSN: 95 },
  { year: "2023", BSIT: 93, BSCS: 94, BSA: 96, BSECE: 94, BSN: 97 },
];
// Remove Dropout-to-Graduate Ratio and Early Graduation Detection data and UI
// Add mock graduates data
const graduates = [
  { name: "Maria Santos", program: "BSIT", year: 2023, gwa: 1.10 },
  { name: "John Carlo Reyes", program: "BSCS", year: 2023, gwa: 1.25 },
  { name: "Anna Marie Cruz", program: "BSA", year: 2023, gwa: 1.18 },
  { name: "Michael Torres", program: "BSECE", year: 2023, gwa: 1.30 },
  { name: "Sarah Johnson", program: "BSN", year: 2023, gwa: 1.22 },
  { name: "Carlos Mendoza", program: "BSIT", year: 2022, gwa: 1.35 },
  { name: "Lisa Garcia", program: "BSA", year: 2022, gwa: 1.28 },
  { name: "Robert Kim", program: "BSCS", year: 2022, gwa: 1.40 },
  { name: "Emily Tan", program: "BSECE", year: 2022, gwa: 1.32 },
  { name: "Jessica Lee", program: "BSN", year: 2022, gwa: 1.20 },
];

// Mock student progress data
const getStudentProgress = (studentName: string) => {
  const studentData: { [key: string]: any } = {
    "Maria Santos": {
      name: "Maria Santos",
      studentId: "22-00123",
      program: "BSIT",
      graduationYear: 2023,
      finalGwa: 1.10,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.25, credits: 18, status: "Dean's Lister", courses: ["IT 101", "MATH 101", "ENG 101", "PE 101", "NSTP 101", "FIL 101"] },
          semester2: { gwa: 1.15, credits: 19, status: "Dean's Lister", courses: ["IT 102", "MATH 102", "ENG 102", "PE 102", "NSTP 102", "HIST 101"] },
          yearEndGwa: 1.20,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.10, credits: 20, status: "President's Lister", courses: ["IT 201", "IT 202", "MATH 201", "PHYS 101", "SCI 101", "HUM 101"] },
          semester2: { gwa: 1.05, credits: 21, status: "President's Lister", courses: ["IT 203", "IT 204", "MATH 202", "STAT 101", "SOC 101", "RIZAL"] },
          yearEndGwa: 1.08,
          yearEndStatus: "President's Lister"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.08, credits: 22, status: "President's Lister", courses: ["IT 301", "IT 302", "IT 303", "ETHICS", "ECON 101", "ELECTIVE 1"] },
          semester2: { gwa: 1.12, credits: 20, status: "Dean's Lister", courses: ["IT 304", "IT 305", "IT 306", "RESEARCH 1", "ELECTIVE 2", "ELECTIVE 3"] },
          yearEndGwa: 1.10,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.15, credits: 18, status: "Dean's Lister", courses: ["IT 401", "IT 402", "RESEARCH 2", "CAPSTONE 1", "ELECTIVE 4"] },
          semester2: { gwa: 1.08, credits: 15, status: "Dean's Lister", courses: ["IT 403", "CAPSTONE 2", "INTERNSHIP", "SEMINAR"] },
          yearEndGwa: 1.12,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "1st Year", achievement: "Academic Excellence Award" },
        { year: "2nd Year", achievement: "Outstanding Student in Programming" },
        { year: "3rd Year", achievement: "Research Grant Recipient" },
        { year: "4th Year", achievement: "Magna Cum Laude" }
      ]
    },
    "John Carlo Reyes": {
      name: "John Carlo Reyes",
      studentId: "22-00456",
      program: "BSCS",
      graduationYear: 2023,
      finalGwa: 1.25,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.50, credits: 18, status: "Good Standing", courses: ["CS 101", "MATH 101", "ENG 101", "PE 101", "NSTP 101", "FIL 101"] },
          semester2: { gwa: 1.35, credits: 19, status: "Dean's Lister", courses: ["CS 102", "MATH 102", "ENG 102", "PE 102", "NSTP 102", "HIST 101"] },
          yearEndGwa: 1.42,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.28, credits: 20, status: "Dean's Lister", courses: ["CS 201", "CS 202", "MATH 201", "PHYS 101", "SCI 101", "HUM 101"] },
          semester2: { gwa: 1.22, credits: 21, status: "Dean's Lister", courses: ["CS 203", "CS 204", "MATH 202", "STAT 101", "SOC 101", "RIZAL"] },
          yearEndGwa: 1.25,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.18, credits: 22, status: "Dean's Lister", courses: ["CS 301", "CS 302", "CS 303", "ETHICS", "ECON 101", "ELECTIVE 1"] },
          semester2: { gwa: 1.20, credits: 20, status: "Dean's Lister", courses: ["CS 304", "CS 305", "CS 306", "RESEARCH 1", "ELECTIVE 2", "ELECTIVE 3"] },
          yearEndGwa: 1.19,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.25, credits: 18, status: "Dean's Lister", courses: ["CS 401", "CS 402", "RESEARCH 2", "CAPSTONE 1", "ELECTIVE 4"] },
          semester2: { gwa: 1.30, credits: 15, status: "Dean's Lister", courses: ["CS 403", "CAPSTONE 2", "INTERNSHIP", "SEMINAR"] },
          yearEndGwa: 1.27,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "2nd Year", achievement: "Programming Competition Finalist" },
        { year: "3rd Year", achievement: "Hackathon Winner" },
        { year: "4th Year", achievement: "Best Thesis Award" }
      ]
    },
    "Anna Marie Cruz": {
      name: "Anna Marie Cruz",
      studentId: "22-00789",
      program: "BSA",
      graduationYear: 2023,
      finalGwa: 1.18,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.40, credits: 18, status: "Dean's Lister", courses: ["ACC 101", "MATH 101", "ENG 101", "PE 101", "NSTP 101", "FIL 101"] },
          semester2: { gwa: 1.35, credits: 19, status: "Dean's Lister", courses: ["ACC 102", "MATH 102", "ENG 102", "PE 102", "NSTP 102", "HIST 101"] },
          yearEndGwa: 1.37,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.25, credits: 20, status: "Dean's Lister", courses: ["ACC 201", "ACC 202", "ECON 101", "STAT 101", "LAW 101", "HUM 101"] },
          semester2: { gwa: 1.20, credits: 21, status: "Dean's Lister", courses: ["ACC 203", "ACC 204", "ECON 102", "LAW 102", "SOC 101", "RIZAL"] },
          yearEndGwa: 1.22,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.15, credits: 22, status: "Dean's Lister", courses: ["ACC 301", "ACC 302", "TAX 101", "AUDIT 101", "MAN 101", "ELECTIVE 1"] },
          semester2: { gwa: 1.18, credits: 20, status: "Dean's Lister", courses: ["ACC 303", "TAX 102", "AUDIT 102", "RESEARCH 1", "ELECTIVE 2", "ELECTIVE 3"] },
          yearEndGwa: 1.16,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.20, credits: 18, status: "Dean's Lister", courses: ["ACC 401", "TAX 201", "AUDIT 201", "CAPSTONE 1", "ELECTIVE 4"] },
          semester2: { gwa: 1.15, credits: 15, status: "Dean's Lister", courses: ["ACC 402", "CAPSTONE 2", "INTERNSHIP", "SEMINAR"] },
          yearEndGwa: 1.17,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "2nd Year", achievement: "Accounting Excellence Award" },
        { year: "3rd Year", achievement: "Tax Computation Competition Winner" },
        { year: "4th Year", achievement: "CPA Board Exam Qualifier" }
      ]
    },
    "Michael Torres": {
      name: "Michael Torres",
      studentId: "22-00321",
      program: "BSECE",
      graduationYear: 2023,
      finalGwa: 1.30,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.60, credits: 18, status: "Good Standing", courses: ["ECE 101", "MATH 101", "PHYS 101", "ENG 101", "PE 101", "NSTP 101"] },
          semester2: { gwa: 1.45, credits: 19, status: "Dean's Lister", courses: ["ECE 102", "MATH 102", "PHYS 102", "ENG 102", "PE 102", "NSTP 102"] },
          yearEndGwa: 1.52,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.35, credits: 20, status: "Dean's Lister", courses: ["ECE 201", "ECE 202", "MATH 201", "PHYS 201", "CHEM 101", "HUM 101"] },
          semester2: { gwa: 1.30, credits: 21, status: "Dean's Lister", courses: ["ECE 203", "ECE 204", "MATH 202", "PHYS 202", "SOC 101", "RIZAL"] },
          yearEndGwa: 1.32,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.25, credits: 22, status: "Dean's Lister", courses: ["ECE 301", "ECE 302", "ECE 303", "ETHICS", "ECON 101", "ELECTIVE 1"] },
          semester2: { gwa: 1.28, credits: 20, status: "Dean's Lister", courses: ["ECE 304", "ECE 305", "ECE 306", "RESEARCH 1", "ELECTIVE 2", "ELECTIVE 3"] },
          yearEndGwa: 1.26,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.32, credits: 18, status: "Dean's Lister", courses: ["ECE 401", "ECE 402", "RESEARCH 2", "CAPSTONE 1", "ELECTIVE 4"] },
          semester2: { gwa: 1.28, credits: 15, status: "Dean's Lister", courses: ["ECE 403", "CAPSTONE 2", "INTERNSHIP", "SEMINAR"] },
          yearEndGwa: 1.30,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "2nd Year", achievement: "Circuit Design Competition Finalist" },
        { year: "3rd Year", achievement: "Electronics Engineering Excellence" },
        { year: "4th Year", achievement: "Outstanding Engineering Project" }
      ]
    },
    "Carlos Mendoza": {
      name: "Carlos Mendoza",
      studentId: "21-00087",
      program: "BSIT",
      graduationYear: 2022,
      finalGwa: 1.35,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.50, credits: 18, status: "Good Standing", courses: ["IT 101", "MATH 101", "ENG 101", "PE 101", "NSTP 101", "FIL 101"] },
          semester2: { gwa: 1.40, credits: 19, status: "Dean's Lister", courses: ["IT 102", "MATH 102", "ENG 102", "PE 102", "NSTP 102", "HIST 101"] },
          yearEndGwa: 1.45,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.38, credits: 20, status: "Dean's Lister", courses: ["IT 201", "IT 202", "MATH 201", "PHYS 101", "SCI 101", "HUM 101"] },
          semester2: { gwa: 1.30, credits: 21, status: "Dean's Lister", courses: ["IT 203", "IT 204", "STAT 101", "SOC 101", "RIZAL", "ELECTIVE"] },
          yearEndGwa: 1.34,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.32, credits: 22, status: "Dean's Lister", courses: ["IT 301", "IT 302", "ETHICS", "ECON 101", "ELECTIVE 1"] },
          semester2: { gwa: 1.30, credits: 20, status: "Dean's Lister", courses: ["IT 303", "IT 304", "RESEARCH 1", "ELECTIVE 2", "ELECTIVE 3"] },
          yearEndGwa: 1.31,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.38, credits: 18, status: "Dean's Lister", courses: ["IT 401", "RESEARCH 2", "CAPSTONE 1", "ELECTIVE 4"] },
          semester2: { gwa: 1.35, credits: 15, status: "Dean's Lister", courses: ["IT 402", "CAPSTONE 2", "INTERNSHIP", "SEMINAR"] },
          yearEndGwa: 1.37,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "3rd Year", achievement: "Best Capstone Concept" },
        { year: "4th Year", achievement: "Dean's Award for Leadership" }
      ]
    },
    "Emily Tan": {
      name: "Emily Tan",
      studentId: "21-00105",
      program: "BSCS",
      graduationYear: 2023,
      finalGwa: 1.20,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.25, credits: 18, status: "Dean's Lister", courses: ["CS 101", "MATH 101", "ENG 101", "PE 101", "NSTP 101", "FIL 101"] },
          semester2: { gwa: 1.18, credits: 20, status: "Dean's Lister", courses: ["CS 102", "MATH 102", "ENG 102", "PE 102", "NSTP 102", "HIST 101"] },
          yearEndGwa: 1.22,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.15, credits: 21, status: "Dean's Lister", courses: ["CS 201", "DSA", "STAT 101", "SCI 101", "HUM 101"] },
          semester2: { gwa: 1.10, credits: 22, status: "Dean's Lister", courses: ["CS 202", "OOP", "SOC 101", "RIZAL", "ELECTIVE"] },
          yearEndGwa: 1.13,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.18, credits: 22, status: "Dean's Lister", courses: ["CS 301", "OS", "DBMS", "ECON 101", "ELECTIVE 1"] },
          semester2: { gwa: 1.12, credits: 21, status: "Dean's Lister", courses: ["CS 302", "AI", "RESEARCH 1", "ELECTIVE 2"] },
          yearEndGwa: 1.15,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.22, credits: 20, status: "Dean's Lister", courses: ["CS 401", "RESEARCH 2", "CAPSTONE 1", "SEMINAR"] },
          semester2: { gwa: 1.18, credits: 15, status: "Dean's Lister", courses: ["CS 402", "CAPSTONE 2", "INTERNSHIP", "ETHICS"] },
          yearEndGwa: 1.20,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "2nd Year", achievement: "Top 1 in College of Computer Studies" },
        { year: "4th Year", achievement: "Best in Research Paper" }
      ]
    },
    "Jessica Lee": {
      name: "Jessica Lee",
      studentId: "21-00076",
      program: "BSIT",
      graduationYear: 2023,
      finalGwa: 1.60,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.70, credits: 18, status: "Good Standing", courses: ["IT 101", "MATH 101", "ENG 101", "PE 101", "NSTP 101"] },
          semester2: { gwa: 1.65, credits: 19, status: "Good Standing", courses: ["IT 102", "MATH 102", "ENG 102", "PE 102", "NSTP 102"] },
          yearEndGwa: 1.68,
          yearEndStatus: "Good Standing"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.55, credits: 20, status: "Good Standing", courses: ["IT 201", "IT 202", "PHYS 101", "FIL 101"] },
          semester2: { gwa: 1.50, credits: 20, status: "Dean's Lister", courses: ["IT 203", "IT 204", "RIZAL", "HIST 101"] },
          yearEndGwa: 1.53,
          yearEndStatus: "Good Standing"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.45, credits: 22, status: "Dean's Lister", courses: ["IT 301", "IT 302", "RESEARCH 1", "SOC 101"] },
          semester2: { gwa: 1.40, credits: 22, status: "Dean's Lister", courses: ["IT 303", "IT 304", "ELECTIVE 1", "ECON 101"] },
          yearEndGwa: 1.43,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.35, credits: 18, status: "Dean's Lister", courses: ["CAPSTONE 1", "IT 401", "ELECTIVE 2"] },
          semester2: { gwa: 1.30, credits: 18, status: "Dean's Lister", courses: ["CAPSTONE 2", "INTERNSHIP", "SEMINAR"] },
          yearEndGwa: 1.33,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "4th Year", achievement: "Capstone Project Excellence Award" }
      ]
    },
    "Lisa Garcia": {
      name: "Lisa Garcia",
      studentId: "21-00088",
      program: "BSCS",
      graduationYear: 2023,
      finalGwa: 1.48,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.50, credits: 18, status: "Good Standing", courses: ["CS 101", "ENG 101", "MATH 101", "PE 101", "NSTP 101", "FIL 101"] },
          semester2: { gwa: 1.45, credits: 19, status: "Dean's Lister", courses: ["CS 102", "ENG 102", "MATH 102", "PE 102", "NSTP 102", "HIST 101"] },
          yearEndGwa: 1.48,
          yearEndStatus: "Good Standing"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.42, credits: 20, status: "Dean's Lister", courses: ["CS 201", "DSA", "PHYS 101", "HUM 101"] },
          semester2: { gwa: 1.38, credits: 20, status: "Dean's Lister", courses: ["CS 202", "OOP", "STAT 101", "RIZAL", "SOC 101"] },
          yearEndGwa: 1.40,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.35, credits: 22, status: "Dean's Lister", courses: ["CS 301", "OS", "DBMS", "ELECTIVE 1"] },
          semester2: { gwa: 1.32, credits: 22, status: "Dean's Lister", courses: ["CS 302", "AI", "RESEARCH 1", "ECON 101"] },
          yearEndGwa: 1.34,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.38, credits: 20, status: "Dean's Lister", courses: ["CS 401", "RESEARCH 2", "CAPSTONE 1", "SEMINAR"] },
          semester2: { gwa: 1.40, credits: 15, status: "Dean's Lister", courses: ["CS 402", "CAPSTONE 2", "INTERNSHIP", "ETHICS"] },
          yearEndGwa: 1.39,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "3rd Year", achievement: "Academic Excellence Award" },
        { year: "4th Year", achievement: "Best Thesis Presentation" }
      ]
    },
    "Robert Kim": {
      name: "Robert Kim",
      studentId: "21-00112",
      program: "BSIT",
      graduationYear: 2022,
      finalGwa: 1.62,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.70, credits: 18, status: "Good Standing", courses: ["IT 101", "ENG 101", "MATH 101", "PE 101", "NSTP 101", "FIL 101"] },
          semester2: { gwa: 1.65, credits: 20, status: "Good Standing", courses: ["IT 102", "ENG 102", "MATH 102", "PE 102", "NSTP 102", "HIST 101"] },
          yearEndGwa: 1.68,
          yearEndStatus: "Good Standing"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.60, credits: 20, status: "Good Standing", courses: ["IT 201", "PHYS 101", "STAT 101", "SOC 101"] },
          semester2: { gwa: 1.55, credits: 22, status: "Good Standing", courses: ["IT 202", "RIZAL", "FIL 102", "SCI 101"] },
          yearEndGwa: 1.57,
          yearEndStatus: "Good Standing"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.52, credits: 22, status: "Good Standing", courses: ["IT 301", "IT 302", "RESEARCH 1", "ECON 101"] },
          semester2: { gwa: 1.48, credits: 21, status: "Dean's Lister", courses: ["IT 303", "IT 304", "ETHICS", "ELECTIVE 1"] },
          yearEndGwa: 1.50,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.45, credits: 20, status: "Dean's Lister", courses: ["CAPSTONE 1", "IT 401", "ELECTIVE 2"] },
          semester2: { gwa: 1.38, credits: 18, status: "Dean's Lister", courses: ["CAPSTONE 2", "INTERNSHIP", "SEMINAR"] },
          yearEndGwa: 1.42,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "4th Year", achievement: "Outstanding Capstone Project" }
      ]
    },
    "Sarah Johnson": {
      name: "Sarah Johnson",
      studentId: "21-00126",
      program: "BSCS",
      graduationYear: 2023,
      finalGwa: 1.18,
      yearlyProgress: [
        {
          year: "1st Year",
          semester1: { gwa: 1.25, credits: 18, status: "Dean's Lister", courses: ["CS 101", "ENG 101", "MATH 101", "PE 101", "NSTP 101", "FIL 101"] },
          semester2: { gwa: 1.20, credits: 20, status: "Dean's Lister", courses: ["CS 102", "ENG 102", "MATH 102", "PE 102", "NSTP 102", "HIST 101"] },
          yearEndGwa: 1.22,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "2nd Year",
          semester1: { gwa: 1.15, credits: 21, status: "Dean's Lister", courses: ["CS 201", "DSA", "PHYS 101", "HUM 101"] },
          semester2: { gwa: 1.10, credits: 22, status: "Dean's Lister", courses: ["CS 202", "OOP", "STAT 101", "SOC 101", "RIZAL"] },
          yearEndGwa: 1.13,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "3rd Year",
          semester1: { gwa: 1.12, credits: 22, status: "Dean's Lister", courses: ["CS 301", "OS", "DBMS", "ELECTIVE 1"] },
          semester2: { gwa: 1.08, credits: 21, status: "Dean's Lister", courses: ["CS 302", "AI", "RESEARCH 1", "ECON 101"] },
          yearEndGwa: 1.10,
          yearEndStatus: "Dean's Lister"
        },
        {
          year: "4th Year",
          semester1: { gwa: 1.12, credits: 20, status: "Dean's Lister", courses: ["CS 401", "RESEARCH 2", "CAPSTONE 1", "SEMINAR"] },
          semester2: { gwa: 1.10, credits: 15, status: "Dean's Lister", courses: ["CS 402", "CAPSTONE 2", "INTERNSHIP", "ETHICS"] },
          yearEndGwa: 1.11,
          yearEndStatus: "Dean's Lister"
        }
      ],
      achievements: [
        { year: "3rd Year", achievement: "Most Outstanding Student - CCS" },
        { year: "4th Year", achievement: "Best in Research Paper" }
      ]
    },
  };  
  
  return studentData[studentName] || null;
};

export default function AnalyticsGraduationTab() {
  const router = useRouter();
  
  // State for showing student progress
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showProgress, setShowProgress] = useState(false);
  
  // Handle row click to show student progress
  const handleStudentClick = (student: any) => {
    const studentData = getStudentProgress(student.name);
    if (studentData) {
      setSelectedStudent(studentData);
      setShowProgress(true);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle back to table view
  const handleBackToTable = () => {
    setShowProgress(false);
    setSelectedStudent(null);
  };
  
  // Helper functions for progress view
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "President's Lister":
        return "bg-yellow-100 text-yellow-800";
      case "Dean's Lister":
        return "bg-green-100 text-green-800";
      case "Good Standing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current > previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };
  
  // Interactive filter state
  const [course, setCourse] = useState("All Courses");
  const [department, setDepartment] = useState("All Departments");
  const [gender, setGender] = useState("All Genders");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showCount, setShowCount] = useState(5);

  // Mock gender for graduates (for demo)
  const graduatesWithGender = graduates.map((g, i) => ({ ...g, gender: i % 2 === 0 ? "Female" : "Male" }));

  // Filtered graduates
  const filteredGraduates = graduatesWithGender
    .filter(g =>
      (course === "All Courses" || g.program === course) &&
      (department === "All Departments" ||
        (department === "IT" && g.program === "BSIT") ||
        (department === "CS" && g.program === "BSCS") ||
        (department === "Engineering" && g.program === "BSECE") ||
        (department === "Business" && g.program === "BSA") ||
        (department === "Nursing" && g.program === "BSN")) &&
      (gender === "All Genders" || g.gender === gender) &&
      (searchTerm === "" || g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.program.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortField === "gwa") return direction * (a.gwa - b.gwa);
      if (sortField === "year") return direction * (a.year - b.year);
      if (sortField === "name") return direction * a.name.localeCompare(b.name);
      if (sortField === "program") return direction * a.program.localeCompare(b.program);
      return 0;
    });

  const displayedGraduates = filteredGraduates.slice(0, showCount);

  // Filtered graduationTrendsData (by course/program only)
  const filteredTrends = course === "All Courses"
    ? graduationTrendsData
    : graduationTrendsData.map(row => ({ year: row.year, [course]: row[course as ProgramKey] }));

  // Insights
  const totalGraduates = filteredGraduates.length;
  const avgGwa = totalGraduates > 0 ? (filteredGraduates.reduce((sum, g) => sum + g.gwa, 0) / totalGraduates).toFixed(2) : "-";
  const highestGwa = totalGraduates > 0 ? Math.min(...filteredGraduates.map(g => g.gwa)).toFixed(2) : "-";
  const lowestGwa = totalGraduates > 0 ? Math.max(...filteredGraduates.map(g => g.gwa)).toFixed(2) : "-";

  // Export handlers
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Graduation Rates Report", 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [["Year", "Program", "Graduation Rate (%)"]],
      body: graduationTrendsData.flatMap((row: GraduationTrendsRow) =>
        programKeys.map(program => [row.year, program, row[program]])
      ),
    });
    doc.save("graduation_rates_report.pdf");
  };
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      graduationTrendsData.flatMap((row: GraduationTrendsRow) =>
        programKeys.map(program => ({
          Year: row.year,
          Program: program,
          "Graduation Rate (%)": row[program],
        }))
      )
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Graduation Rates");
    XLSX.writeFile(wb, "graduation_rates_report.xlsx");
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Show student progress view if selected
  if (showProgress && selectedStudent) {
    // Prepare chart data for the selected student
    const gwaChartData = selectedStudent.yearlyProgress.map((year: any) => ({
      year: year.year,
      gwa: year.yearEndGwa,
      semester1: year.semester1.gwa,
      semester2: year.semester2.gwa
    }));

    const creditsChartData = selectedStudent.yearlyProgress.map((year: any) => ({
      year: year.year,
      credits: year.semester1.credits + year.semester2.credits
    }));

    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToTable}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{selectedStudent.name}</h2>
              <p className="text-gray-600 text-sm">
                {selectedStudent.studentId} • {selectedStudent.program} • Graduated {selectedStudent.graduationYear}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{selectedStudent.finalGwa.toFixed(2)}</div>
              <p className="text-sm text-gray-600">Final GWA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {selectedStudent.yearlyProgress.reduce((sum: number, year: any) => 
                  sum + year.semester1.credits + year.semester2.credits, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Credits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{selectedStudent.achievements.length}</div>
              <p className="text-sm text-gray-600">Achievements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">4</div>
              <p className="text-sm text-gray-600">Years Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* GWA Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>GWA Trend Over 4 Years</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[50vh] w-full">
              <ChartContainer config={{
                gwa: { label: "Year-end GWA", color: "#3b82f6" },
                semester1: { label: "1st Semester", color: "#10b981" },
                semester2: { label: "2nd Semester", color: "#f59e42" }
              }} className="h-[50vh] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gwaChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0.5, 2.0]} />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="gwa" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
                    <Line type="monotone" dataKey="semester1" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="semester2" stroke="#f59e42" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Credits Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Credits Earned Per Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[50vh] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="credits" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Year-by-Year Progress */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Academic Progress by Year</h3>
          {selectedStudent.yearlyProgress.map((year: any, index: number) => (
            <Card key={year.year} className="bg-white border rounded-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">{year.year}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeColor(year.yearEndStatus)}>
                      {year.yearEndStatus}
                    </Badge>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-lg">GWA: {year.yearEndGwa.toFixed(2)}</span>
                        {index > 0 && getTrendIcon(year.yearEndGwa, selectedStudent.yearlyProgress[index - 1].yearEndGwa)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Semester */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">1st Semester</h4>
                      <Badge className={getStatusBadgeColor(year.semester1.status)}>
                        {year.semester1.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">GWA:</span>
                        <span className="font-semibold ml-2">{year.semester1.gwa.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Credits:</span>
                        <span className="font-semibold ml-2">{year.semester1.credits}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Subjects:</p>
                      <div className="flex flex-wrap gap-1">
                        {year.semester1.courses.map((course: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Second Semester */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">2nd Semester</h4>
                      <Badge className={getStatusBadgeColor(year.semester2.status)}>
                        {year.semester2.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">GWA:</span>
                        <span className="font-semibold ml-2">{year.semester2.gwa.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Credits:</span>
                        <span className="font-semibold ml-2">{year.semester2.credits}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Subjects:</p>
                      <div className="flex flex-wrap gap-1">
                        {year.semester2.courses.map((course: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Year Achievements */}
                {selectedStudent.achievements.some((ach: any) => ach.year === year.year) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Achievement:</span>
                      <span className="text-sm text-gray-600">
                        {selectedStudent.achievements.find((ach: any) => ach.year === year.year)?.achievement}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Default graduation rates table view
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Graduation Rates</h2>
        <p className="text-gray-600 text-sm mb-4">Visualize graduation rates across programs and years. See detailed graduate information below to support institutional evaluation and planning.</p>
      </div>
      
      {/* Filters - Enhanced */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filters</h3>
        <div className="flex flex-wrap gap-4">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500" value={course} onChange={e => setCourse(e.target.value)}>
            <option>All Courses</option>
            <option>BSIT</option>
            <option>BSCS</option>
            <option>BSA</option>
            <option>BSECE</option>
            <option>BSN</option>
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500" value={department} onChange={e => setDepartment(e.target.value)}>
            <option>All Departments</option>
            <option>IT</option>
            <option>CS</option>
            <option>Engineering</option>
            <option>Business</option>
            <option>Nursing</option>
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500" value={gender} onChange={e => setGender(e.target.value)}>
            <option>All Genders</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold mb-2">Graduation Trends</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-medium shadow text-sm"
              >Export PDF</button>
            <button
              onClick={handleExportExcel}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium shadow text-sm"
              >Export Excel</button>
          </div>
        </div>
        {/* Graduation Trends Visualization */}
        <div className="h-full mb-10">
          <ChartContainer config={{
            BSIT: { label: "BSIT", color: "#3b82f6" },
            BSCS: { label: "BSCS", color: "#6366f1" },
            BSA: { label: "BSA", color: "#f59e42" },
            BSECE: { label: "BSECE", color: "#10b981" },
            BSN: { label: "BSN", color: "#ef4444" },
          }} className="h-[50vh] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredTrends} margin={{ top: 30, right: 40, left: 40, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 14, fill: "#374151" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 14, fill: "#374151" }} tickCount={6} />
                <ChartTooltip />
                <ChartLegend wrapperStyle={{ fontSize: 16 }} />
                {course === "All Courses"
                  ? programKeys.map(key => (
                      <Line key={key} type="monotone" dataKey={key} stroke={
                        key === "BSIT" ? "#3b82f6" :
                        key === "BSCS" ? "#6366f1" :
                        key === "BSA" ? "#f59e42" :
                        key === "BSECE" ? "#10b981" :
                        "#ef4444"
                      } strokeWidth={4} dot={{ r: 6 }} />
                    ))
                  : <Line type="monotone" dataKey={course} stroke="#3b82f6" strokeWidth={4} dot={{ r: 6 }} />}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        {/* Graduates Table */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h4 className="font-semibold text-gray-900">Graduate Details</h4>
              <span className="text-sm text-gray-500">({filteredGraduates.length} results)</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search graduates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                    Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("program")}>
                    Program {sortField === "program" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("year")}>
                    Graduation Year {sortField === "year" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("gwa")}>
                    GWA {sortField === "gwa" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Gender</th>
                </tr>
              </thead>
              <tbody>
                {displayedGraduates.map((student, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      handleStudentClick(student);
                      scrollToTop();
                    }}
                    title="Click to view detailed academic progress"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{student.program}</td>
                    <td className="px-4 py-3 text-center">{student.year}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${student.gwa <= 1.25 ? 'text-green-700' : student.gwa <= 1.75 ? 'text-blue-700' : 'text-gray-700'}`}>
                        {student.gwa.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{student.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Show More Button */}
          {filteredGraduates.length > showCount && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowCount(showCount + 5)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-md text-sm font-medium"
              >
                Show More ({filteredGraduates.length - showCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
