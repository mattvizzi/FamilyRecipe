import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Users, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Family } from "@shared/schema";

export default function JoinFamily() {
  const [, params] = useRoute("/join/:code");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const inviteCode = params?.code;

  const { data: familyInfo, isLoading: familyLoading, error: familyError } = useQuery<{ name: string; memberCount: number }>({
    queryKey: ["/api/family/invite", inviteCode],
    enabled: !!inviteCode && !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/family/join/${inviteCode}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family"] });
      toast({ title: "Joined!", description: "You've joined the family successfully" });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to join family", 
        variant: "destructive" 
      });
    },
  });

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
          <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-primary">Family</span>
              <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center pt-16 px-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                You need to sign in to join this family
              </p>
              <Button asChild className="w-full" data-testid="button-login-to-join">
                <a href={`/api/login?returnTo=/join/${inviteCode}`}>Sign In to Continue</a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (familyLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
          <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-primary">Family</span>
              <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center pt-16 px-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto mb-6" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (familyError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
          <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-primary">Family</span>
              <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center pt-16 px-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Invalid Invite Link</h2>
              <p className="text-muted-foreground mb-6">
                This invite link is invalid or has expired
              </p>
              <Button onClick={() => navigate("/")} data-testid="button-go-home">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-primary">Family</span>
            <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
              >
                <Users className="h-8 w-8 text-primary" />
              </motion.div>
              
              <h2 className="text-xl font-bold mb-2" data-testid="text-family-name">
                Join {familyInfo?.name}
              </h2>
              <p className="text-muted-foreground mb-6">
                {familyInfo?.memberCount} member{familyInfo?.memberCount !== 1 ? "s" : ""} already in this family
              </p>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="w-full"
                  data-testid="button-join"
                >
                  {joinMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Join Family
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
