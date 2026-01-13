import { Award, Target, Heart, Shield } from "lucide-react";

const AboutSection = () => {
  const values = [
    // {
    //   icon: Award,
    //   title: "Academic Excellence",
    //   description: "We maintain the highest standards of academic rigor, preparing students for success in higher education and beyond."
    // },
    {
      
      title: "Holistic Development",
      description: "Beyond academics, we nurture creativity, leadership, and character in every student."
    },
    {
      
      title: "Student-Centered Care",
      description: "Every child is unique. Our dedicated staff provides personalized attention and support."
    },
    {
      
      title: "Safe Environment",
      description: "We provide a secure, inclusive campus where students can learn, grow, and thrive."
    }
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            About Our Institution
          </span>
          <h2 className="section-heading">Building Tomorrow's Leaders</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
             Citadel of Knowledge International School has been a beacon of academic excellence, 
            nurturing young minds and shaping future leaders.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="font-heading text-2xl font-semibold text-secondary">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To provide quality education that develops the intellectual, physical, emotional, and social 
              capabilities of every student, preparing them to be responsible global citizens and leaders 
              in their chosen fields.
            </p>
            <h3 className="font-heading text-2xl font-semibold text-secondary">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To be the leading international school in the region, recognized for academic excellence, 
              innovative teaching methods, and the holistic development of students who will positively 
              impact their communities and the world.
            </p>
          </div>
          
          <div className="relative">
            <div className="card-elegant">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-crimson-dark flex items-center justify-center">
                    <Award size={48} className="text-primary-foreground" />
                  </div>
                  <h4 className="font-heading text-xl font-semibold text-secondary mb-2">
                    Award-Winning Institution
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Recognized for excellence in education by the Ministry of Education
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gold/20 rounded-full -z-10"></div>
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/20 rounded-full -z-10"></div>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <div 
              key={index} 
              className="card-elegant hover:shadow-elegant transition-shadow duration-300 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-crimson-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                {/* <value.icon size={28} className="text-primary-foreground" /> */}
              </div>
              <h4 className="font-heading text-lg font-semibold text-secondary mb-2">{value.title}</h4>
              <p className="text-muted-foreground text-sm">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
