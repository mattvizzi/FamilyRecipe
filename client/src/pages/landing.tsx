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

        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary mb-2">HOW IT WORKS</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Three simple steps to preserve your recipes
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                From handwritten cards to a beautiful digital cookbook in minutes
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload Your Recipe</h3>
                <p className="text-sm text-muted-foreground">
                  Take a photo, paste a URL, or type in the text. We accept recipes in any format.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Does the Magic</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI extracts ingredients, instructions, and timing - then generates a beautiful photo.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Cook & Share</h3>
                <p className="text-sm text-muted-foreground">
                  Access your recipes anytime, scale servings, and share with your whole family.
                </p>
              </div>
            </div>
          </div>
        </section>

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

        <section className="py-16 px-6 bg-card">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary mb-2">FAMILY SHARING</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                One cookbook for the whole family
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Invite family members to view, add, and cook from your shared collection
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border border-border">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Easy Invites</h3>
                  <p className="text-sm text-muted-foreground">
                    Share a simple link with family members. They can join your cookbook in seconds, no complicated setup required.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Collaborate Together</h3>
                  <p className="text-sm text-muted-foreground">
                    Everyone can add their favorite recipes. See who contributed each dish and build your collection together.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Access Anywhere</h3>
                  <p className="text-sm text-muted-foreground">
                    Your whole family can access recipes from any device. Perfect for cooking at home or sharing at gatherings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary mb-2">LOVED BY FAMILIES</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Stories from our community
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Families around the world are preserving their culinary heritage
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border border-border">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-sm text-muted-foreground mb-6">
                    "I finally digitized my grandmother's handwritten recipe cards. The AI read her cursive perfectly - even the notes in the margins. Now my kids can access them anytime."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">MR</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Maria R.</p>
                      <p className="text-xs text-muted-foreground">Chicago, IL</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-sm text-muted-foreground mb-6">
                    "Our family is spread across three states. Now when we get together for holidays, everyone contributes recipes and we actually use them. No more lost bookmarks."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">JT</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">James T.</p>
                      <p className="text-xs text-muted-foreground">Austin, TX</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-sm text-muted-foreground mb-6">
                    "The scaling feature is a game-changer. I can take my mom's recipe for 4 and instantly scale it for our family of 8. The PDF export is perfect for printing."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">SK</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Sarah K.</p>
                      <p className="text-xs text-muted-foreground">Seattle, WA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-card">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-primary mb-2">FAQ</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Common questions
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-border">
                <AccordionTrigger className="text-left hover:no-underline">
                  Is FamilyRecipe really free to use?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! You can create your family cookbook, add unlimited recipes, and invite family members completely free. We believe everyone should be able to preserve their family recipes without barriers.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border-border">
                <AccordionTrigger className="text-left hover:no-underline">
                  How accurate is the AI at reading handwritten recipes?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Our AI is trained on thousands of handwritten recipes and can read most handwriting accurately - even cursive and faded ink. For best results, take a clear, well-lit photo. You can always edit any details after extraction.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border-border">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I export or print my recipes?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely. Every recipe can be exported as a beautifully formatted PDF, perfect for printing or sharing. You can also copy recipes to your clipboard to paste anywhere.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border-border">
                <AccordionTrigger className="text-left hover:no-underline">
                  How many family members can I invite?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  There's no limit! Invite your whole extended family. Everyone with the invite link can join your cookbook, view all recipes, and add their own contributions.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border-border">
                <AccordionTrigger className="text-left hover:no-underline">
                  What happens to my recipes if I stop using the service?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Your recipes are yours forever. You can export all of them as PDFs at any time. We never delete your data, and you can always come back to access your cookbook.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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

      <footer className="py-8 px-6 border-t border-border bg-card">
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
