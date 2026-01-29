import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import schoolLogo from "/school-logo.png";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";

const StaffLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('email', formData.email)
        .eq('password_text', formData.password)
        .single();

      if (error || !data) throw new Error('Invalid email or PIN');

      // Save Session
      localStorage.setItem('staffId', data.id);
      localStorage.setItem('staffRole', data.role);

      toast.success(`Welcome, ${data.full_name}`);

      // ROUTING LOGIC (The new separation)
      switch (data.role) {
        case 'Proprietor':
          navigate('/proprietor-dashboard');
          break;
        case 'Principal':
          navigate('/principal-dashboard');
          break;
        case 'Head Teacher':
          navigate('/head-teacher-dashboard');
          break;
        case 'Teacher':
          navigate('/teacher-dashboard');
          break;
        case 'Bursar':
          navigate('/bursar-dashboard'); // Future proofing
          break;
        default:
          navigate('/teacher-dashboard'); // Default fallback
      }

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f5f2] p-4">
      <SEO 
        title="Citadel School of Excellence | Best School in Oko Erin, Kwara"
        description="Enroll at Citadel School, the leading primary and secondary school in Oko Erin, Kwara State. We offer world-class education, modern facilities, and a moral foundation for your child."
      />
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#d4af37]/20">
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 bg-[#2c0a0e] rounded-full flex items-center justify-center border-4 border-[#d4af37] shadow-lg mb-4">
             <img src={schoolLogo} alt="Logo" className="w-15 h-15 rounded-full" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2c0a0e]">Staff Portal</h2>
          <p className="text-sm text-gray-500">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#2c0a0e] ml-1">Email Address</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none" placeholder="staff@citadel.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#2c0a0e] ml-1">Password PIN</label>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none pr-12" placeholder="••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2c0a0e] p-1">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button disabled={loading} className="w-full py-4 bg-[#2c0a0e] text-[#fcf6ba] font-bold rounded-xl shadow-lg hover:bg-[#540b0e] transition-all flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={20} className="animate-spin" /> Verifying...</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffLogin;