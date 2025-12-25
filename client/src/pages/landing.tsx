import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Link as LinkIcon, FileText, PenLine, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-primary mb-2">ADD RECIPES YOUR WAY</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Four ways to add recipes
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Whether it's a photo, a link, or just text - we've got you covered
              </p>
            </div>
            
            <Tabs defaultValue="photo" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="photo" className="gap-2 text-xs sm:text-sm">
                  <Camera className="h-4 w-4 hidden sm:block" />
                  Photo
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2 text-xs sm:text-sm">
                  <LinkIcon className="h-4 w-4 hidden sm:block" />
                  Website
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2 text-xs sm:text-sm">
                  <FileText className="h-4 w-4 hidden sm:block" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2 text-xs sm:text-sm">
                  <PenLine className="h-4 w-4 hidden sm:block" />
                  Manual
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="photo" className="mt-0">
                <div className="bg-background rounded-lg p-8 border border-border">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Camera className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-xl font-semibold mb-3">Upload or Take a Photo</h3>
                      <p className="text-muted-foreground mb-4">
                        Snap a picture of any recipe - from grandma's handwritten cards to cookbook pages. 
                        Our AI can read even the messiest handwriting and extract all the ingredients and instructions perfectly.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Works with handwritten recipes (even bad handwriting!)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Scan cookbook pages or printed recipes
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          AI generates a beautiful photo for your recipe
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="mt-0">
                <div className="bg-background rounded-lg p-8 border border-border">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-xl font-semibold mb-3">Add from Another Website</h3>
                      <p className="text-muted-foreground mb-4">
                        Found a great recipe online? Just paste the URL and we'll extract everything automatically.
                        No more losing bookmarks or dealing with annoying pop-ups when you want to cook.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Works with most recipe websites
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Extracts ingredients, steps, and timing
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Keep your favorite recipes forever
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="mt-0">
                <div className="bg-background rounded-lg p-8 border border-border">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-xl font-semibold mb-3">Paste Text from Anywhere</h3>
                      <p className="text-muted-foreground mb-4">
                        Have a recipe in your notes, messages, or emails? Just copy and paste the text.
                        Our AI will parse it and organize everything into a beautiful, easy-to-follow format.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Paste from notes, messages, or documents
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          AI structures messy text into clean recipes
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Works with any format or language
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="manual" className="mt-0">
                <div className="bg-background rounded-lg p-8 border border-border">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <PenLine className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-xl font-semibold mb-3">Add Manually</h3>
                      <p className="text-muted-foreground mb-4">
                        Want full control? Enter your recipe step by step with our easy-to-use form.
                        Perfect for your own creations or when you want to customize every detail.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Full control over every field
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Add multiple ingredient groups
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          Upload your own photos
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
