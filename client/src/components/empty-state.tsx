import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Camera, Link as LinkIcon, FileText, Plus } from "lucide-react";
import { Link } from "wouter";

interface EmptyStateProps {
  familyName: string;
}

export function EmptyState({ familyName }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-8">
        <ChefHat className="h-16 w-16 text-primary" />
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-2" data-testid="text-empty-title">
        Welcome to {familyName}!
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8" data-testid="text-empty-description">
        Your family cookbook is empty. Let's add your first recipe!
      </p>

      <Button asChild size="lg" className="gap-2 mb-12" data-testid="button-add-first-recipe">
        <Link href="/add-recipe">
          <Plus className="h-5 w-5" />
          Add Your First Recipe
        </Link>
      </Button>

      <div className="w-full max-w-3xl">
        <h3 className="text-lg font-semibold text-center mb-6">
          Getting Started Guide
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-base">Scan Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Take a photo of a recipe from a cookbook or handwritten card
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                <LinkIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-base">Paste URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share a link from your favorite recipe website
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-base">Type or Paste</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Paste recipe text or type it manually
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
