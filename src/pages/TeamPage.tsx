import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Linkedin, Code, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { teamsApi } from "@/lib/teamsApi";

const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const slug = String(teamId || "").toLowerCase().trim();

  const { data: team, isLoading: isTeamLoading } = useQuery({
    queryKey: ["public", "team", slug],
    queryFn: () => teamsApi.getTeamBySlug(slug),
    enabled: !!slug,
  });

  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ["public", "teamMembers", slug],
    queryFn: () => teamsApi.listMembersByTeamSlug(slug),
    enabled: !!slug,
  });

  const iconMap: Record<string, any> = {
    Code,
    Palette,
    Users,
  };

  if (isTeamLoading || isMembersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold mb-4">Team Not Found</h1>
          <Link to="/">
            <Button variant="hero">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const TeamIcon = iconMap[(team as any).icon] || Users;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-20 right-20 w-72 h-72 bg-gradient-to-br ${team.color} opacity-10 rounded-full blur-[100px]`} />
          <div className="absolute top-40 left-10 w-32 h-32 border border-primary/10 rounded-full animate-spin-slow" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Link to="/#team" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>

          <div className="flex items-center gap-6 mb-8">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${team.color} p-[2px]`}>
              <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                <TeamIcon className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold">
                {team.title}
              </h1>
              <p className="text-muted-foreground">{members.length} talented members</p>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-3xl">
            {team.description}
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-semibold mb-8">Team Members</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member, index) => (
              <div
                key={member._id}
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
              >
                {/* Profile Image */}
                <div className="relative w-20 h-20 mb-4">
                  <img
                    src={member.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors duration-300"
                  />
                  {/* LinkedIn Icon - appears on hover over image */}
                  {member.linkedin ? (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/90 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100"
                    >
                      <Linkedin className="w-6 h-6 text-primary-foreground" />
                    </a>
                  ) : null}
                </div>

                <h3 className="font-display font-semibold text-lg mb-1">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>

                {/* Hidden old LinkedIn Icon */}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TeamPage;
