import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChefHat, Camera, Users, Sparkles, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-lg headline">Recipe Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild className="rounded-full px-6 btn-glow" data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="py-32 px-8 bg-radial-light">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel text-primary mb-10">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Recipe Management</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 headline">
              Your Family Recipes,
              <span className="text-primary block mt-3">Beautifully Organized</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Scan recipes from photos, websites, or handwritten notes. Our AI extracts every ingredient and instruction, 
              keeping your family's culinary heritage organized and accessible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="rounded-full px-8 py-6 text-lg gap-3 btn-glow" data-testid="button-get-started">
                <a href="/api/login">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <p className="label-meta text-center mb-4">How It Works</p>
            <h2 className="text-4xl font-bold text-center mb-6 headline">Add recipes in seconds</h2>
            <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
              Our AI-powered wizard makes digitizing recipes effortless
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center premium-card border-0 p-2">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Camera className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl headline mb-2">1. Upload or Scan</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Take a photo, upload an image, paste text, or share a URL
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center premium-card border-0 p-2">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl headline mb-2">2. AI Magic</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Our AI extracts ingredients, instructions, and generates a beautiful photo
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center premium-card border-0 p-2">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl headline mb-2">3. Share & Cook</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Access recipes anywhere, share with family, and cook together
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 headline">Ready to organize your recipes?</h2>
            <p className="text-muted-foreground mb-10 text-lg">
              Join families who trust Recipe Tracker to preserve their culinary traditions.
            </p>
            <Button size="lg" asChild className="rounded-full px-8 py-6 text-lg btn-glow" data-testid="button-cta-bottom">
              <a href="/api/login">Start Your Family Cookbook</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-10 px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
