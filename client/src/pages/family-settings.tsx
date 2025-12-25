import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Copy, Check, Users, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FamilyWithMembers, Family } from "@shared/schema";

export default function FamilySettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: family, isLoading } = useQuery<FamilyWithMembers>({
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

  if (isLoading) {
    return (
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!family) {
    return (
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No Family Found</h1>
          <p className="text-muted-foreground mb-6">
            You need to create or join a family first.
          </p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </main>
    );
  }

  const inviteLink = `${window.location.origin}/join/${family.inviteCode}`;

  return (
    <main className="pt-24 pb-12 px-6">
      <div className="max-w-xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </Button>

          <h1 className="text-2xl font-bold mb-6">Family Settings</h1>

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
                    data-testid="input-invite-link"
                  />
                  <Button 
                    variant="outline"
                    onClick={copyInviteLink}
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
                <CardDescription>
                  {family.members.length} member{family.members.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {family.members.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted"
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
        </div>
      </div>
    </main>
  );
}
