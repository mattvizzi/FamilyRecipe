import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Camera, Link as LinkIcon, FileText, PenLine, ArrowRight, CheckCircle, Sparkles, Clock, Users, Minus, Plus, Copy, FileDown, Upload, Wand2, ChefHat, UserPlus, Share2, BookOpen, Mail, Quote } from "lucide-react";
import heroImage from "@assets/ChatGPT_Image_Dec_24,_2025,_11_46_48_PM_1766638042461.png";
import carbonaraImage from "@assets/generated_images/spaghetti_carbonara_dish.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RecipeShowcaseCarousel } from "@/components/recipe-showcase-carousel";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-primary">Family</span>
            <span className="text-xl font-light text-foreground tracking-tight">Recipe</span>
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
        <section className="py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
                  Family Recipes,
                  <span className="text-primary"> preserved forever.</span>
                </h1>
                
                <div className="lg:hidden relative mb-8">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-border">
                    <img 
                      src={heroImage} 
                      alt="Home cooking with love" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
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
              <div className="relative lg:pl-8 hidden lg:block">
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

        <section className="py-20 px-4 sm:px-6 bg-section-alt">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                From photo to cookbook in seconds
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Our AI does the heavy lifting so you can focus on cooking
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="relative bg-card rounded-lg p-6 border border-border">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="pt-4">
                  <div className="w-full h-32 rounded-lg bg-muted mb-4 flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <span className="text-sm text-muted-foreground">Upload photo</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Capture any recipe</h3>
                  <p className="text-sm text-muted-foreground">
                    Photo, URL, or paste text. Even messy handwriting works.
                  </p>
                </div>
              </div>
              
              <div className="relative bg-card rounded-lg p-6 border border-border">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-accent-green text-accent-green-foreground flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="pt-4">
                  <div className="w-full h-32 rounded-lg bg-primary/10 mb-4 flex items-center justify-center relative overflow-hidden">
                    <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">AI extracts everything</h3>
                  <p className="text-sm text-muted-foreground">
                    Ingredients, steps, timing, and even generates a photo.
                  </p>
                </div>
              </div>
              
              <div className="relative bg-card rounded-lg p-6 border border-border">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-accent-rose text-accent-rose-foreground flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="pt-4">
                  <div className="w-full h-32 rounded-lg bg-muted mb-4 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-accent-green/20 border-2 border-card" />
                        <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-card" />
                        <div className="w-8 h-8 rounded-full bg-accent-rose/20 border-2 border-card" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Share with family</h3>
                  <p className="text-sm text-muted-foreground">
                    Everyone can access, cook, and add their own recipes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 px-4 sm:px-6 bg-card scroll-mt-14">
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
              <TabsList className="flex justify-center gap-1 mb-8">
                <TabsTrigger value="photo">
                  Photo
                </TabsTrigger>
                <TabsTrigger value="url">
                  Website
                </TabsTrigger>
                <TabsTrigger value="text">
                  Text
                </TabsTrigger>
                <TabsTrigger value="manual">
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

        <section className="py-16 px-4 sm:px-6">
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

        <section className="py-20 px-4 sm:px-6 bg-section-alt">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-semibold tracking-widest text-accent-green uppercase mb-3">Family Sharing</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  One cookbook for everyone
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent-green text-accent-green-foreground flex items-center justify-center flex-shrink-0">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Easy Invites</h3>
                      <p className="text-sm text-muted-foreground">Share a link and they're in. No complicated setup.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Collaborate</h3>
                      <p className="text-sm text-muted-foreground">Everyone adds their favorites. See who contributed each dish.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent-rose text-accent-rose-foreground flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Access Anywhere</h3>
                      <p className="text-sm text-muted-foreground">Any device, any time. At home or at a family gathering.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-full bg-accent-green/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-accent-green" />
                    </div>
                    <div>
                      <p className="font-medium">The Johnson Family</p>
                      <p className="text-xs text-muted-foreground">12 members</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-accent-green/20 text-accent-green">GM</AvatarFallback></Avatar>
                      <span className="text-sm">Grandma added <span className="font-medium text-accent-green">Apple Pie</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/20 text-primary">MJ</AvatarFallback></Avatar>
                      <span className="text-sm">Mom added <span className="font-medium text-primary">Thanksgiving Stuffing</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-accent-rose/20 text-accent-rose">SJ</AvatarFallback></Avatar>
                      <span className="text-sm">Sarah added <span className="font-medium text-accent-rose">Chocolate Cookies</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-card">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-widest text-accent-rose uppercase mb-3">Loved by Families</p>
              <h2 className="text-3xl md:text-4xl font-bold">
                What people are saying
              </h2>
            </div>
            
            <div className="relative mb-10 p-8 rounded-lg bg-background border-l-4 border-accent-rose">
              <Quote className="absolute top-6 left-6 h-12 w-12 text-accent-rose/20" />
              <blockquote className="relative z-10 text-lg md:text-xl leading-relaxed mb-6 pl-8">
                "I finally digitized my grandmother's handwritten recipe cards. The AI read her cursive perfectly - even the notes in the margins. Now my kids can access them anytime."
              </blockquote>
              <div className="flex items-center gap-4 pl-8">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-accent-rose text-accent-rose-foreground font-medium">MR</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Maria Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Chicago, IL</p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-background border border-border">
                <p className="text-muted-foreground mb-4">
                  "Our family is spread across three states. Now everyone contributes recipes and we actually use them. No more lost bookmarks."
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent-green/20 text-accent-green text-sm">JT</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">James Thompson</p>
                    <p className="text-xs text-muted-foreground">Austin, TX</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-lg bg-background border border-border">
                <p className="text-muted-foreground mb-4">
                  "The scaling feature is a game-changer. Mom's recipe for 4 becomes a feast for 8 instantly. PDF export is perfect for printing."
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">SK</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Sarah Kim</p>
                    <p className="text-xs text-muted-foreground">Seattle, WA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-section-alt">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-12">
              <div className="lg:col-span-2">
                <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">FAQ</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Questions?
                </h2>
                <p className="text-muted-foreground">
                  Everything you need to know about preserving your family recipes.
                </p>
              </div>
              
              <div className="lg:col-span-3">
                <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-3">
                  <AccordionItem value="item-1" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      Is FamilyRecipe really free?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      Yes! Create your cookbook, add unlimited recipes, and invite family members completely free. No hidden fees.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      How accurate is the AI at reading handwriting?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      Very accurate - even with cursive and faded ink. For best results, use a clear, well-lit photo. You can always edit after extraction.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      Can I export or print my recipes?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      Absolutely. Export any recipe as a beautifully formatted PDF, perfect for printing or sharing.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      How many family members can I invite?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      Unlimited! Share the link and your whole extended family can join, view, and contribute recipes.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-5" className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      What happens to my recipes if I stop using the service?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      Your recipes are yours forever. Export them as PDFs anytime. We never delete your data.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 bg-primary">
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

      <footer className="py-8 px-4 sm:px-6 border-t border-border bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center mb-2">
                <span className="text-lg font-bold tracking-tight">Family</span>
                <span className="text-lg font-light text-muted-foreground tracking-tight">Recipe</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Preserving family culinary traditions, one recipe at a time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-privacy-policy">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-terms-service">
                Terms of Service
              </a>
              <a href="mailto:hello@familyrecipe.com" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="link-contact">
                <Mail className="h-4 w-4" />
                Contact
              </a>
            </div>
          </div>
          <div className="border-t border-border mt-6 pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Made with love for families everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
