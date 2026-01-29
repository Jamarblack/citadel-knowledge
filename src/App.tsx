import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
// Import Pages
import LandingPage from "@/pages/LandingPage"; // <--- Import the new page
import StaffLogin from "@/pages/StaffLogin";
import ProprietorDashboard from "@/pages/ProprietorDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import PrincipalDashboard from "@/pages/PrincipalDashboard";
import HeadTeacherDashboard from "@/pages/HeadTeacherDashboard";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />  {/* <--- Default is now Landing Page */}
        <Route path="/staff-login" element={<StaffLogin />} />

        {/* Protected Dashboard Routes */}
        <Route path="/proprietor-dashboard" element={<ProprietorDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/principal-dashboard" element={<PrincipalDashboard />} />
        <Route path="/head-teacher-dashboard" element={<HeadTeacherDashboard />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;