import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Camera, Users, Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import heroImage from "@assets/ChatGPT_Image_Dec_24,_2025,_11_46_48_PM_1766638042461.png";
import { RecipeShowcaseCarousel } from "@/components/recipe-showcase-carousel";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary h-14">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-white">Family</span>
            <span className="text-xl font-light text-white/90 tracking-tight">Recipe</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-white hover:bg-white/10" />
            <Button asChild variant="secondary" data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-14">
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm text-primary font-medium mb-6">
                  <Sparkles className="h-4 w-4" />
                  <span>AI-Powered Recipe Management</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
                  Family Recipes,
                  <span className="text-primary"> preserved forever.</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  The smart way to digitize, organize, and share your family's culinary traditions. 
                  Scan any recipe and let AI do the rest.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <Button size="lg" asChild className="gap-2" data-testid="button-get-started">
                    <a href="/api/login">
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild data-testid="button-how-it-works">
                    <a href="#features">Learn More</a>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Free to start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>AI-powered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Family sharing</span>
                  </div>
                </div>
              </div>
              <div className="relative lg:pl-8">
                <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-border">
                  <img 
                    src={heroImage} 
                    alt="Home cooking with love" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <RecipeShowcaseCarousel />

        <section id="features" className="py-16 px-6 bg-card scroll-mt-14">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary mb-2">FEATURES</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Everything you need to preserve recipes
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                From handwritten cards to perfectly organized digital recipes in seconds
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-background rounded-lg p-6 border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Scan Anything</h3>
                <p className="text-sm text-muted-foreground">
                  Photos, handwritten cards, websites, or typed text. Our AI extracts it all.
                </p>
              </div>
              <div className="bg-background rounded-lg p-6 border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically parse ingredients, instructions, and even generate beautiful photos.
                </p>
              </div>
              <div className="bg-background rounded-lg p-6 border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Share with Family</h3>
                <p className="text-sm text-muted-foreground">
                  Invite family members to view, add, and cook recipes together.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary mb-2">HOW IT WORKS</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Three simple steps
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Take a photo or paste a URL
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">AI Extracts</h3>
                <p className="text-sm text-muted-foreground">
                  Ingredients and steps parsed automatically
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Cook & Share</h3>
                <p className="text-sm text-muted-foreground">
                  Access anywhere, share with family
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-primary">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to preserve your family recipes?
            </h2>
            <p className="text-white/80 mb-8">
              Join thousands of families keeping their culinary traditions alive.
            </p>
            <Button size="lg" variant="secondary" asChild data-testid="button-cta-bottom">
              <a href="/api/login">Get Started Free</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-6 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-lg font-bold tracking-tight">Family</span>
            <span className="text-lg font-light text-primary tracking-tight">Recipe</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by AI. Made with love.
          </p>
        </div>
      </footer>
    </div>
  );
}
