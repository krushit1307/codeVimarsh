import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import EventsSection from "@/components/EventsSection";
import TeamSection from "@/components/TeamSection";
import ResourcesSection from "@/components/ResourcesSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import ProfileGuard from "@/components/ProfileGuard";

const Index = () => {
  return (
    <ProfileGuard>
      <div className="min-h-screen bg-background relative">
        <AnimatedBackground />
        <Navbar />
        <main className="relative z-10 pt-16 md:pt-20">
          <HeroSection />
          <AboutSection />
          <EventsSection />
          <TeamSection />
          <ResourcesSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </ProfileGuard>
  );
};

export default Index;
