import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Camera, Users, Sparkles, ArrowRight, Heart, BookOpen, Share2 } from "lucide-react";
import heroImage from "@assets/ChatGPT_Image_Dec_24,_2025,_11_46_48_PM_1766638042461.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight">Family</span>
            <span className="text-xl font-light text-primary tracking-tight">Recipe</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-14">
        <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          <div className="relative z-10 w-full px-6 py-20">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white/90 mb-8">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>Made with love for families</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Grandma's Recipes,
                  <span className="text-primary block mt-2">Preserved Forever</span>
                </h1>
                <p className="text-lg text-white/80 mb-10 leading-relaxed">
                  Keep your family's culinary traditions alive. Scan handwritten recipe cards, 
                  organize treasured dishes, and share the love of home cooking across generations.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" asChild className="gap-2" data-testid="button-get-started">
                    <a href="/api/login">
                      Start Your Cookbook
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="bg-white/10 border-white/30 text-white" data-testid="button-how-it-works">
                    <a href="#how-it-works">See How It Works</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-card">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              More than just recipes
            </h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
              Every dish tells a story. Preserve the memories, the handwritten notes, 
              and the love that goes into every family recipe.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Digital Cookbook</h3>
                <p className="text-sm text-muted-foreground">
                  All your recipes in one beautiful, searchable place
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Family Heritage</h3>
                <p className="text-sm text-muted-foreground">
                  Pass down traditions from generation to generation
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Share & Collaborate</h3>
                <p className="text-sm text-muted-foreground">
                  Invite family members to add and enjoy recipes together
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-6 scroll-mt-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-medium uppercase tracking-wide text-primary text-center mb-3">How It Works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Add recipes in seconds</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
              Our AI-powered wizard makes digitizing recipes effortless
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center border border-border">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-2">1. Upload or Scan</CardTitle>
                  <CardDescription className="text-sm">
                    Take a photo of grandma's handwritten card, upload an image, or paste from a website
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center border border-border">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-2">2. AI Magic</CardTitle>
                  <CardDescription className="text-sm">
                    Our AI extracts ingredients, instructions, and even generates a beautiful photo
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center border border-border">
                <CardHeader className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-2">3. Share & Cook</CardTitle>
                  <CardDescription className="text-sm">
                    Access recipes from any device, share with family, and cook together
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-card">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to preserve your family recipes?</h2>
            <p className="text-muted-foreground mb-8">
              Join families who trust FamilyRecipe to keep their culinary traditions alive.
            </p>
            <Button size="lg" asChild data-testid="button-cta-bottom">
              <a href="/api/login">Start Your Family Cookbook</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
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
