"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Settings, ChevronRight, Files } from "lucide-react"
import { OHIFViewer } from "@/components/ohif-viewer"

interface Study {
  id: string
  patientName: string
  mrn: string
  studyDate: string
  studyTime: string
  description: string
  modality: string
  accessionNumber: string
  instances: number
}

const mockStudies: Study[] = [
  {
    id: "1",
    patientName: "Structured Reports",
    mrn: "PID_SR",
    studyDate: "Jan-01-2024",
    studyTime: "09:42 AM",
    description: "CT\\MR\\CR\\US\\DX\\...",
    modality: "CT\\MR\\CR\\US\\DX\\...",
    accessionNumber: "AN_SR",
    instances: 27,
  },
  {
    id: "2",
    patientName: "CTA Head and Neck",
    mrn: "NEW_PATIENT_ID",
    studyDate: "May-11-2023",
    studyTime: "01:14 PM",
    description: "CT NECK SOFT TISSUE W/ ...",
    modality: "CT",
    accessionNumber: "",
    instances: 295,
  },
  {
    id: "3",
    patientName: "Anonymous",
    mrn: "AVSUHP",
    studyDate: "Apr-03-2023",
    studyTime: "09:13 AM",
    description: "",
    modality: "CT",
    accessionNumber: "",
    instances: 112,
  },
  {
    id: "4",
    patientName: "DATSCAN1",
    mrn: "DATSCAN1",
    studyDate: "Nov-21-2022",
    studyTime: "02:05 PM",
    description: "CERVEAU DATSCAN",
    modality: "NM",
    accessionNumber: "OrthancToolsJS",
    instances: 5,
  },
  {
    id: "5",
    patientName: "SIIM, Thierry",
    mrn: "Thierry_cbct_teeth...",
    studyDate: "Oct-15-2022",
    studyTime: "",
    description: "3D examination",
    modality: "CT\\OT\\SM",
    accessionNumber: "a500955200890173",
    instances: 402,
  },
  {
    id: "6",
    patientName: "M1",
    mrn: "M1",
    studyDate: "Sep-15-2022",
    studyTime: "10:55 AM",
    description: "General Static Scan + CT",
    modality: "CT\\PT",
    accessionNumber: "",
    instances: 10163,
  },
  {
    id: "7",
    patientName: "Test, Röntgen",
    mrn: "20210922-01-0001",
    studyDate: "Sep-22-2021",
    studyTime: "04:21 PM",
    description: "Thorax (kl.)",
    modality: "DX",
    accessionNumber: "",
    instances: 1,
  },
  {
    id: "8",
    patientName: "SIIM, Jessica",
    mrn: "opth-001",
    studyDate: "May-27-2021",
    studyTime: "02:37 PM",
    description: "",
    modality: "OP\\SM",
    accessionNumber: "",
    instances: 17,
  },
  {
    id: "9",
    patientName: "FOR TEST",
    mrn: "QIPCM123",
    studyDate: "Apr-28-2021",
    studyTime: "08:24 AM",
    description: "",
    modality: "CT\\PT",
    accessionNumber: "",
    instances: 436,
  },
  {
    id: "10",
    patientName: "Water Phantom",
    mrn: "20200923I",
    studyDate: "Sep-23-2020",
    studyTime: "11:11 AM",
    description: "Uniformity",
    modality: "CT\\PT\\RT\\STRUCT",
    accessionNumber: "",
    instances: 218,
  },
]

export function StudyList() {
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [patientNameFilter, setPatientNameFilter] = useState("")
  const [mrnFilter, setMrnFilter] = useState("")
  const [descriptionFilter, setDescriptionFilter] = useState("")
  const [accessionFilter, setAccessionFilter] = useState("")

  if (selectedStudy) {
    return <OHIFViewer study={selectedStudy} onBack={() => setSelectedStudy(null)} />
  }

  const filteredStudies = mockStudies.filter((study) => {
    return (
      study.patientName.toLowerCase().includes(patientNameFilter.toLowerCase()) &&
      study.mrn.toLowerCase().includes(mrnFilter.toLowerCase()) &&
      study.description.toLowerCase().includes(descriptionFilter.toLowerCase()) &&
      study.accessionNumber.toLowerCase().includes(accessionFilter.toLowerCase())
    )
  })

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm"></div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Open Health</div>
            <div className="text-slate-400 text-xs">Imaging Foundation</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Study List Header */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-semibold">Study List</h1>
        <div className="text-blue-400 text-lg">{filteredStudies.length} Studies</div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Patient Name</label>
            <Input
              value={patientNameFilter}
              onChange={(e) => setPatientNameFilter(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">MRN</label>
            <Input
              value={mrnFilter}
              onChange={(e) => setMrnFilter(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Study Date</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Start date"
                />
                <Calendar className="absolute right-2 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              <div className="relative flex-1">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="End date"
                />
                <Calendar className="absolute right-2 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <Input
              value={descriptionFilter}
              onChange={(e) => setDescriptionFilter(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Modality</label>
            <Select>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ct">CT</SelectItem>
                <SelectItem value="mr">MR</SelectItem>
                <SelectItem value="dx">DX</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Accession #</label>
            <Input
              value={accessionFilter}
              onChange={(e) => setAccessionFilter(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4">
        <div className="grid grid-cols-7 gap-4 py-3 border-b border-slate-700 text-sm text-slate-300">
          <div className="flex items-center gap-1">
            Patient Name
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
          <div className="flex items-center gap-1">
            MRN
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
          <div className="flex items-center gap-1">
            Study Date
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
          <div className="flex items-center gap-1">
            Description
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
          <div className="flex items-center gap-1">
            Modality
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
          <div className="flex items-center gap-1">
            Accession #
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
          <div>Instances</div>
        </div>

        {/* Table Rows */}
        <div className="space-y-0">
          {filteredStudies.map((study) => (
            <div
              key={study.id}
              className="grid grid-cols-7 gap-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer group"
              onClick={() => setSelectedStudy(study)}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-slate-500" />
                <span className="text-white">{study.patientName}</span>
              </div>
              <div className="text-slate-300">{study.mrn}</div>
              <div className="text-slate-300">
                {study.studyDate} {study.studyTime}
              </div>
              <div className="text-slate-300 truncate">{study.description}</div>
              <div className="text-slate-300">{study.modality}</div>
              <div className="text-slate-300">{study.accessionNumber}</div>
              <div className="flex items-center gap-2">
                <Files className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400">{study.instances}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Notice */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <div>
              <div className="text-white font-medium">
                OHIF Viewer is <span className="text-blue-400">for investigational use only</span>
              </div>
              <div className="text-blue-400 text-sm cursor-pointer hover:underline">Learn more about OHIF Viewer</div>
            </div>
          </div>
          <Button variant="outline" className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700">
            Confirm and hide
          </Button>
        </div>
      </div>
    </div>
  )
}
