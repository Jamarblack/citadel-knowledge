import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, ArrowRight, BookOpen, Shield } from "lucide-react";
import schoolLogo from "/school-logo.png";
import SEO from "@/components/SEO";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f5f2] font-sans flex flex-col">

        <SEO 
        title="Citadel School of Excellence | Best School in Oko Erin, Kwara"
        description="Enroll at Citadel School, the leading primary and secondary school in Oko Erin, Kwara State. We offer world-class education, modern facilities, and a moral foundation for your child."
      />
      
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-[#d4af37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={schoolLogo} alt="Citadel Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-serif font-bold text-xl text-[#2c0a0e] leading-none">Citadel</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold">School of Excellence</p>
            </div>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-[#2c0a0e]">
            <a href="#" className="hover:text-[#d4af37] transition-colors">Home</a>
            <a href="#" className="hover:text-[#d4af37] transition-colors">About Us</a>
            <a href="#" className="hover:text-[#d4af37] transition-colors">Admissions</a>
            <a href="#" className="hover:text-[#d4af37] transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          
          {/* Left: Text Content */}
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fcf6ba] text-[#2c0a0e] rounded-full text-xs font-bold uppercase tracking-wide border border-[#d4af37]">
              <Shield size={14} /> Welcome to Citadel
            </div>
            
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#2c0a0e] leading-tight">
              Nurturing Minds, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#b38728]">
                Building Leaders.
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-md leading-relaxed">
              Experience world-class education with a blend of academic excellence and moral integrity. Your future begins here.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              
              {/* Staff Login Button */}
              <button 
                onClick={() => navigate('/staff-login')}
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#2c0a0e] text-[#fcf6ba] rounded-xl font-bold text-lg shadow-xl hover:bg-[#540b0e] hover:scale-105 transition-all"
              >
                <Users size={20} /> Staff Portal
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Student Portal (Placeholder for now) */}
              <button 
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-[#2c0a0e]/10 text-[#2c0a0e] rounded-xl font-bold text-lg hover:border-[#d4af37] hover:bg-[#fcf6ba]/30 transition-all"
                onClick={() => alert("Student Portal coming soon!")}
              >
                <GraduationCap size={20} /> Student Portal
              </button>
            </div>
          </div>

          {/* Right: Abstract Visual or Image */}
          <div className="relative animate-in zoom-in duration-700 delay-200 hidden md:block">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#fcf6ba] rounded-full filter blur-3xl opacity-50 mix-blend-multiply animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#d4af37]/30 rounded-full filter blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-2000"></div>
            
            <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-[#d4af37]/20 rotate-3 hover:rotate-0 transition-all duration-500">
               <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                 <div className="w-12 h-12 bg-[#2c0a0e] rounded-full flex items-center justify-center text-[#fcf6ba]">
                   <BookOpen size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-[#2c0a0e] text-lg">Academic Excellence</h3>
                   <p className="text-xs text-gray-500">2025/2026 Session In Progress</p>
                 </div>
               </div>
               <div className="space-y-4">
                 <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                 <div className="h-4 bg-gray-100 rounded w-full"></div>
                 <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                 <div className="h-32 bg-[#f8f5f2] rounded-xl border border-dashed border-[#d4af37]/30 flex items-center justify-center text-gray-400 text-sm">
                    School Activities & Updates
                 </div>
               </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2c0a0e] text-[#fcf6ba]/60 py-8 text-center text-sm">
        <p>&copy; 2026 Citadel School. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;