import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { AllIncidents } from '@/pages/AllIncidents';
import { IncidentDetail } from '@/pages/IncidentDetail';
import { NewIncident } from '@/pages/NewIncident';
import { EditIncident } from '@/pages/EditIncident';
import { StudentList } from '@/pages/StudentList';
import { StudentDetail } from '@/pages/StudentDetail';
import { IncidentNotice } from '@/pages/IncidentNotice';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/incidents" element={<AllIncidents />} />
        <Route path="/incidents/new" element={<NewIncident />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/incidents/:id/edit" element={<EditIncident />} />
        <Route path="/incidents/:id/notice" element={<IncidentNotice />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/:id" element={<StudentDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
