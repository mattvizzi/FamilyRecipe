import { Button } from "@/components/ui/button";
import { Camera, Link as LinkIcon, FileText, Plus, ChefHat, Sparkles, Heart } from "lucide-react";
import { Link } from "wouter";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="max-w-lg w-full text-center">
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ChefHat className="h-14 w-14 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent-rose/20 flex items-center justify-center">
            <Heart className="h-4 w-4 text-accent-rose" />
          </div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-accent-green" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-3">Start Your Family Cookbook</h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto" data-testid="text-empty-description">
          Your family's recipes deserve a special place. Add your first recipe and begin preserving your culinary traditions.
        </p>

        <Button asChild size="lg" className="gap-2 mb-10" data-testid="button-add-first-recipe">
          <Link href="/add-recipe">
            <Plus className="h-5 w-5" />
            Add Your First Recipe
          </Link>
        </Button>

        <div className="border-t border-border pt-8">
          <p className="text-sm font-medium text-muted-foreground mb-5">Add recipes in seconds using:</p>
          <div className="grid grid-cols-3 gap-6 max-w-xs mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 hover-elevate transition-colors">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Photo</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 hover-elevate transition-colors">
                <LinkIcon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">URL</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 hover-elevate transition-colors">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Text</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
