import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Link as LinkIcon, FileText, PenLine, ArrowRight, CheckCircle, Sparkles, Clock, Users, Minus, Plus, Copy, FileDown } from "lucide-react";
import heroImage from "@assets/ChatGPT_Image_Dec_24,_2025,_11_46_48_PM_1766638042461.png";
import carbonaraImage from "@assets/generated_images/spaghetti_carbonara_dish.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
              <TabsList className="flex justify-center gap-3 bg-transparent mb-8">
                <TabsTrigger value="photo" className="bg-primary text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2 text-sm font-medium">
                  Photo
                </TabsTrigger>
                <TabsTrigger value="url" className="bg-primary text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2 text-sm font-medium">
                  Website
                </TabsTrigger>
                <TabsTrigger value="text" className="bg-primary text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2 text-sm font-medium">
                  Text
                </TabsTrigger>
                <TabsTrigger value="manual" className="bg-primary text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2 text-sm font-medium">
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
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-primary mb-2">RECIPE VIEW</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Beautiful, functional recipe pages
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Every recipe is organized perfectly with scaling, export options, and more
              </p>
            </div>
            
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="aspect-square md:aspect-auto">
                  <img 
                    src={carbonaraImage} 
                    alt="Spaghetti Carbonara" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">Dinner</Badge>
                      <h3 className="text-2xl font-bold">Spaghetti Carbonara</h3>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span className="font-data">15 min prep</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span className="font-data">20 min cook</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span className="font-data">4 servings</span>
                    </div>
                  </div>
                  
                  <Card className="border border-border mb-4">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base font-semibold">Ingredients</CardTitle>
                        <div className="flex items-center gap-0.5 border border-border rounded-lg">
                          <Button variant="ghost" size="icon" disabled>
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-10 text-center text-sm font-data">1x</span>
                          <Button variant="ghost" size="icon">
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1.5 text-sm">
                        <li className="flex gap-2">
                          <span className="font-data text-muted-foreground w-16">400g</span>
                          <span>spaghetti</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-data text-muted-foreground w-16">200g</span>
                          <span>guanciale</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-data text-muted-foreground w-16">4</span>
                          <span>egg yolks</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-data text-muted-foreground w-16">100g</span>
                          <span>pecorino romano</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileDown className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </div>
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

      <footer className="py-6 px-6 bg-black">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-white">Family</span>
            <span className="text-lg font-light text-white/80 tracking-tight">Recipe</span>
          </div>
          <p className="text-sm text-white/60">
            Made with love.
          </p>
        </div>
      </footer>
    </div>
  );
}
