import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from 'react-helmet-async';

import LandingPage from "@/pages/LandingPage";
import StaffLogin from "@/pages/StaffLogin";
import StudentLogin from "@/pages/StudentLogin"; 
import StudentDashboard from "@/pages/StudentDashboard";

// Admin Dashboards
import ProprietorDashboard from "@/pages/ProprietorDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import PrincipalDashboard from "@/pages/PrincipalDashboard";
import HeadTeacherDashboard from "@/pages/HeadTeacherDashboard";
import BursarDashboard from "@/pages/BursarDashboard"; // <--- Newly added

import NotFound from "@/pages/NotFound";

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/staff-login" element={<StaffLogin />} />
          <Route path="/student-login" element={<StudentLogin />} />

          {/* Student Area */}
          <Route path="/student-dashboard" element={<StudentDashboard />} />

          {/* Staff Areas */}
          <Route path="/proprietor-dashboard" element={<ProprietorDashboard />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/principal-dashboard" element={<PrincipalDashboard />} />
          <Route path="/head-teacher-dashboard" element={<HeadTeacherDashboard />} />
          <Route path="/bursar-dashboard" element={<BursarDashboard />} /> {/* <--- New Route */}

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </HelmetProvider>
  );
}

export default App;