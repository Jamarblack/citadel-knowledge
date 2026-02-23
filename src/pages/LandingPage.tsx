import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  GraduationCap, User, ArrowRight, BookOpen, 
  ChevronRight, ChevronLeft, Menu, X, 
  Phone, Mail, MapPin, Send, Globe, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import SEO from "@/components/SEO";

import logo from "/school-logo.png"; 
import director from "@/assets/Citadel CEO.jpeg";
import sign from "@/assets/signature MCeo.svg";
import award1 from "@/assets/1st Mathematics Quiz Competition by GP foundation.jpg";
import award2 from "@/assets/1st Mathematics Quiz Competition by GreatPrema Foundation.jpg";
import award3 from "@/assets/4th Mathematics Quiz Competition by Union Baptist Grammar School.jpg";
import award4 from "@/assets/5th mathematics Quiz Competition by F-De Bright.jpg";
import award5 from "@/assets/Cert of participation Citadel.jpg";
import award6 from "@/assets/citadel@10.jpg";
import award7 from "@/assets/QESD by UK accreditation.jpg";
import ckis1 from "@/assets/ckis 1.jpg";
import ckis2 from "@/assets/ckis2.jpg";
import ckis3 from "@/assets/ckis3.jpg";
import ckis4 from "@/assets/ckis4.jpg";
import ckis5 from "@/assets/ckis5.jpg";
import ckis6 from "@/assets/ckis6.jpg";
import ckis7 from "@/assets/ckis7.jpg";
import ckis8 from "@/assets/ckis8.jpg";
import ckis9 from "@/assets/ckis9.jpg";
import ckis10 from "@/assets/ckis10.jpg";
import ckis11 from "@/assets/ckis11.jpg";
import ckis12 from "@/assets/upscalemedia-transformed.jpeg"



const HERO_SLIDES = [
  ckis1, ckis2, ckis3, ckis4, ckis5, ckis6, ckis7, ckis8, ckis9, ckis10, ckis11, ckis12
];

const AWARDS = [
  award1, award2, award3, award4, award5, award6, award7
];

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // FIX: Variable name must be lowercase 'latestUpdates' to match JSX
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500); 
    return () => clearTimeout(timer);
  }, []);

  // Fetch Updates from Supabase
  useEffect(() => {
    const fetchUpdates = async () => {
      const { data } = await supabase
        .from('school_updates')
        .select('*')
        .order('event_date', { ascending: true }) 
        .gte('event_date', new Date().toISOString().split('T')[0]) 
        .limit(4);
        
      if (data && data.length > 0) {
        setLatestUpdates(data);
      } else {
          // Fallback if DB is empty
          setLatestUpdates([
              { title: "Mid-Term Break", event_date: "2026-02-14", category: "Holiday" },
              { title: "Inter-House Sports", event_date: "2026-03-03", category: "Event" },
              { title: "Entrance Exam Batch A", event_date: "2026-04-10", category: "Admission" }
          ]);
      }
    };
    fetchUpdates();
  }, []);

  // Auto-slide logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <div className="min-h-screen font-sans bg-[#fdfbf7] text-gray-800 overflow-x-hidden">
      <SEO 
        title="Citadel of Knowledge International School" 
        description="Nurturing Minds, Building Leaders." 
        image="https://www.citadelofknowledgeinternationalschool-college.com/school-logo.png"
      />
      
      {/* --- SPLASH SCREEN --- */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-[#2c0a0e] flex flex-col items-center justify-center text-white"
          >
            <motion.img 
              src={logo} 
              alt="Logo" 
              className="w-32 h-32 mb-6 rounded-full"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
            />
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold font-serif text-center px-4"
            >
              Citadel of Knowledge
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-amber-200/80 text-sm tracking-widest mt-2 uppercase"
            >
              International School
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={logo} alt="Citadel Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-amber-950 leading-none">Citadel Of Knowledge</h1>
                <p className="text-[8px] md:text-[10px] text-amber-600 font-bold tracking-widest uppercase">Education For Future Excellence</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
              <a href="#" className="hover:text-amber-700 transition-colors">Home</a>
              <a href="#about" className="hover:text-amber-700 transition-colors">About</a>
              <a href="#academics" className="hover:text-amber-700 transition-colors">Academics</a>
              <a href="#admissions" className="hover:text-amber-700 transition-colors">Admissions</a>
              <a href="#contact" className="hover:text-amber-700 transition-colors">Contact</a>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex gap-3">
               <Link to="/staff-login" className="flex items-center gap-2 text-amber-900 font-bold text-sm px-4 py-2 hover:bg-amber-50 rounded-lg transition-all">
                 <User size={16}/> Staff
               </Link>
               <Link to="/student-login" className="flex items-center gap-2 bg-amber-900 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-amber-800 shadow-lg hover:shadow-xl transition-all">
                 <GraduationCap size={16}/> Student Portal
               </Link>
            </div>

            {/* Mobile Hamburger */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-amber-950 p-2">
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col font-bold text-gray-600">
                <a href="#" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
                <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
                <a href="#academics" onClick={() => setIsMobileMenuOpen(false)}>Academics</a>
                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
                <div className="border-t pt-4 flex flex-col gap-3">
                  <Link to="/student-login" className="text-center w-full py-3 bg-amber-900 text-white rounded-xl">Student Portal</Link>
                  <Link to="/staff-login" className="text-center w-full py-3 bg-amber-50 text-amber-900 rounded-xl">Staff Portal</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 overflow-hidden">
        
        {/* Background Logo Watermark */}
        <div className="absolute top-0 right-0 w-full h-full md:w-[600px] md:h-[600px] opacity-5 pointer-events-none z-0 flex items-center justify-center">
            <img src={logo} className="w-full h-auto object-contain" />
        </div>

        {/* Left Text */}
        <div className="flex-1 space-y-6 text-center md:text-left z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 border border-amber-200 text-amber-800 text-xs font-bold tracking-wider mb-2">
              <img src={logo} className="w-6 h-6 inline mr-2 rounded-full" /> WELCOME TO CITADEL OF KNOWLEDGE INT'L SCH
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-amber-950 leading-tight font-serif">
            Nurturing Minds, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-500">Building Leaders.</span>
          </h1>
          <p className="text-lg text-gray-600 md:max-w-xl">
            Experience world-class education with a blend of academic excellence and moral integrity. Your future begins here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <Link to="/admission" className="px-8 py-4 bg-amber-900 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">
              Apply Now <ArrowRight size={18} />
            </Link>
            <button className="px-8 py-4 bg-white text-amber-900 border border-amber-200 font-bold rounded-xl hover:bg-amber-50 transition-all">
              Take a Tour
            </button>
          </div>
        </div>

        {/* Right Card (Live Updates) */}
        <div className="flex-1 w-full relative z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-amber-50"
          >
            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-amber-900 flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">Latest Updates</h3>
                <p className="text-xs text-gray-500">2025/2026 Session In Progress</p>
              </div>
            </div>

            <div className="space-y-4">
              {latestUpdates.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer group/item border border-transparent hover:border-amber-100 shadow-sm">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-50 rounded-lg flex flex-col items-center justify-center text-amber-800 border border-amber-100">
                    <span className="text-[10px] font-bold uppercase">{new Date(item.event_date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg font-bold leading-none">{new Date(item.event_date).getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 group-hover/item:text-amber-700 transition-colors">{item.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{item.category}</span>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover/item:text-amber-600 group-hover/item:translate-x-1 transition-all"/>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- VISION & MISSION --- */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-amber-950 font-serif">Our Philosophy</h2>
                <p className="text-gray-500 mt-2">The core values that drive our excellence.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="bg-[#fdfbf7] p-10 rounded-3xl border border-amber-100 hover:shadow-lg transition-shadow text-center">
                    {/* <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-amber-800 mb-6">
                        <Globe size={32} />
                    </div> */}
                    <h3 className="text-2xl font-bold text-amber-950 mb-4">Vision Statement</h3>
                    <p className="text-gray-600 leading-relaxed">
                        Citadel of Knowledge International School is established to produce a generation of educated pupils/students through thorough teaching methods guided by well-structured curriculum, which will imbibe quest to excel with confidence and integrity.
                    </p>
                </div>
                <div className="bg-[#fdfbf7] p-10 rounded-3xl border border-amber-100 hover:shadow-lg transition-shadow text-center">
                    {/* <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-amber-800 mb-6">
                        <Award size={32} />
                    </div> */}
                    <h3 className="text-2xl font-bold text-amber-950 mb-4">Mission Statement</h3>
                    <p className="text-gray-600 leading-relaxed">
                        To employ thorough teaching techniques that would adequately equip pupils/students to pass examinations without recourse to any form of malpractice, thereby producing young school leavers with potentials, who will eventually contribute to the socio-economic and technological development of the state and the nation at large.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* --- AWARDS MARQUEE --- */}
      <section className="bg-amber-900 py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-4">
            <p className="text-amber-200/60 text-xs font-bold uppercase tracking-widest text-center">Awards & Recognitions</p>
        </div>
        <div className="relative flex overflow-x-hidden group">
          <motion.div 
            className="flex gap-16 items-center whitespace-nowrap py-4"
            animate={{ x: ["0%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          >
            {[...AWARDS, ...AWARDS, ...AWARDS].map((src, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <img src={src} alt="Award" className="h-32 w-auto opacity-80 hover:opacity-100 transition-opacity grayscale hover:scale-110 duration-300 object-contain rounded-lg shadow-lg" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- DIRECTOR'S FOOTNOTE --- */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
                <div className="absolute inset-0 bg-amber-100 rounded-3xl transform -rotate-3"></div>
                <img 
                    src={director} 
                    alt="Director" 
                    className="relative rounded-3xl shadow-xl w-full h-[500px] object-cover grayscale hover:scale-[1.01] transition-all duration-500"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-amber-100">
                    <p className="font-serif font-bold text-xl text-amber-950">Mr. John Oyetade</p>
                    <p className="text-amber-700 text-sm font-bold uppercase tracking-wider">Director & Founder</p>
                </div>
            </div>
            <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-900 font-serif">"Education is the passport to the future."</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                    At Citadel of Knowledge, we believe that every child is a unique individual with the potential to change the world. Our mission is not just to teach, but to inspire. We have built an environment where integrity meets intelligence, and where moral values are held as high as academic grades.
                </p>
                <div className="pt-4">
                    <img src={sign} alt="Signature" className="h-16 opacity-80" /> 
                    <span className="text-xs text-gray-400 block mt-1">E-Signed</span>
                </div>
            </div>
        </div>
      </section>

     
      <section id="academics" className="py-10 bg-gray-900 text-white">
        <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold font-serif">Life at Citadel</h2>
            <p className="text-gray-400">A glimpse into our vibrant community and facilities.</p>
        </div>
        
        <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden group">
            <AnimatePresence mode="wait">
                <motion.img 
                    key={currentSlide}
                    src={HERO_SLIDES[currentSlide]}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 w-full h-full object-scale-down "
                />
            </AnimatePresence>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur text-white transition-all">
                <ChevronLeft size={32} />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur text-white transition-all">
                <ChevronRight size={32} />
            </button>
        </div>
      </section>

      {/* --- CONTACT & FOOTER --- */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
            <div className="bg-amber-50 rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-amber-100 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-6">
                    <h2 className="text-3xl font-bold text-amber-950 font-serif">Have Questions?</h2>
                    <p className="text-gray-600">Our support team is ready to help you with admissions, fees, or general inquiries.</p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-gray-700">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm"><Phone size={18} /></div>
                            <span className="font-medium">+234 800 123 4567</span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-700">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm"><Mail size={18} /></div>
                            <span className="font-medium">admissions@citadel.com</span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-700">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm"><MapPin size={18} /></div>
                            <span className="font-medium text-sm">Adjacent First Bank, Saw-Mill Area, Ilorin</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                    <form className="space-y-4">
                        <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Full Name</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-amber-500" placeholder="Parent's Name" /></div>
                        <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Email / Phone</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-amber-500" placeholder="How do we reach you?" /></div>
                        <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Message</label><textarea rows={3} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-amber-500" placeholder="I want to enquire about..."></textarea></div>
                        <button className="w-full py-3 bg-amber-900 text-white font-bold rounded-xl shadow-lg hover:bg-amber-800 transition-all flex items-center justify-center gap-2">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
      </section>

      <footer className="bg-[#1a0507] text-amber-100 py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <img src={logo} className="h-10 w-10 opacity-80 " />
                    <span className="font-bold text-lg text-white">Citadel</span>
                </div>
                <p className="text-sm opacity-60 leading-relaxed">Raising excellence since 2014. <br/>Approved by the Ministry of Education.</p>
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm opacity-70">
                    <li><a href="#" className="hover:text-white transition-colors">Admissions</a></li>
                    <li><Link to="/student-login" className="hover:text-white transition-colors">Check Result</Link></li>
                    <li><a href="#" className="hover:text-white transition-colors">News & Events</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">Schools</h4>
                <ul className="space-y-2 text-sm opacity-70">
                    <li>Creche & Nursery</li>
                    <li>Primary School</li>
                    <li>Junior Secondary</li>
                    <li>Senior Secondary</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">Newsletter</h4>
                <div className="flex gap-2">
                    <input type="email" placeholder="Your Email" className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm w-full outline-none focus:border-amber-600 text-white placeholder-white/30" />
                    <button className="bg-amber-100 text-amber-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-white transition-colors">Go</button>
                </div>
            </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-xs opacity-40"> <p>© {new Date().getFullYear()} Citadel Of Knowledge International School/ College. All Rights Reserved.</p> </div>
      </footer>
    </div>
  );
};

export default LandingPage;