import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Download, Plus, ArrowUpDown } from "lucide-react"

const subjects = [
  {
    code: "COMP 101",
    name: "Introduction to Computing",
    courseProgram: "BSIT",
    assignedProfessor: "Prof. Dawn Bernadette Menor, MSIT",
    yearSemester: "1st year & 1st semester",
    subjectType: "Major/Laboratory and Major/ Lecture",
    units: 3,
    prerequisites: "None",
    status: "Active",
  },
  {
    code: "COMP 102",
    name: "Fundamentals of Programming (C++)",
    courseProgram: "BSIT, BSCS, BSA, BSBA, BSECE",
    assignedProfessor: "Prof. Juanito Alvarez Jr., MIT",
    yearSemester: "1st year & 1st semester",
    subjectType: "Minor/Laboratory and Minor/ Lecture",
    units: 3,
    prerequisites: "None",
    status: "Active",
  },
  {
    code: "IT 101",
    name: "Discrete Mathematics",
    courseProgram: "BSIT",
    assignedProfessor: "Dr. Laura Altea",
    yearSemester: "1st year & 2nd semester",
    subjectType: "Major/Laboratory and Major/ Lecture",
    units: 3,
    prerequisites: "None",
    status: "Active",
  },
  {
    code: "IT 102",
    name: "Quantitative Methods",
    courseProgram: "BSIT",
    assignedProfessor: "Prof. Fr",
    yearSemester: "142 units",
    subjectType: "8 subjects",
    units: 215,
    prerequisites: "215 students",
    status: "Active",
  },
  {
    code: "CA 5101",
    name: "Financial Accounting and Reporting",
    courseProgram: "BSA",
    assignedProfessor: "Prof. Mariel Reyes, CPA",
    yearSemester: "1st year & 1st semester",
    subjectType: "Major/Lecture",
    units: 6,
    prerequisites: "None",
    status: "Active",
  },
  {
    code: "BLW063",
    name: "Business Law (Obligations and Contracts)",
    courseProgram: "BSBA",
    assignedProfessor: "Atty. Carlos Dela Cruz",
    yearSemester: "1st year & 1st semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "None",
    status: "Active",
  },
  {
    code: "ECE 2118",
    name: "Electric Circuit Theory 1",
    courseProgram: "BSECE",
    assignedProfessor: "Engr. Marlon Perez",
    yearSemester: "2nd year & 2nd semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "ECE 2111",
    status: "Active",
  },
  {
    code: "NCM100-18",
    name: "Theoretical Foundations in Nursing",
    courseProgram: "BSN",
    assignedProfessor: "Prof. Angelica Torres, RN, MAN",
    yearSemester: "1st year & 1st semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "None",
    status: "Active",
  },
  {
    code: "CA 5105",
    name: "Intermediate Accounting 1",
    courseProgram: "BSA",
    assignedProfessor: "Prof. Kristine Bautista, CPA",
    yearSemester: "1st year & 2nd semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "CA 5101",
    status: "Active",
  },
  {
    code: "CA 51014",
    name: "Strategic Cost Management",
    courseProgram: "BSA",
    assignedProfessor: "Prof. Regine Villanueva, CPA",
    yearSemester: "2nd year & 1st semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "CA 5107",
    status: "Active",
  },

  // More from BSBA
  {
    code: "MKMT013",
    name: "Consumer Behavior",
    courseProgram: "BSBA",
    assignedProfessor: "Prof. Patricia Lim",
    yearSemester: "1st year & 2nd semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "None",
    status: "Active",
  },
  {
    code: "MKMT063",
    name: "Strategic Marketing Management",
    courseProgram: "BSBA",
    assignedProfessor: "Dr. Jeremy Ramos",
    yearSemester: "4th year & 1st semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "MKMT053, MKMT103, MNGT253",
    status: "Active",
  },

  // More from BSECE
  {
    code: "ECE 21115",
    name: "Electronic Circuit Analysis and Design",
    courseProgram: "BSECE",
    assignedProfessor: "Engr. Kristoffer Dela Rosa",
    yearSemester: "3rd year & 1st semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "ECE 2119",
    status: "Active",
  },
  {
    code: "ECE 21129",
    name: "Transmission Media Antenna Systems and Design",
    courseProgram: "BSECE",
    assignedProfessor: "Engr. Louie Fernandez",
    yearSemester: "4th year & 1st semester",
    subjectType: "Major/Lecture",
    units: 3,
    prerequisites: "ECE 21119",
    status: "Active",
  },

  // More from BSN
  {
    code: "NCM109-18",
    name: "Care of Mother and Child at Risk or With Problems",
    courseProgram: "BSN",
    assignedProfessor: "Prof. Melissa Javier, RN",
    yearSemester: "2nd year & 2nd semester",
    subjectType: "Major/Lecture",
    units: 6,
    prerequisites: "NCM107-18, RLE107-18",
    status: "Active",
  },
  {
    code: "NCM118-18",
    name: "Nursing Care of Clients with Life-Threatening Conditions",
    courseProgram: "BSN",
    assignedProfessor: "Prof. Rochelle Santos, RN, MAN",
    yearSemester: "4th year & 1st semester",
    subjectType: "Major/Lecture",
    units: 4,
    prerequisites: "NCM117-18, RLE117-18",
    status: "Active",
  },
]

export default function SubjectPage() {
  return (
    <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] transition-colors">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Subject Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400 font-light">Manage academic courses and students enrollment</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-white border-none text-[var(--customized-color-one)] hover:bg-green-50 dark:bg-black dark:text-white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)]">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search subject..." className="pl-10" />
        </div>
        <Select defaultValue="all-department">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-department">All Department</SelectItem>
            <SelectItem value="computer-studies">College of Computer and Studies</SelectItem>
            <SelectItem value="engineering">College of Engineering</SelectItem>
            <SelectItem value="business">College of Business and Accountancy</SelectItem>
            <SelectItem value="education">College of Education</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-status">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-status">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" className="flex items-center gap-2">
          Sort by
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-2 font-bold text-gray-700">Subject</th>
                <th className="text-left p-2 font-bold text-gray-700">Course Program</th>
                <th className="text-left p-2 font-bold text-gray-700">Assigned Professor</th>
                <th className="text-left p-2 font-bold text-gray-700">Year & Semester</th>
                <th className="text-left p-2 font-bold text-gray-700">Subject Type</th>
                <th className="text-left p-2 font-bold text-gray-700">Units</th>
                <th className="text-left p-2 font-bold text-gray-700">Prerequisites</th>
                <th className="text-left p-2 font-bold text-gray-700">Status</th>
                <th className="text-left p-2 font-bold text-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div>
                      <p className="font-medium text-gray-900">{subject.code}</p>
                      <p className="text-xs text-gray-600">{subject.name}</p>
                    </div>
                  </td>
                  <td className="p-2 text-black text-xs">{subject.courseProgram}</td>
                  <td className="p-2 text-black text-xs">{subject.assignedProfessor}</td>
                  <td className="p-2 text-black text-xs">{subject.yearSemester}</td>
                  <td className="p-2 text-black text-xs">{subject.subjectType}</td>
                  <td className="p-2 text-black text-xs">{subject.units}</td>
                  <td className="p-2 text-black text-xs">{subject.prerequisites}</td>
                  <td className="p-4">
                    <Badge
                      variant={subject.status === "Active" ? "default" : "destructive"}
                      className={
                        subject.status === "Active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {subject.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">Showing 1 to 10 of 500 subjects</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Page 1 of 50</span>
            <Button variant="outline" size="sm">
              First
            </Button>
            <Button variant="outline" size="sm">
              {"<"}
            </Button>
            <Button variant="default" size="sm" className="bg-green-700">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              4
            </Button>
            <Button variant="outline" size="sm">
              5
            </Button>
            <Button variant="outline" size="sm">
              6
            </Button>
            <Button variant="outline" size="sm">
              7
            </Button>
            <Button variant="outline" size="sm">
              {">"}
            </Button>
            <Button variant="outline" size="sm">
              Last
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}