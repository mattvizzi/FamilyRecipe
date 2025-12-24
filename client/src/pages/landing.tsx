import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChefHat, Camera, Users, Sparkles, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base">Recipe Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-Powered Recipe Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Your Family Recipes,
              <span className="text-primary block mt-2">Beautifully Organized</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Scan recipes from photos, websites, or handwritten notes. Our AI extracts every ingredient and instruction, 
              keeping your family's culinary heritage organized and accessible.
            </p>
            <Button size="lg" asChild className="gap-2" data-testid="button-get-started">
              <a href="/api/login">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        <section className="py-20 px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-center mb-3">How It Works</p>
            <h2 className="text-3xl font-bold text-center mb-4">Add recipes in seconds</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
              Our AI-powered wizard makes digitizing recipes effortless
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center border border-border">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-5">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-2">1. Upload or Scan</CardTitle>
                  <CardDescription className="text-sm">
                    Take a photo, upload an image, paste text, or share a URL
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center border border-border">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-2">2. AI Magic</CardTitle>
                  <CardDescription className="text-sm">
                    Our AI extracts ingredients, instructions, and generates a beautiful photo
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center border border-border">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-5">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-2">3. Share & Cook</CardTitle>
                  <CardDescription className="text-sm">
                    Access recipes anywhere, share with family, and cook together
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to organize your recipes?</h2>
            <p className="text-muted-foreground mb-8">
              Join families who trust Recipe Tracker to preserve their culinary traditions.
            </p>
            <Button size="lg" asChild data-testid="button-cta-bottom">
              <a href="/api/login">Start Your Family Cookbook</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Recipe Tracker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by AI. Made with love.
          </p>
        </div>
      </footer>
    </div>
  );
}
