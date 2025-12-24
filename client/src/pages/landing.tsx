import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChefHat, Camera, Users, Sparkles, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-primary" />
            <span className="font-semibold text-lg">Recipe Tracker</span>
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
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Recipe Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Family Recipes,
              <span className="text-primary block mt-2">Beautifully Organized</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Scan recipes from photos, websites, or handwritten notes. Our AI extracts every ingredient and instruction, 
              keeping your family's culinary heritage organized and accessible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="gap-2" data-testid="button-get-started">
                <a href="/api/login">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-card">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Add recipes in seconds using our AI-powered wizard
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>1. Upload or Scan</CardTitle>
                  <CardDescription>
                    Take a photo, upload an image, paste text, or share a URL
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>2. AI Magic</CardTitle>
                  <CardDescription>
                    Our AI extracts ingredients, instructions, and generates a beautiful photo
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>3. Share & Cook</CardTitle>
                  <CardDescription>
                    Access recipes anywhere, share with family, and cook together
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to organize your recipes?</h2>
            <p className="text-muted-foreground mb-8">
              Join families who trust Recipe Tracker to preserve their culinary traditions.
            </p>
            <Button size="lg" asChild data-testid="button-cta-bottom">
              <a href="/api/login">Start Your Family Cookbook</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-muted-foreground" />
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
