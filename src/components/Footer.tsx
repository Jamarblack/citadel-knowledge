import schoolLogo from "/school-logo.png";
import { MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col items-center md:items-start">
            <img src={schoolLogo} alt="Citadel of Knowledge" className="h-20 w-20 mb-4" />
            <h3 className="font-heading font-bold text-xl mb-2">Citadel of Knowledge</h3>
            <p className="text-gold font-medium italic">"Education for Future Excellence"</p>
          </div>
          
          <div className="text-center md:text-left">
            <h4 className="font-heading font-semibold text-lg mb-4 text-gold">Quick Links</h4>
            <ul className="space-y-2 text-secondary-foreground/80">
              <li><a href="#" className="hover:text-gold transition-colors">Admission</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Academic Calendar</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Student Portal</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Staff Portal</a></li>
            </ul>
          </div>
          
          <div className="text-center md:text-left">
            <h4 className="font-heading font-semibold text-lg mb-4 text-gold">Contact Us</h4>
            <ul className="space-y-3 text-secondary-foreground/80">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <MapPin size={18} className="text-gold" />
                <span>123 Education Avenue, City</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Phone size={18} className="text-gold" />
                <span>+234 800 123 4567</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Mail size={18} className="text-gold" />
                <span>info@citadelofknowledge.edu</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-secondary-foreground/20 pt-6 text-center text-secondary-foreground/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Citadel of Knowledge International School. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
