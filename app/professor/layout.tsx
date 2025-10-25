import type { Metadata } from "next"
import "@/app/styles/professor.css"
import { LayoutWrapper } from "@/app/professor/layoutWrapper"

export const metadata: Metadata = {
  title: "PLP Academic Management",
  description: "Academic grading and performance monitoring system for professors",
}

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>
}
