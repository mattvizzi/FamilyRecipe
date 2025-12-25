import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Camera, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OnboardingStatus {
  needsOnboarding: boolean;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export default function UserOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: status, isLoading: statusLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/user/onboarding-status"],
  });
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageData, setProfileImageData] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  if (status && !initialized) {
    setFirstName(status.firstName || "");
    setLastName(status.lastName || "");
    if (status.profileImageUrl) {
      setProfileImagePreview(status.profileImageUrl);
    }
    setInitialized(true);
  }
  
  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; profileImageData?: string }) => {
      return apiRequest("POST", "/api/user/complete-onboarding", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/onboarding-status"] });
      navigate("/create-family");
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save your profile. Please try again.", 
        variant: "destructive" 
      });
    },
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfileImagePreview(dataUrl);
      setProfileImageData(dataUrl);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim()) {
      completeOnboardingMutation.mutate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileImageData: profileImageData || undefined,
      });
    }
  };
  
  if (statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-primary">Family</span>
            <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-16 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              <User className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2" data-testid="text-title">
              Welcome to FamilyRecipe
            </h1>
            <p className="text-muted-foreground">
              Let's set up your profile
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      {profileImagePreview ? (
                        <AvatarImage src={profileImagePreview} alt="Profile" />
                      ) : null}
                      <AvatarFallback className="text-2xl bg-muted">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground border-2 border-background"
                      data-testid="button-change-photo"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      data-testid="input-profile-image"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add a profile photo
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoFocus
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={!firstName.trim() || !lastName.trim() || completeOnboardingMutation.isPending}
                  data-testid="button-continue"
                >
                  {completeOnboardingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
