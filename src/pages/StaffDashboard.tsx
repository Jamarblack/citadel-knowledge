import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, User, BookOpen, Save, Users, Layers, ClipboardCheck 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import schoolLogo from "/school-logo.png";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  
  // Logged-in Teacher's Profile
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  // INPUT RESULT STATE
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [resultStudents, setResultStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { ca: number, exam: number }>>({});

  // MY CLASS STATE
  const [myClassStudents, setMyClassStudents] = useState<any[]>([]);

  useEffect(() => {
    // 1. Get the current user
    // Note: In a real app with Auth, use supabase.auth.getUser()
    // For this manual setup, we fetch the teacher based on the email stored in localStorage
    // OR for demo purposes, we fetch the last created 'Teacher' if no session exists.
    fetchTeacherProfile();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (teacherProfile?.assigned_class) {
      fetchMyClassStudents();
    }
  }, [teacherProfile]);

  useEffect(() => {
    filterSubjects();
  }, [selectedClass, selectedDepartment, subjects]);

  const fetchTeacherProfile = async () => {
    // Ideally, retrieve email from login session. 
    // Demo: Fetching a 'Teacher' role for demonstration.
    // REPLACE THIS with actual session logic if you have implemented auth context.
    const { data } = await supabase.from('staff').select('*').eq('role', 'Teacher').limit(1).single();
    if (data) setTeacherProfile(data);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    if (data) setSubjects(data || []);
  };

  const fetchMyClassStudents = async () => {
    if (!teacherProfile?.assigned_class) return;
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('current_class', teacherProfile.assigned_class)
      .order('full_name');
    setMyClassStudents(data || []);
  };

  // --- LOGIC: Filter Classes based on Teacher's Section ---
  const getAllowedClasses = () => {
    if (!teacherProfile?.section) return [];
    
    if (teacherProfile.section === 'Primary') {
      return ['Creche', 'KG 1', 'KG 2', 'KG 3', 'Pry 1', 'Pry 2', 'Pry 3', 'Pry 4', 'Pry 5'];
    }
    if (teacherProfile.section === 'Secondary') {
      return ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    }
    return [];
  };

  // --- LOGIC: Filter Subjects (Same as before) ---
  const filterSubjects = () => {
    if (!selectedClass) { setFilteredSubjects([]); return; }

    let sectionTag = "";
    if (selectedClass.includes('KG')) sectionTag = selectedClass.replace(' ', ''); // KG1, KG2...
    else if (['Pry 1', 'Pry 2'].includes(selectedClass)) sectionTag = 'PRY_1_2';
    else if (['Pry 3', 'Pry 4'].includes(selectedClass)) sectionTag = 'PRY_3_4';
    else if (selectedClass === 'Pry 5') sectionTag = 'PRY_5';
    else if (selectedClass.includes('JSS')) sectionTag = 'JUNIOR';
    else if (selectedClass.includes('SS')) {
      if (selectedDepartment === 'Science') sectionTag = 'SENIOR_SCI';
      else if (selectedDepartment === 'Art') sectionTag = 'SENIOR_ART';
      else if (selectedDepartment === 'Commercial') sectionTag = 'SENIOR_COM';
    }

    if (sectionTag) {
      setFilteredSubjects(subjects.filter(s => s.section === sectionTag));
    } else {
      setFilteredSubjects([]);
    }
  };

  const loadResultSheet = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    try {
      const { data: students } = await supabase.from('students').select('*').eq('current_class', selectedClass).order('full_name');
      const { data: results } = await supabase.from('results')
        .select('*')
        .eq('class_name', selectedClass)
        .eq('subject', selectedSubject);

      const scoreMap: any = {};
      results?.forEach((r: any) => {
        scoreMap[r.student_id] = { ca: r.ca_score, exam: r.exam_score };
      });

      setResultStudents(students || []);
      setScores(scoreMap);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const saveScore = async (student: any) => {
    const scoreData = scores[student.id] || { ca: 0, exam: 0 };
    
    try {
      const { error } = await supabase.from('results').upsert({
        student_id: student.id,
        student_name: student.full_name,
        admission_number: student.admission_number,
        subject: selectedSubject,
        class_name: selectedClass,
        term: '1st Term', // Should come from global settings
        session: '2025/2026', // Should come from global settings
        ca_score: scoreData.ca,
        exam_score: scoreData.exam,
        status: 'pending', // <--- IMPORTANT: Default to Pending
        uploader_name: teacherProfile.full_name, // <--- Security Tracking
        uploader_id: teacherProfile.id
      }, { onConflict: 'student_id, subject, term, session' });

      if (error) throw error;
      toast.success("Score saved! Sent for approval.");
    } catch (error: any) {
      toast.error("Save failed");
    }
  };

  const handleScoreChange = (id: string, type: 'ca' | 'exam', val: string) => {
    const num = Math.min(type === 'ca' ? 40 : 60, Math.max(0, Number(val) || 0));
    setScores(prev => ({
      ...prev,
      [id]: { ...prev[id], [type]: num, [type === 'ca' ? 'exam' : 'ca']: prev[id]?.[type === 'ca' ? 'exam' : 'ca'] || 0 }
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#2c0a0e]/10 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <img src={schoolLogo} className="w-10 h-10" alt="Logo" />
           <div>
             <h1 className="font-serif font-bold text-xl text-[#2c0a0e]">Staff Portal</h1>
             <p className="text-xs text-gray-500">{teacherProfile?.full_name} | {teacherProfile?.section} Section</p>
           </div>
        </div>
        <button onClick={() => navigate("/")} className="text-sm font-bold text-[#540b0e] flex items-center gap-2 hover:bg-[#540b0e]/10 px-4 py-2 rounded-full transition-all">
          <LogOut size={16} /> Sign Out
        </button>
      </header>

      {/* TABS Navigation */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="bg-white p-2 rounded-xl inline-flex gap-2 shadow-sm border border-[#2c0a0e]/10">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'input-result', label: 'Input Results', icon: Layers },
            { id: 'my-class', label: 'My Class', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-[#2c0a0e] text-[#fcf6ba] shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6">
        
        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && teacherProfile && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-[#d4af37]/20 max-w-2xl animate-in fade-in zoom-in-95">
             <div className="flex items-center gap-6 mb-8">
               <div className="h-24 w-24 rounded-full bg-[#2c0a0e] border-4 border-[#d4af37] flex items-center justify-center text-3xl font-bold text-[#fcf6ba] overflow-hidden">
                 {teacherProfile.passport_url ? <img src={teacherProfile.passport_url} className="w-full h-full object-cover"/> : teacherProfile.full_name[0]}
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-[#2c0a0e]">{teacherProfile.full_name}</h2>
                 <span className="bg-[#fcf6ba] text-[#2c0a0e] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                   {teacherProfile.role}
                 </span>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-6">
               <div className="p-4 bg-gray-50 rounded-xl">
                 <p className="text-xs text-gray-500 uppercase mb-1">Email Address</p>
                 <p className="font-medium text-[#2c0a0e]">{teacherProfile.email}</p>
               </div>
               <div className="p-4 bg-gray-50 rounded-xl">
                 <p className="text-xs text-gray-500 uppercase mb-1">Password PIN</p>
                 <p className="font-medium text-[#2c0a0e] tracking-widest">{teacherProfile.password_text}</p>
               </div>
               <div className="p-4 bg-gray-50 rounded-xl">
                 <p className="text-xs text-gray-500 uppercase mb-1">Section</p>
                 <p className="font-medium text-[#2c0a0e]">{teacherProfile.section}</p>
               </div>
               <div className="p-4 bg-gray-50 rounded-xl">
                 <p className="text-xs text-gray-500 uppercase mb-1">Assigned Class</p>
                 <p className="font-medium text-[#2c0a0e]">{teacherProfile.assigned_class || 'None'}</p>
               </div>
             </div>
          </div>
        )}

        {/* TAB 2: INPUT RESULTS */}
        {activeTab === 'input-result' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
             {/* Controls */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#d4af37]/20">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                 
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-[#2c0a0e]">Select Class</label>
                   <select 
                     value={selectedClass} 
                     onChange={e => { setSelectedClass(e.target.value); setSelectedDepartment(""); setSelectedSubject(""); }}
                     className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]"
                   >
                     <option value="">-- Choose Class --</option>
                     {getAllowedClasses().map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>

                 {selectedClass.includes('SS') && (
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-[#2c0a0e]">Department</label>
                     <select 
                       value={selectedDepartment} 
                       onChange={e => setSelectedDepartment(e.target.value)}
                       className="w-full p-3 bg-[#f8f5f2] rounded-xl border-2 border-[#d4af37]/30"
                     >
                       <option value="">-- Dept --</option>
                       <option value="Science">Science</option>
                       <option value="Art">Art</option>
                       <option value="Commercial">Commercial</option>
                     </select>
                   </div>
                 )}

                 <div className="space-y-2">
                   <label className="text-sm font-bold text-[#2c0a0e]">Subject</label>
                   <select 
                     value={selectedSubject} 
                     onChange={e => setSelectedSubject(e.target.value)}
                     className="w-full p-3 bg-[#f8f5f2] rounded-xl border-none focus:ring-2 focus:ring-[#d4af37]"
                     disabled={!selectedClass}
                   >
                     <option value="">-- Choose Subject --</option>
                     {filteredSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                   </select>
                 </div>

                 <button 
                   onClick={loadResultSheet}
                   disabled={!selectedClass || !selectedSubject || loading}
                   className="h-[50px] bg-[#2c0a0e] text-[#fcf6ba] font-bold rounded-xl shadow-lg hover:bg-[#540b0e] transition-all disabled:opacity-50"
                 >
                   {loading ? 'Loading...' : 'Load Sheet'}
                 </button>
               </div>
             </div>

             {/* Sheet */}
             {resultStudents.length > 0 && (
               <div className="bg-white rounded-3xl shadow-lg border border-[#d4af37]/20 overflow-hidden">
                 <div className="p-4 bg-[#2c0a0e] text-[#fcf6ba] flex justify-between items-center">
                   <span className="font-bold">{selectedSubject} - {selectedClass}</span>
                   <span className="text-xs bg-[#fcf6ba] text-[#2c0a0e] px-2 py-1 rounded">Pending Approval</span>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[600px]">
                     <thead className="bg-gray-50 border-b border-gray-100">
                       <tr>
                         <th className="p-4 text-sm font-bold text-gray-500">Student</th>
                         <th className="p-4 w-24 text-sm font-bold text-gray-500">CA (40)</th>
                         <th className="p-4 w-24 text-sm font-bold text-gray-500">Exam (60)</th>
                         <th className="p-4 w-20 text-sm font-bold text-gray-500">Total</th>
                         <th className="p-4 text-sm font-bold text-gray-500">Action</th>
                       </tr>
                     </thead>
                     <tbody>
                       {resultStudents.map(student => {
                         const sScores = scores[student.id] || { ca: 0, exam: 0 };
                         const total = (sScores.ca || 0) + (sScores.exam || 0);
                         return (
                           <tr key={student.id} className="border-b border-gray-50 hover:bg-[#f8f5f2]">
                             <td className="p-4">
                               <p className="font-medium text-[#2c0a0e]">{student.full_name}</p>
                               <p className="text-xs text-gray-500">{student.admission_number}</p>
                             </td>
                             <td className="p-4"><input type="number" max="40" value={sScores.ca || ''} onChange={e => handleScoreChange(student.id, 'ca', e.target.value)} className="w-16 p-2 border rounded-lg text-center" /></td>
                             <td className="p-4"><input type="number" max="60" value={sScores.exam || ''} onChange={e => handleScoreChange(student.id, 'exam', e.target.value)} className="w-16 p-2 border rounded-lg text-center" /></td>
                             <td className="p-4 font-bold">{total}</td>
                             <td className="p-4">
                               <button onClick={() => saveScore(student)} className="p-2 bg-[#2c0a0e] text-[#fcf6ba] rounded hover:bg-[#540b0e]">
                                 <Save size={16} />
                               </button>
                             </td>
                           </tr>
                         )
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* TAB 3: MY CLASS */}
        {activeTab === 'my-class' && (
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-[#d4af37]/20 animate-in fade-in">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-[#2c0a0e]">My Class: <span className="text-[#d4af37]">{teacherProfile?.assigned_class}</span></h2>
               <div className="text-sm bg-[#f8f5f2] px-3 py-1 rounded-lg font-medium text-[#540b0e]">
                 {myClassStudents.length} Students Assigned
               </div>
             </div>

             {myClassStudents.length === 0 ? (
               <div className="text-center py-12 text-gray-400">
                 <Users size={48} className="mx-auto mb-2 opacity-20" />
                 <p>No students found in this class yet.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {myClassStudents.map(student => (
                   <div key={student.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                        {student.full_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-[#2c0a0e]">{student.full_name}</p>
                        <p className="text-xs text-gray-500">{student.admission_number}</p>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

      </main>
    </div>
  );
};

export default StaffDashboard;