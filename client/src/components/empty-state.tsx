import { Button } from "@/components/ui/button";
import { Camera, Link as LinkIcon, FileText, Plus, BookOpen } from "lucide-react";
import { Link } from "wouter";

interface EmptyStateProps {
  familyName: string;
}

export function EmptyState({ familyName }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2" data-testid="text-empty-title">
          Welcome to {familyName}!
        </h2>
        <p className="text-muted-foreground mb-6" data-testid="text-empty-description">
          Your family cookbook is waiting. Add your first recipe to get started.
        </p>

        <Button asChild size="lg" className="gap-2 mb-8" data-testid="button-add-first-recipe">
          <Link href="/add-recipe">
            <Plus className="h-5 w-5" />
            Add Your First Recipe
          </Link>
        </Button>

        <div className="border-t border-border pt-8">
          <p className="text-sm font-medium mb-4">You can add recipes by:</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Taking a photo</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <LinkIcon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Pasting a URL</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Typing it in</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
