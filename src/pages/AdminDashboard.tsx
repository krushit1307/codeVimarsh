import { useMemo, useState } from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { adminApi, type AdminEvent, type AdminRegistration, type AdminTeam, type AdminTeamMember, type AdminUserProfileResponse } from "@/lib/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const AdminUserProfileView = ({ data }: { data: AdminUserProfileResponse }) => {
  const { user, profile } = data;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-secondary/20 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">User</div>
            <div className="text-base font-semibold">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
          <div className="text-right">
            {profile ? (
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${profile.isProfileComplete ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                {profile.isProfileComplete ? "Complete" : "Incomplete"}
              </div>
            ) : (
              <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground">
                No Profile
              </div>
            )}
          </div>
        </div>
      </div>

      {profile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground">Full Name</div>
            <div className="font-medium">{profile.fullName}</div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground">PRN Number</div>
            <div className="font-medium">{profile.prnNumber}</div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground">Class</div>
            <div className="font-medium">{profile.class}</div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground">Division</div>
            <div className="font-medium">{profile.division}</div>
          </div>
          <div className="md:col-span-2 rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground">Bio</div>
            <div className="text-sm whitespace-pre-wrap">{profile.bio || "-"}</div>
          </div>
          {profile.profileImage ? (
            <div className="md:col-span-2 rounded-lg border border-border p-4">
              <div className="text-sm text-muted-foreground mb-2">Profile Image</div>
              <img src={profile.profileImage} alt="Profile" className="h-24 w-24 rounded-full object-cover border border-border" />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">This user has not created a profile yet.</div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const { admin, logout } = useAdminAuth();

  const qc = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDialogEmail, setProfileDialogEmail] = useState<string | null>(null);

  const {
    data: selectedUserProfile,
    isLoading: isUserProfileLoading,
    error: userProfileError,
  } = useQuery({
    queryKey: ["admin", "userProfile", profileDialogEmail],
    queryFn: () => adminApi.getUserProfileByEmail(profileDialogEmail as string),
    enabled: Boolean(profileDialogEmail && profileDialogOpen),
  });

  const { data: events } = useQuery({ queryKey: ["admin", "events"], queryFn: adminApi.listEvents });
  const {
    data: teams,
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useQuery({ queryKey: ["admin", "teams"], queryFn: adminApi.listTeams });

  const {
    data: members,
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ["admin", "members", selectedTeamId],
    queryFn: () => adminApi.listMembers(selectedTeamId as string),
    enabled: !!selectedTeamId,
  });

  const [editEvent, setEditEvent] = useState<AdminEvent | null>(null);
  const [editTeam, setEditTeam] = useState<AdminTeam | null>(null);
  const [editMember, setEditMember] = useState<AdminTeamMember | null>(null);

  const { data: registrations } = useQuery({
    queryKey: ["admin", "registrations", selectedEventId],
    queryFn: () => adminApi.listRegistrationsByEvent(selectedEventId as string),
    enabled: !!selectedEventId,
  });

  const [eventForm, setEventForm] = useState({
    slug: "",
    title: "",
    description: "",
    date: "",
    time: "",
    mode: "Online" as AdminEvent["mode"],
    location: "",
    image: "",
  });

  const [teamForm, setTeamForm] = useState({
    slug: "",
    title: "",
    description: "",
    color: "from-primary to-orange-bright",
    icon: "Users",
    isActive: true,
  });

  const [memberForm, setMemberForm] = useState({
    firstName: "",
    lastName: "",
    role: "",
    linkedin: "",
    image: "",
    order: 0,
    isActive: true,
  });

  const [isUploadingEventImage, setIsUploadingEventImage] = useState(false);
  const [isUploadingMemberImage, setIsUploadingMemberImage] = useState(false);
  const [eventImageFileName, setEventImageFileName] = useState<string>("");
  const [memberImageFileName, setMemberImageFileName] = useState<string>("");

  const uploadToCloudinary = async (file: File) => {
    let sig: Awaited<ReturnType<typeof adminApi.getCloudinarySignature>>;
    try {
      sig = await adminApi.getCloudinarySignature();
    } catch (err: any) {
      const msg = err?.message || "Failed to get Cloudinary signature";
      throw new Error(`Failed to get upload signature from backend: ${msg}`);
    }

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);

    let res: Response;
    try {
      res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to fetch";
      throw new Error(`Cloudinary upload request failed (network/CORS): ${msg}`);
    }

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (body as any)?.error?.message || "Cloudinary upload failed";
      throw new Error(msg);
    }

    const url = (body as any)?.secure_url as string | undefined;
    if (!url) throw new Error("Cloudinary upload succeeded but no URL returned");
    return url;
  };

  const createEvent = useMutation({
    mutationFn: () => adminApi.createEvent(eventForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      toast({ title: "Event created" });
      setEventForm({ slug: "", title: "", description: "", date: "", time: "", mode: "Online", location: "", image: "" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const deleteEvent = useMutation({
    mutationFn: (eventId: string) => adminApi.deleteEvent(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      toast({ title: "Event deleted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const updateEvent = useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: Partial<Omit<AdminEvent, "_id" | "registeredCount">> }) =>
      adminApi.updateEvent(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      toast({ title: "Event updated" });
      setEditEvent(null);
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const createTeam = useMutation({
    mutationFn: () => adminApi.createTeam(teamForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "teams"] });
      toast({ title: "Team created" });
      setTeamForm({ slug: "", title: "", description: "", color: "from-primary to-orange-bright", icon: "Users", isActive: true });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const deleteTeam = useMutation({
    mutationFn: (teamId: string) => adminApi.deleteTeam(teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "teams"] });
      toast({ title: "Team deleted" });
      if (selectedTeamId) setSelectedTeamId(null);
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const updateTeam = useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: Partial<Omit<AdminTeam, "_id">> }) => adminApi.updateTeam(teamId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "teams"] });
      toast({ title: "Team updated" });
      setEditTeam(null);
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const createMember = useMutation({
    mutationFn: () => adminApi.createMember(selectedTeamId as string, memberForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members", selectedTeamId] });
      toast({ title: "Member created" });
      setMemberForm({ firstName: "", lastName: "", role: "", linkedin: "", image: "", order: 0, isActive: true });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const updateMember = useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: Partial<Omit<AdminTeamMember, "_id" | "team">> }) =>
      adminApi.updateMember(memberId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members", selectedTeamId] });
      toast({ title: "Member updated" });
      setEditMember(null);
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const deleteMember = useMutation({
    mutationFn: (memberId: string) => adminApi.deleteMember(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members", selectedTeamId] });
      toast({ title: "Member deleted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message || "Error", variant: "destructive" }),
  });

  const membersTable = useMemo(() => members || [], [members]);
  const eventsTable = useMemo(() => events || [], [events]);
  const teamsTable = useMemo(() => teams || [], [teams]);
  const regTable = useMemo<AdminRegistration[]>(() => registrations || [], [registrations]);

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Navbar />
      <main className="relative z-10 pt-16 md:pt-20">
        <div className="container mx-auto px-4 pt-8 pb-16">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Signed in as {admin?.email}</p>
            </div>
            <Button variant="outline_orange" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>

          <Tabs defaultValue="events" className="space-y-6">
            <TabsList>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="registrations">Registrations</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="members">Team Members</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Event</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input value={eventForm.slug} onChange={(e) => setEventForm((p) => ({ ...p, slug: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={eventForm.description} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input value={eventForm.time} onChange={(e) => setEventForm((p) => ({ ...p, time: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Mode</Label>
                        <Select value={eventForm.mode} onValueChange={(v) => setEventForm((p) => ({ ...p, mode: v as AdminEvent["mode"] }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Online">Online</SelectItem>
                            <SelectItem value="Offline">Offline</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={eventForm.location} onChange={(e) => setEventForm((p) => ({ ...p, location: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input value={eventForm.image} onChange={(e) => setEventForm((p) => ({ ...p, image: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Or Upload to Cloudinary</Label>
                      <input
                        id="admin-event-image-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        disabled={isUploadingEventImage}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setEventImageFileName(file.name);
                          setIsUploadingEventImage(true);
                          try {
                            const url = await uploadToCloudinary(file);
                            setEventForm((p) => ({ ...p, image: url }));
                            toast({ title: "Image uploaded" });
                          } catch (err: any) {
                            toast({ title: "Upload failed", description: err?.message || "Error", variant: "destructive" });
                          } finally {
                            setIsUploadingEventImage(false);
                            e.target.value = "";
                          }
                        }}
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline_orange"
                          size="sm"
                          disabled={isUploadingEventImage}
                          className="relative overflow-hidden"
                          onClick={() => (document.getElementById("admin-event-image-upload") as HTMLInputElement | null)?.click()}
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-primary/10 opacity-0 hover:opacity-100 transition-opacity" />
                          <span className="relative">{isUploadingEventImage ? "Uploading..." : "Upload"}</span>
                        </Button>
                        <div className="flex-1 min-w-0">
                          <div className="px-3 py-2 rounded-lg border border-border bg-secondary/30 text-xs text-muted-foreground truncate">
                            {eventImageFileName || "No file selected"}
                          </div>
                        </div>
                      </div>
                    </div>
                    {eventForm.image ? (
                      <img src={eventForm.image} alt="Event" className="w-full h-28 object-cover rounded-lg border border-border" />
                    ) : null}
                    <Button variant="hero" className="w-full" disabled={createEvent.isPending} onClick={() => createEvent.mutate()}>
                      {createEvent.isPending ? "Creating..." : "Create"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventsTable.map((e) => (
                          <TableRow key={e._id}>
                            <TableCell>{e.title}</TableCell>
                            <TableCell>{e.slug}</TableCell>
                            <TableCell>{e.registeredCount}</TableCell>
                            <TableCell className="text-right">
                              <Dialog open={editEvent?._id === e._id} onOpenChange={(open) => setEditEvent(open ? e : null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline_orange" size="sm">Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Event</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Slug</Label>
                                        <Input value={editEvent?.slug || ""} onChange={(ev) => setEditEvent((p) => (p ? { ...p, slug: ev.target.value } : p))} />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input value={editEvent?.title || ""} onChange={(ev) => setEditEvent((p) => (p ? { ...p, title: ev.target.value } : p))} />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea value={editEvent?.description || ""} onChange={(ev) => setEditEvent((p) => (p ? { ...p, description: ev.target.value } : p))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                          type="date"
                                          value={editEvent ? new Date(editEvent.date).toISOString().slice(0, 10) : ""}
                                          onChange={(ev) => setEditEvent((p) => (p ? { ...p, date: ev.target.value } as any : p))}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input value={editEvent?.time || ""} onChange={(ev) => setEditEvent((p) => (p ? { ...p, time: ev.target.value } : p))} />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Mode</Label>
                                        <Select value={(editEvent?.mode as any) || "Online"} onValueChange={(v) => setEditEvent((p) => (p ? { ...p, mode: v as any } : p))}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select mode" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Online">Online</SelectItem>
                                            <SelectItem value="Offline">Offline</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input value={editEvent?.location || ""} onChange={(ev) => setEditEvent((p) => (p ? { ...p, location: ev.target.value } : p))} />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Image URL</Label>
                                      <Input value={editEvent?.image || ""} onChange={(ev) => setEditEvent((p) => (p ? { ...p, image: ev.target.value } : p))} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Or Upload to Cloudinary</Label>
                                      <input
                                        id="admin-event-image-upload-edit"
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        disabled={isUploadingEventImage}
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          setEventImageFileName(file.name);
                                          setIsUploadingEventImage(true);
                                          try {
                                            const url = await uploadToCloudinary(file);
                                            setEditEvent((p) => (p ? { ...p, image: url } : p));
                                            toast({ title: "Image uploaded" });
                                          } catch (err: any) {
                                            toast({ title: "Upload failed", description: err?.message || "Error", variant: "destructive" });
                                          } finally {
                                            setIsUploadingEventImage(false);
                                            e.target.value = "";
                                          }
                                        }}
                                      />
                                      <div className="flex items-center gap-3">
                                        <Button
                                          type="button"
                                          variant="outline_orange"
                                          size="sm"
                                          disabled={isUploadingEventImage}
                                          className="relative overflow-hidden"
                                          onClick={() => (document.getElementById("admin-event-image-upload-edit") as HTMLInputElement | null)?.click()}
                                        >
                                          <span className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-primary/10 opacity-0 hover:opacity-100 transition-opacity" />
                                          <span className="relative">{isUploadingEventImage ? "Uploading..." : "Upload"}</span>
                                        </Button>
                                        <div className="flex-1 min-w-0">
                                          <div className="px-3 py-2 rounded-lg border border-border bg-secondary/30 text-xs text-muted-foreground truncate">
                                            {eventImageFileName || "No file selected"}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {editEvent?.image ? (
                                      <img src={editEvent.image} alt="Event" className="w-full h-28 object-cover rounded-lg border border-border" />
                                    ) : null}
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="hero"
                                      disabled={!editEvent || updateEvent.isPending}
                                      onClick={() => {
                                        if (!editEvent) return;
                                        updateEvent.mutate({
                                          eventId: editEvent._id,
                                          payload: {
                                            slug: editEvent.slug,
                                            title: editEvent.title,
                                            description: editEvent.description,
                                            date: editEvent.date,
                                            time: editEvent.time,
                                            mode: editEvent.mode,
                                            location: editEvent.location,
                                            image: editEvent.image,
                                          },
                                        });
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline_orange"
                                size="sm"
                                disabled={deleteEvent.isPending}
                                className="ml-2 border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-400/70"
                                onClick={() => deleteEvent.mutate(e._id)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="registrations">
              <Card>
                <CardHeader>
                  <CardTitle>Event-wise Registrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Event</Label>
                    <Select value={selectedEventId || ""} onValueChange={(v) => setSelectedEventId(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose event" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventsTable.map((e) => (
                          <SelectItem key={e._id} value={e._id}>
                            {e.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedEventId && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>First Name</TableHead>
                          <TableHead>Last Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regTable.map((r, idx) => (
                          <TableRow key={`${r.email}-${idx}`}>
                            <TableCell>{r.firstName}</TableCell>
                            <TableCell>{r.lastName}</TableCell>
                            <TableCell>{r.email}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline_orange"
                                size="sm"
                                onClick={() => {
                                  setProfileDialogEmail(r.email);
                                  setProfileDialogOpen(true);
                                }}
                              >
                                View Profile
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <Dialog
                    open={profileDialogOpen}
                    onOpenChange={(open) => {
                      setProfileDialogOpen(open);
                      if (!open) setProfileDialogEmail(null);
                    }}
                  >
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>User Profile</DialogTitle>
                      </DialogHeader>

                      {isUserProfileLoading ? (
                        <div className="text-sm text-muted-foreground">Loading profile...</div>
                      ) : userProfileError ? (
                        <div className="text-sm text-destructive">Failed to load profile: {(userProfileError as any)?.message || "Unknown error"}</div>
                      ) : !selectedUserProfile ? (
                        <div className="text-sm text-muted-foreground">Select a user to view profile.</div>
                      ) : (
                        <AdminUserProfileView data={selectedUserProfile} />
                      )}

                      <DialogFooter>
                        <Button variant="outline_orange" onClick={() => setProfileDialogOpen(false)}>
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Team</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input value={teamForm.slug} onChange={(e) => setTeamForm((p) => ({ ...p, slug: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={teamForm.title} onChange={(e) => setTeamForm((p) => ({ ...p, title: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={teamForm.description} onChange={(e) => setTeamForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <Input value={teamForm.color} onChange={(e) => setTeamForm((p) => ({ ...p, color: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <Input value={teamForm.icon} onChange={(e) => setTeamForm((p) => ({ ...p, icon: e.target.value }))} />
                      </div>
                    </div>
                    <Button variant="hero" className="w-full" disabled={createTeam.isPending} onClick={() => createTeam.mutate()}>
                      {createTeam.isPending ? "Creating..." : "Create"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Teams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isTeamsLoading ? (
                      <div className="text-sm text-muted-foreground">Loading teams...</div>
                    ) : teamsError ? (
                      <div className="text-sm text-destructive">Failed to load teams: {(teamsError as any)?.message || "Unknown error"}</div>
                    ) : teamsTable.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No teams found in MongoDB yet.</div>
                    ) : null}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamsTable.map((t) => (
                          <TableRow key={t._id}>
                            <TableCell>{t.title}</TableCell>
                            <TableCell>{t.slug}</TableCell>
                            <TableCell className="text-right">
                              <Dialog open={editTeam?._id === t._id} onOpenChange={(open) => setEditTeam(open ? t : null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline_orange" size="sm">Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Team</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Slug</Label>
                                        <Input value={editTeam?.slug || ""} onChange={(ev) => setEditTeam((p) => (p ? { ...p, slug: ev.target.value } : p))} />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input value={editTeam?.title || ""} onChange={(ev) => setEditTeam((p) => (p ? { ...p, title: ev.target.value } : p))} />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea value={editTeam?.description || ""} onChange={(ev) => setEditTeam((p) => (p ? { ...p, description: ev.target.value } : p))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Color</Label>
                                        <Input value={editTeam?.color || ""} onChange={(ev) => setEditTeam((p) => (p ? { ...p, color: ev.target.value } : p))} />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Icon</Label>
                                        <Input value={editTeam?.icon || ""} onChange={(ev) => setEditTeam((p) => (p ? { ...p, icon: ev.target.value } : p))} />
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="hero"
                                      disabled={!editTeam || updateTeam.isPending}
                                      onClick={() => {
                                        if (!editTeam) return;
                                        updateTeam.mutate({
                                          teamId: editTeam._id,
                                          payload: {
                                            slug: editTeam.slug,
                                            title: editTeam.title,
                                            description: editTeam.description,
                                            color: editTeam.color,
                                            icon: editTeam.icon,
                                            isActive: editTeam.isActive,
                                          },
                                        });
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button variant="outline_orange" size="sm" onClick={() => setSelectedTeamId(t._id)}>
                                Manage Members
                              </Button>
                              <Button
                                variant="outline_orange"
                                size="sm"
                                className="ml-2 border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-400/70"
                                onClick={() => deleteTeam.mutate(t._id)}
                                disabled={deleteTeam.isPending}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Team</Label>
                    <Select value={selectedTeamId || ""} onValueChange={(v) => setSelectedTeamId(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamsTable.map((t) => (
                          <SelectItem key={t._id} value={t._id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTeamId && (
                    <div className="grid lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Add Member</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>First name</Label>
                              <Input value={memberForm.firstName} onChange={(e) => setMemberForm((p) => ({ ...p, firstName: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                              <Label>Last name</Label>
                              <Input value={memberForm.lastName} onChange={(e) => setMemberForm((p) => ({ ...p, lastName: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Input value={memberForm.role} onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>LinkedIn</Label>
                              <Input value={memberForm.linkedin} onChange={(e) => setMemberForm((p) => ({ ...p, linkedin: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                              <Label>Image URL</Label>
                              <Input value={memberForm.image} onChange={(e) => setMemberForm((p) => ({ ...p, image: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Or Upload to Cloudinary</Label>
                            <input
                              id="admin-member-image-upload"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              disabled={isUploadingMemberImage}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setMemberImageFileName(file.name);
                                setIsUploadingMemberImage(true);
                                try {
                                  const url = await uploadToCloudinary(file);
                                  setMemberForm((p) => ({ ...p, image: url }));
                                  toast({ title: "Image uploaded" });
                                } catch (err: any) {
                                  toast({ title: "Upload failed", description: err?.message || "Error", variant: "destructive" });
                                } finally {
                                  setIsUploadingMemberImage(false);
                                  e.target.value = "";
                                }
                              }}
                            />
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline_orange"
                                size="sm"
                                disabled={isUploadingMemberImage}
                                className="relative overflow-hidden"
                                onClick={() => (document.getElementById("admin-member-image-upload") as HTMLInputElement | null)?.click()}
                              >
                                <span className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-primary/10 opacity-0 hover:opacity-100 transition-opacity" />
                                <span className="relative">{isUploadingMemberImage ? "Uploading..." : "Upload"}</span>
                              </Button>
                              <div className="flex-1 min-w-0">
                                <div className="px-3 py-2 rounded-lg border border-border bg-secondary/30 text-xs text-muted-foreground truncate">
                                  {memberImageFileName || "No file selected"}
                                </div>
                              </div>
                            </div>
                          </div>
                          {memberForm.image ? (
                            <img src={memberForm.image} alt="Member" className="w-24 h-24 object-cover rounded-full border border-border" />
                          ) : null}
                          <div className="space-y-2">
                            <Label>Order</Label>
                            <Input type="number" value={memberForm.order} onChange={(e) => setMemberForm((p) => ({ ...p, order: Number(e.target.value) }))} />
                          </div>
                          <Button variant="hero" className="w-full" disabled={createMember.isPending} onClick={() => createMember.mutate()}>
                            {createMember.isPending ? "Adding..." : "Add Member"}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Members List</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isMembersLoading ? (
                            <div className="text-sm text-muted-foreground">Loading members...</div>
                          ) : membersError ? (
                            <div className="text-sm text-destructive">Failed to load members: {(membersError as any)?.message || "Unknown error"}</div>
                          ) : membersTable.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No members found for this team yet.</div>
                          ) : null}
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {membersTable.map((m) => (
                                <TableRow key={m._id}>
                                  <TableCell>{m.firstName} {m.lastName}</TableCell>
                                  <TableCell>{m.role}</TableCell>
                                  <TableCell className="text-right">
                                    <Dialog open={editMember?._id === m._id} onOpenChange={(open) => setEditMember(open ? m : null)}>
                                      <DialogTrigger asChild>
                                        <Button variant="outline_orange" size="sm">Edit</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit Member</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-3">
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                              <Label>First name</Label>
                                              <Input value={editMember?.firstName || ""} onChange={(ev) => setEditMember((p) => (p ? { ...p, firstName: ev.target.value } : p))} />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Last name</Label>
                                              <Input value={editMember?.lastName || ""} onChange={(ev) => setEditMember((p) => (p ? { ...p, lastName: ev.target.value } : p))} />
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Input value={editMember?.role || ""} onChange={(ev) => setEditMember((p) => (p ? { ...p, role: ev.target.value } : p))} />
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                              <Label>LinkedIn</Label>
                                              <Input value={editMember?.linkedin || ""} onChange={(ev) => setEditMember((p) => (p ? { ...p, linkedin: ev.target.value } : p))} />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Image URL</Label>
                                              <Input value={editMember?.image || ""} onChange={(ev) => setEditMember((p) => (p ? { ...p, image: ev.target.value } : p))} />
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Or Upload to Cloudinary</Label>
                                            <input
                                              id="admin-member-image-upload-edit"
                                              type="file"
                                              accept="image/png,image/jpeg,image/jpg,image/webp"
                                              disabled={isUploadingMemberImage}
                                              className="hidden"
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setMemberImageFileName(file.name);
                                                setIsUploadingMemberImage(true);
                                                try {
                                                  const url = await uploadToCloudinary(file);
                                                  setEditMember((p) => (p ? { ...p, image: url } : p));
                                                  toast({ title: "Image uploaded" });
                                                } catch (err: any) {
                                                  toast({ title: "Upload failed", description: err?.message || "Error", variant: "destructive" });
                                                } finally {
                                                  setIsUploadingMemberImage(false);
                                                  e.target.value = "";
                                                }
                                              }}
                                            />
                                            <div className="flex items-center gap-3">
                                              <Button
                                                type="button"
                                                variant="outline_orange"
                                                size="sm"
                                                disabled={isUploadingMemberImage}
                                                className="relative overflow-hidden"
                                                onClick={() => (document.getElementById("admin-member-image-upload-edit") as HTMLInputElement | null)?.click()}
                                              >
                                                <span className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-primary/10 opacity-0 hover:opacity-100 transition-opacity" />
                                                <span className="relative">{isUploadingMemberImage ? "Uploading..." : "Upload"}</span>
                                              </Button>
                                              <div className="flex-1 min-w-0">
                                                <div className="px-3 py-2 rounded-lg border border-border bg-secondary/30 text-xs text-muted-foreground truncate">
                                                  {memberImageFileName || "No file selected"}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          {editMember?.image ? (
                                            <img src={editMember.image} alt="Member" className="w-24 h-24 object-cover rounded-full border border-border" />
                                          ) : null}
                                          <div className="space-y-2">
                                            <Label>Order</Label>
                                            <Input
                                              type="number"
                                              value={editMember?.order ?? 0}
                                              onChange={(ev) => setEditMember((p) => (p ? { ...p, order: Number(ev.target.value) } : p))}
                                            />
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button
                                            variant="hero"
                                            disabled={!editMember || updateMember.isPending}
                                            onClick={() => {
                                              if (!editMember) return;
                                              updateMember.mutate({
                                                memberId: editMember._id,
                                                payload: {
                                                  firstName: editMember.firstName,
                                                  lastName: editMember.lastName,
                                                  role: editMember.role,
                                                  linkedin: editMember.linkedin,
                                                  image: editMember.image,
                                                  order: editMember.order,
                                                  isActive: editMember.isActive,
                                                },
                                              });
                                            }}
                                          >
                                            Save
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="outline_orange"
                                      size="sm"
                                      className="ml-2 border-red-500/50 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-400/70"
                                      disabled={deleteMember.isPending}
                                      onClick={() => deleteMember.mutate(m._id)}
                                    >
                                      Delete
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-sm text-muted-foreground">
            Admin-only area. If you are not an admin, you should not have access.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;