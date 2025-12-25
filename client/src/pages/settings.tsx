import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Users, 
  Link as LinkIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Sun,
  Moon,
  Download,
  Trash2,
  Mail,
  Phone,
  Scale
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import type { FamilyWithMembers } from "@shared/schema";
import { SEO } from "@/components/seo";

type SettingsSection = "profile" | "notifications" | "data-privacy" | "family" | "subscription";

const settingsNav = [
  { id: "profile" as const, label: "Profile", icon: User },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "data-privacy" as const, label: "Data & Privacy", icon: Shield },
  { id: "family" as const, label: "My Family", icon: Users },
  { id: "subscription" as const, label: "Subscription", icon: CreditCard },
];

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [copied, setCopied] = useState(false);

  const { data: family, isLoading: familyLoading } = useQuery<FamilyWithMembers>({
    queryKey: ["/api/family/details"],
  });

  const updateFamilyMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("PATCH", "/api/family", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family/details"] });
      toast({ title: "Updated", description: "Family name updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update family name", variant: "destructive" });
    },
  });

  const copyInviteLink = async () => {
    if (!family?.inviteCode) return;
    
    const link = `${window.location.origin}/join/${family.inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Copied", description: "Invite link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const inviteLink = family?.inviteCode ? `${window.location.origin}/join/${family.inviteCode}` : "";

  return (
    <>
      <SEO 
        title="Settings | Family Recipe"
        description="Manage your profile, notifications, privacy settings, and family membership."
      />
      <main className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={() => navigate("/home")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-2xl font-bold mb-6" data-testid="text-settings-title">Settings</h1>

          <div className="flex flex-col md:flex-row gap-6">
            <nav className="md:w-56 flex-shrink-0">
              <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                {settingsNav.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`justify-start gap-2 whitespace-nowrap ${
                      activeSection === item.id ? "bg-accent text-accent-foreground" : ""
                    }`}
                    onClick={() => setActiveSection(item.id)}
                    data-testid={`nav-${item.id}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </nav>

            <div className="flex-1 min-w-0">
              {activeSection === "profile" && (
                <ProfileSection user={user} theme={theme} setTheme={setTheme} />
              )}

              {activeSection === "notifications" && (
                <NotificationsSection />
              )}

              {activeSection === "data-privacy" && (
                <DataPrivacySection />
              )}

              {activeSection === "family" && (
                <FamilySection
                  family={family}
                  isLoading={familyLoading}
                  inviteLink={inviteLink}
                  copied={copied}
                  copyInviteLink={copyInviteLink}
                  updateFamilyMutation={updateFamilyMutation}
                  getInitials={getInitials}
                />
              )}

              {activeSection === "subscription" && (
                <SubscriptionSection />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

interface ProfileSectionProps {
  user: any;
  theme: string;
  setTheme: (theme: string) => void;
}

function ProfileSection({ user, theme, setTheme }: ProfileSectionProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      return apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Updated", description: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ firstName, lastName });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and how others see you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16" data-testid="img-profile-avatar">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-lg">
                {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium" data-testid="text-profile-name">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-muted-foreground" data-testid="text-profile-email">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="pl-10"
                data-testid="input-phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              className="resize-none"
              rows={3}
              data-testid="input-bio"
            />
          </div>

          <Button 
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Your account is managed through Replit authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted" data-testid="container-auth-email">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground" data-testid="text-auth-email">{user?.email || "Not available"}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Password management is handled through your Replit account settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the app looks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Currently using dark theme" : "Currently using light theme"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              data-testid="switch-theme"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Recipe Processing Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when your recipe is done processing
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-processing-alerts" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Family Activity</p>
              <p className="text-sm text-muted-foreground">
                Notifications when family members add recipes
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-family-activity" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Comments & Ratings</p>
              <p className="text-sm text-muted-foreground">
                Get notified about activity on your recipes
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-comments-ratings" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email updates about important activity
              </p>
            </div>
            <Switch data-testid="switch-email-notifications" />
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Notification settings will be saved automatically. More notification options coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DataPrivacySection() {
  const { toast } = useToast();
  const [units, setUnits] = useState("metric");

  const handleExportRecipes = async () => {
    toast({ title: "Export Started", description: "Your recipes are being prepared for download..." });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Units & Measurements
          </CardTitle>
          <CardDescription>
            Choose your preferred measurement system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Measurement System</Label>
              <Select value={units} onValueChange={setUnits}>
                <SelectTrigger className="w-full sm:w-64" data-testid="select-units">
                  <SelectValue placeholder="Select units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (grams, ml, celsius)</SelectItem>
                  <SelectItem value="imperial">Imperial (oz, cups, fahrenheit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              This setting affects how ingredient amounts and temperatures are displayed.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your recipes and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export all your family recipes as a JSON file or PDF collection. This includes all recipe details, ingredients, instructions, and images.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportRecipes} data-testid="button-export-json">
              <Download className="h-4 w-4 mr-2" />
              Export as JSON
            </Button>
            <Button variant="outline" onClick={handleExportRecipes} data-testid="button-export-pdf">
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control your data and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Public Profile</p>
              <p className="text-sm text-muted-foreground">
                Allow others to see your name on shared recipes
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-public-profile" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Recipe Attribution</p>
              <p className="text-sm text-muted-foreground">
                Show your name as the creator on public recipes
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-recipe-attribution" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account will remove all your data, including recipes you've created. This action cannot be undone.
          </p>
          <Button variant="destructive" data-testid="button-delete-account">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface FamilySectionProps {
  family: FamilyWithMembers | undefined;
  isLoading: boolean;
  inviteLink: string;
  copied: boolean;
  copyInviteLink: () => void;
  updateFamilyMutation: any;
  getInitials: (firstName?: string | null, lastName?: string | null) => string;
}

function FamilySection({
  family,
  isLoading,
  inviteLink,
  copied,
  copyInviteLink,
  updateFamilyMutation,
  getInitials,
}: FamilySectionProps) {
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No Family Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create or join a family first.
            </p>
            <Button onClick={() => navigate("/create-family")} data-testid="button-create-family">
              Create a Family
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Family Name</CardTitle>
          <CardDescription>
            This is how your family will be identified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              defaultValue={family.name}
              onBlur={(e) => {
                if (e.target.value !== family.name) {
                  updateFamilyMutation.mutate(e.target.value);
                }
              }}
              className="flex-1"
              data-testid="input-family-name"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Invite Link
          </CardTitle>
          <CardDescription>
            Share this link with family members to invite them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={inviteLink}
              readOnly
              className="flex-1 font-mono text-sm"
              aria-label="Family invite link"
              data-testid="input-invite-link"
            />
            <Button 
              variant="outline"
              onClick={copyInviteLink}
              aria-label={copied ? "Link copied" : "Copy invite link"}
              data-testid="button-copy-invite"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Members
          </CardTitle>
          <CardDescription data-testid="text-member-count">
            {family.members.length} member{family.members.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {family.members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-muted hover-elevate transition-colors"
                data-testid={`member-${member.userId}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {getInitials(member.firstName, member.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {member.firstName} {member.lastName}
                  </p>
                </div>
                {member.userId === family.createdById && (
                  <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                    Creator
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-accent/50 border border-accent" data-testid="container-current-plan">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold" data-testid="text-plan-name">Free Plan</h3>
              <span className="text-sm text-muted-foreground" data-testid="text-plan-status">Current</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You're currently on the free plan with access to all basic features.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">What's Included:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent-green" />
                Unlimited recipe storage
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent-green" />
                AI-powered recipe extraction
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent-green" />
                Family collaboration
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent-green" />
                Recipe sharing
              </li>
            </ul>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Premium plans with additional features are coming soon. Stay tuned for meal planning, advanced analytics, and more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
