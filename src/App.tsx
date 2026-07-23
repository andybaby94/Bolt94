import { useState } from 'react'
import { Student } from './types'
import Dashboard from './components/Dashboard'
import StudentList from './components/StudentList'
import StudentForm from './components/StudentForm'
import IncidentList from './components/IncidentList'
import {
  LayoutDashboard, Users, FileText, Shield, UserPlus,
} from 'lucide-react'

type Tab = 'dashboard' | 'students' | 'incidents'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [studentListKey, setStudentListKey] = useState(0)

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setShowStudentForm(true)
  }

  const handleAddStudent = () => {
    setEditingStudent(null)
    setShowStudentForm(true)
  }

  const handleStudentSaved = () => {
    setStudentListKey((k) => k + 1)
  }

  const navItems = [
    { id: 'dashboard' as Tab, label: '대시보드', icon: LayoutDashboard },
    { id: 'students' as Tab, label: '학생조회', icon: Users },
    { id: 'incidents' as Tab, label: '사건기록', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">학생안전관리시스템</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Student Safety Management</p>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === item.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'students' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleAddStudent}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                학생 추가
              </button>
            </div>
            <StudentList key={studentListKey} onEdit={handleEditStudent} />
          </div>
        )}
        {tab === 'incidents' && <IncidentList />}
      </main>

      {showStudentForm && (
        <StudentForm
          student={editingStudent}
          onClose={() => {
            setShowStudentForm(false)
            setEditingStudent(null)
          }}
          onSaved={handleStudentSaved}
        />
      )}
    </div>
  )
}
