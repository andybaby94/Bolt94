import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { NewIncident } from '@/pages/NewIncident';
import { IncidentDetail } from '@/pages/IncidentDetail';
import { StudentList } from '@/pages/StudentList';
import { StudentDetail } from '@/pages/StudentDetail';
import { GuardianNotice } from '@/pages/GuardianNotice';

function Header() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-2xl px-4 py-3">
        <button
          onClick={() => navigate('/')}
          className="text-base font-bold text-gray-800"
        >
          학생 생활안전 관리 시스템
        </button>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/incidents/new" element={<NewIncident />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/incidents/:id/notice" element={<GuardianNotice />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/:id" element={<StudentDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
