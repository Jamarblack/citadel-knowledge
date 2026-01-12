import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, FileText, LogOut, BookOpen, Award, Calendar } from "lucide-react";
import schoolLogo from "@/assets/school-logo.png";
import studentPassport from "@/assets/student-passport.jpg";

// Mock student data
const studentData = {
  name: "Adebayo Oluwaseun",
  studentId: "STU/2024/0142",
  class: "SS3 Science",
  admissionYear: "2021",
  guardian: "Mr. & Mrs. Adebayo",
  email: "adebayo.o@student.citadel.edu"
};

// Mock results data
const resultsData = [
  { subject: "Mathematics", ca1: 18, ca2: 17, exam: 52, total: 87, grade: "A" },
  { subject: "English Language", ca1: 16, ca2: 18, exam: 48, total: 82, grade: "A" },
  { subject: "Physics", ca1: 17, ca2: 16, exam: 45, total: 78, grade: "B" },
  { subject: "Chemistry", ca1: 15, ca2: 17, exam: 50, total: 82, grade: "A" },
  { subject: "Biology", ca1: 18, ca2: 19, exam: 55, total: 92, grade: "A" },
  { subject: "Further Mathematics", ca1: 14, ca2: 15, exam: 42, total: 71, grade: "B" },
  { subject: "Civic Education", ca1: 19, ca2: 18, exam: 52, total: 89, grade: "A" },
  { subject: "Data Processing", ca1: 17, ca2: 18, exam: 48, total: 83, grade: "A" },
];

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "A": return "text-green-600 bg-green-100";
    case "B": return "text-blue-600 bg-blue-100";
    case "C": return "text-yellow-600 bg-yellow-100";
    case "D": return "text-orange-600 bg-orange-100";
    default: return "text-red-600 bg-red-100";
  }
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "results">("profile");

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-secondary text-secondary-foreground p-6 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <img src={schoolLogo} alt="Logo" className="w-12 h-12" />
          <div>
            <h1 className="font-heading font-bold text-sm">Citadel of Knowledge</h1>
            <p className="text-xs text-secondary-foreground/70">Student Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "profile" ? "bg-gold text-secondary font-semibold" : "hover:bg-secondary-foreground/10"}`}
          >
            <User size={20} />
            My Profile
          </button>
          <button 
            onClick={() => setActiveTab("results")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "results" ? "bg-gold text-secondary font-semibold" : "hover:bg-secondary-foreground/10"}`}
          >
            <FileText size={20} />
            View Results
          </button>
        </nav>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-secondary text-secondary-foreground p-4 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={schoolLogo} alt="Logo" className="w-10 h-10" />
            <span className="font-heading font-bold text-sm">Student Portal</span>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-secondary-foreground/10 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "profile" ? "bg-gold text-secondary" : "bg-secondary-foreground/10"}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab("results")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "results" ? "bg-gold text-secondary" : "bg-secondary-foreground/10"}`}
          >
            Results
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="lg:ml-64 pt-32 lg:pt-8 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-secondary mb-2">
              Welcome, {studentData.name.split(" ")[0]}! 👋
            </h1>
            <p className="text-muted-foreground">
              {activeTab === "profile" ? "View and manage your student profile" : "View your academic performance"}
            </p>
          </div>
          
          {activeTab === "profile" ? (
            <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
              {/* Profile Card */}
              <div className="md:col-span-2 card-elegant p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <img 
                    src={studentPassport} 
                    alt="Student Passport" 
                    className="w-24 h-28 rounded-lg object-cover border-2 border-gold shadow-md"
                  />
                  <div>
                    <h2 className="font-heading text-xl font-bold text-secondary">{studentData.name}</h2>
                    <p className="text-muted-foreground">{studentData.studentId}</p>
                    <span className="inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">Active Student</span>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Class</p>
                    <p className="font-semibold text-foreground">{studentData.class}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Admission Year</p>
                    <p className="font-semibold text-foreground">{studentData.admissionYear}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Guardian</p>
                    <p className="font-semibold text-foreground">{studentData.guardian}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-semibold text-foreground text-sm">{studentData.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="card-elegant p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Award size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">83%</p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                </div>
                <div className="card-elegant p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BookOpen size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">8</p>
                    <p className="text-sm text-muted-foreground">Subjects</p>
                  </div>
                </div>
                <div className="card-elegant p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                    <Calendar size={24} className="text-gold-dark" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">2nd</p>
                    <p className="text-sm text-muted-foreground">Term 2024/2025</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Results Header */}
              <div className="card-elegant p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-secondary">Academic Report Card</h2>
                    <p className="text-muted-foreground text-sm">Second Term, 2024/2025 Academic Session</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Class Position</p>
                    <p className="text-2xl font-bold text-primary">3rd / 45</p>
                  </div>
                </div>
              </div>
              
              {/* Results Table */}
              <div className="card-elegant overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="text-left p-4">Subject</th>
                        <th className="text-center p-4">CA1 (20)</th>
                        <th className="text-center p-4">CA2 (20)</th>
                        <th className="text-center p-4">Exam (60)</th>
                        <th className="text-center p-4">Total (100)</th>
                        <th className="text-center p-4">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsData.map((result, index) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="p-4 font-medium">{result.subject}</td>
                          <td className="p-4 text-center">{result.ca1}</td>
                          <td className="p-4 text-center">{result.ca2}</td>
                          <td className="p-4 text-center">{result.exam}</td>
                          <td className="p-4 text-center font-semibold">{result.total}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(result.grade)}`}>
                              {result.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted">
                      <tr>
                        <td className="p-4 font-bold" colSpan={4}>Overall Average</td>
                        <td className="p-4 text-center font-bold text-primary text-lg">83%</td>
                        <td className="p-4 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-green-600 bg-green-100">A</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              {/* Teacher's Remark */}
              <div className="card-elegant p-6 mt-6">
                <h3 className="font-heading font-semibold text-secondary mb-2">Class Teacher's Remark</h3>
                <p className="text-muted-foreground italic">
                  "An excellent student with consistent academic performance. Shows great leadership qualities and participates actively in class. Keep up the good work!"
                </p>
                <p className="text-right text-sm text-muted-foreground mt-3">— Mrs. Afolabi (Class Teacher)</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
