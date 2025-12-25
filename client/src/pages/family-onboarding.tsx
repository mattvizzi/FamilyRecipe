import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Users, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function FamilyOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [familyName, setFamilyName] = useState("");

  const createFamilyMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/family", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family"] });
      navigate("/");
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to create family. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (familyName.trim()) {
      createFamilyMutation.mutate(familyName.trim());
    }
  };

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
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              <Users className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2" data-testid="text-title">
              Create Your Family Cookbook
            </h1>
            <p className="text-muted-foreground">
              Give your family's recipe collection a name
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="familyName" className="block text-sm font-medium mb-2">
                    Family Name
                  </label>
                  <Input
                    id="familyName"
                    type="text"
                    placeholder="e.g., The Smith Family"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="text-lg"
                    autoFocus
                    data-testid="input-family-name"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    You can change this later in settings
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={!familyName.trim() || createFamilyMutation.isPending}
                  data-testid="button-create-family"
                >
                  {createFamilyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Family
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
