import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { NewIncident } from '@/pages/NewIncident';
import { EditIncident } from '@/pages/EditIncident';
import { IncidentDetail } from '@/pages/IncidentDetail';
import { StudentList } from '@/pages/StudentList';
import { StudentDetail } from '@/pages/StudentDetail';
import { StudentForm } from '@/pages/StudentForm';
import { GuardianNotice } from '@/pages/GuardianNotice';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents/new" element={<NewIncident />} />
        <Route path="/incidents/:id/edit" element={<EditIncident />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/incidents/:id/notice" element={<GuardianNotice />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/new" element={<StudentForm />} />
        <Route path="/students/:id/edit" element={<StudentForm />} />
        <Route path="/students/:id" element={<StudentDetail />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
