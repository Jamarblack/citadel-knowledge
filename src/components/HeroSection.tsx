import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, Users } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-gold rounded-full"></div>
        <div className="absolute bottom-32 right-20 w-48 h-48 border-2 border-gold rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 border border-gold/50 rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
        <div className="text-center text-secondary-foreground max-w-4xl mx-auto">
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="inline-block px-4 py-2 rounded-full bg-gold/20 text-gold font-medium text-sm mb-6">
             
            </span>
          </div>
          
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Welcome to{" "}
            <span className="text-gradient-gold">Citadel of Knowledge</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-secondary-foreground/80 mb-4 font-light animate-fade-in" style={{ animationDelay: '0.3s' }}>
            International School
          </p>
          
          <p className="text-lg text-gold italic font-heading mb-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            ""
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Link to="#" className="btn-hero inline-flex items-center justify-center gap-2">
              <GraduationCap size={22} />
              Apply for Admission
            </Link>
            <Link to="#about" className="px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gold text-gold hover:bg-gold hover:text-secondary transition-all duration-300">
              Learn More
            </Link>
          </div>
          
          {/* Stats Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="bg-secondary-foreground/10 backdrop-blur-sm rounded-xl p-6 border border-secondary-foreground/20">
              <BookOpen size={36} className="text-gold mx-auto mb-3" />
              <h3 className="font-heading text-2xl font-bold text-secondary-foreground">25+</h3>
              <p className="text-secondary-foreground/70">Years of Excellence</p>
            </div>
            <div className="bg-secondary-foreground/10 backdrop-blur-sm rounded-xl p-6 border border-secondary-foreground/20">
              <Users size={36} className="text-gold mx-auto mb-3" />
              <h3 className="font-heading text-2xl font-bold text-secondary-foreground">2,500+</h3>
              <p className="text-secondary-foreground/70">Students Enrolled</p>
            </div>
            <div className="bg-secondary-foreground/10 backdrop-blur-sm rounded-xl p-6 border border-secondary-foreground/20">
              <GraduationCap size={36} className="text-gold mx-auto mb-3" />
              <h3 className="font-heading text-2xl font-bold text-secondary-foreground">98%</h3>
              <p className="text-secondary-foreground/70">Success Rate</p>
            </div>
          </div> */}
        </div>
      </div>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
