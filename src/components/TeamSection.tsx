import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Code, Palette, Users, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { teamsApi } from "@/lib/teamsApi";

const TeamSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const { data: teams = [] } = useQuery({
    queryKey: ["public", "teams"],
    queryFn: teamsApi.listTeams,
  });

  const iconMap: Record<string, any> = {
    Code,
    Palette,
    Users,
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="team"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 border border-primary/10 rounded-full animate-spin-slow" />
        <div className="absolute bottom-20 left-10 w-48 h-48 border border-primary/5 rounded-full animate-spin-slow" style={{ animationDirection: "reverse" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
            Our Team
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Meet the <span className="text-gradient-orange">Minds</span> Behind
          </h2>
          <p className="text-lg text-muted-foreground">
            Passionate individuals working together to build and nurture the coding community.
          </p>
        </div>

        {/* Team Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {teams.map((team, index) => {
            const TeamIcon = iconMap[team.icon] || Users;
            return (
            <Link
              key={team._id}
              to={`/team/${team.slug}`}
              className={`group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 p-8 text-center transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${team.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${team.color} p-[1px] group-hover:scale-110 transition-transform duration-300`}>
                <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                  <TeamIcon className="w-8 h-8 text-primary" />
                </div>
              </div>

              <h3 className="font-display font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                {team.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {team.description}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {team.membersCount} Members
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
