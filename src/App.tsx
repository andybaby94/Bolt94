import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import IncidentRecord from './pages/IncidentRecord'
import StudentLookup from './pages/StudentLookup'
import StudentDetail from './pages/StudentDetail'
import IncidentDetail from './pages/IncidentDetail'
import AllIncidents from './pages/AllIncidents'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/incidents/new" element={<IncidentRecord />} />
        <Route path="/incidents/all" element={<AllIncidents />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/students" element={<StudentLookup />} />
        <Route path="/students/:id" element={<StudentDetail />} />
      </Routes>
    </Layout>
  )
}
