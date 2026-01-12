import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileEdit, LogOut, Save, Check } from "lucide-react";
import schoolLogo from "@/assets/school-logo.png";
import { toast } from "sonner";

// Mock classes data
const classesData = [
  { id: "jss1", name: "JSS 1" },
  { id: "jss2", name: "JSS 2" },
  { id: "jss3", name: "JSS 3" },
  { id: "ss1", name: "SS 1 (Science)" },
  { id: "ss2", name: "SS 2 (Science)" },
  { id: "ss3", name: "SS 3 (Science)" },
];

// Mock students with editable scores
const initialStudents = [
  { id: 1, name: "Adebayo Oluwaseun", ca1: 18, ca2: 17, exam: 52 },
  { id: 2, name: "Chukwu Chiamaka", ca1: 15, ca2: 16, exam: 48 },
  { id: 3, name: "Ibrahim Fatima", ca1: 19, ca2: 18, exam: 55 },
  { id: 4, name: "Okonkwo Chidera", ca1: 14, ca2: 15, exam: 42 },
  { id: 5, name: "Bello Aisha", ca1: 17, ca2: 18, exam: 50 },
  { id: 6, name: "Eze Emmanuel", ca1: 16, ca2: 17, exam: 46 },
  { id: 7, name: "Adeleke Toluwani", ca1: 20, ca2: 19, exam: 58 },
  { id: 8, name: "Musa Abdullahi", ca1: 13, ca2: 14, exam: 38 },
];

type Student = typeof initialStudents[0];

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  const handleScoreChange = (studentId: number, field: "ca1" | "ca2" | "exam", value: string) => {
    const numValue = parseInt(value) || 0;
    const maxValue = field === "exam" ? 60 : 20;
    const clampedValue = Math.min(Math.max(0, numValue), maxValue);
    
    setStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, [field]: clampedValue } : s)
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Results saved successfully!", {
        description: `${selectedSubject} scores for ${classesData.find(c => c.id === selectedClass)?.name} have been updated.`
      });
    }, 1000);
  };

  const getTotal = (student: Student) => student.ca1 + student.ca2 + student.exam;
  
  const getGrade = (total: number) => {
    if (total >= 75) return "A";
    if (total >= 65) return "B";
    if (total >= 55) return "C";
    if (total >= 45) return "D";
    return "F";
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-600 bg-green-100";
      case "B": return "text-blue-600 bg-blue-100";
      case "C": return "text-yellow-600 bg-yellow-100";
      case "D": return "text-orange-600 bg-orange-100";
      default: return "text-red-600 bg-red-100";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-secondary text-secondary-foreground p-6 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <img src={schoolLogo} alt="Logo" className="w-12 h-12" />
          <div>
            <h1 className="font-heading font-bold text-sm">Citadel of Knowledge</h1>
            <p className="text-xs text-secondary-foreground/70">Staff Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gold text-secondary font-semibold">
            <FileEdit size={20} />
            Record Results
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary-foreground/10 transition-colors">
            <Users size={20} />
            Manage Students
          </button>
        </nav>
        
        <div className="p-4 rounded-xl bg-secondary-foreground/10 mb-6">
          <p className="text-sm text-secondary-foreground/70 mb-1">Logged in as:</p>
          <p className="font-semibold">Mrs. Adeyemi Grace</p>
          <p className="text-xs text-secondary-foreground/60">Mathematics Teacher</p>
        </div>
        
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
            <span className="font-heading font-bold text-sm">Staff Portal</span>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-secondary-foreground/10 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="lg:ml-64 pt-20 lg:pt-8 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-secondary mb-2">
              Record Student Results
            </h1>
            <p className="text-muted-foreground">
              Select a class and subject to enter or update student scores
            </p>
          </div>
          
          {/* Filters */}
          <div className="card-elegant p-6 mb-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Academic Session</label>
                <select className="input-field">
                  <option>2024/2025</option>
                  <option>2023/2024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Term</label>
                <select className="input-field">
                  <option>Second Term</option>
                  <option>First Term</option>
                  <option>Third Term</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Class</label>
                <select 
                  className="input-field"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Select Class</option>
                  {classesData.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <select 
                  className="input-field"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option>Mathematics</option>
                  <option>English Language</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Results Table */}
          {selectedClass ? (
            <div className="card-elegant overflow-hidden animate-fade-in">
              <div className="p-4 bg-muted border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-semibold text-secondary">
                    {classesData.find(c => c.id === selectedClass)?.name} - {selectedSubject}
                  </h3>
                  <p className="text-sm text-muted-foreground">{students.length} students</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-hero inline-flex items-center gap-2 py-2 px-6 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Results
                    </>
                  )}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="text-left p-4 w-8">#</th>
                      <th className="text-left p-4">Student Name</th>
                      <th className="text-center p-4 w-24">CA1 (20)</th>
                      <th className="text-center p-4 w-24">CA2 (20)</th>
                      <th className="text-center p-4 w-24">Exam (60)</th>
                      <th className="text-center p-4 w-24">Total</th>
                      <th className="text-center p-4 w-20">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const total = getTotal(student);
                      const grade = getGrade(total);
                      return (
                        <tr key={student.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="p-4 text-muted-foreground">{index + 1}</td>
                          <td className="p-4 font-medium">{student.name}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={student.ca1}
                              onChange={(e) => handleScoreChange(student.id, "ca1", e.target.value)}
                              className="w-full text-center p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={student.ca2}
                              onChange={(e) => handleScoreChange(student.id, "ca2", e.target.value)}
                              className="w-full text-center p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={student.exam}
                              onChange={(e) => handleScoreChange(student.id, "exam", e.target.value)}
                              className="w-full text-center p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                          </td>
                          <td className="p-4 text-center font-bold text-lg">{total}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(grade)}`}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card-elegant p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                <FileEdit size={40} className="text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-secondary mb-2">
                Select a Class to Begin
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose an academic session, term, class, and subject from the filters above to start entering or editing student results.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
