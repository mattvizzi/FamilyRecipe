import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  FileText,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  ChefHat,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Family, InsertRecipe } from "@shared/schema";
import { Link } from "wouter";

type InputMethod = "photo" | "camera" | "url" | "text" | null;
type WizardStep = "select" | "input" | "processing" | "complete" | "error";

export default function AddRecipe() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("select");
  const [inputMethod, setInputMethod] = useState<InputMethod>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdRecipeId, setCreatedRecipeId] = useState<string | null>(null);

  const { data: family } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const processRecipeMutation = useMutation({
    mutationFn: async (data: { method: string; content: string }) => {
      const response = await fetch("/api/recipes/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process recipe");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedRecipeId(data.id);
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setStep("error");
    },
  });

  const handleMethodSelect = (method: InputMethod) => {
    setInputMethod(method);
    if (method === "photo") {
      fileInputRef.current?.click();
    } else if (method === "camera") {
      cameraInputRef.current?.click();
    } else {
      setStep("input");
    }
  };

  // Convert image file to JPEG base64 (handles HEIC and reduces file size)
  const convertToJpegBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas with reasonable max dimensions
        const maxDim = 2048;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(jpegDataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep("input");
    }
  };

  const handleSubmit = async () => {
    setStep("processing");
    setProgress(0);

    let content = inputValue;

    // Convert file to JPEG base64 for photo/camera methods
    if (selectedFile) {
      try {
        content = await convertToJpegBase64(selectedFile);
      } catch {
        setErrorMessage("Failed to process image. Please try a different photo.");
        setStep("error");
        return;
      }
    }

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      await processRecipeMutation.mutateAsync({
        method: inputMethod || "text",
        content,
      });
      setProgress(100);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const reset = () => {
    setStep("select");
    setInputMethod(null);
    setInputValue("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setErrorMessage("");
    setCreatedRecipeId(null);
  };

  const inputMethods = [
    { id: "photo", icon: Upload, label: "Upload Photo", description: "Upload a recipe photo" },
    { id: "camera", icon: Camera, label: "Take Photo", description: "Use your camera" },
    { id: "url", icon: LinkIcon, label: "Paste URL", description: "From a recipe website" },
    { id: "text", icon: FileText, label: "Type or Paste", description: "Enter recipe text" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header family={family} />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {step === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Add a New Recipe</h1>
                  <p className="text-muted-foreground">
                    Choose how you'd like to add your recipe
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {inputMethods.map((method) => (
                    <Card
                      key={method.id}
                      className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                      onClick={() => handleMethodSelect(method.id as InputMethod)}
                      data-testid={`card-method-${method.id}`}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <method.icon className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">{method.label}</h3>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <Button variant="outline" asChild data-testid="button-manual-entry">
                    <Link href="/add-recipe/manual">
                      Or add manually
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    {(inputMethod === "photo" || inputMethod === "camera") && previewUrl && (
                      <div className="mb-6">
                        <img
                          src={previewUrl}
                          alt="Recipe preview"
                          className="w-full max-h-64 object-contain rounded-lg"
                        />
                      </div>
                    )}

                    {inputMethod === "url" && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Recipe URL</label>
                        <Input
                          type="url"
                          placeholder="https://example.com/recipe"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          data-testid="input-url"
                        />
                      </div>
                    )}

                    {inputMethod === "text" && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Recipe Text</label>
                        <Textarea
                          placeholder="Paste or type your recipe here..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="min-h-[200px]"
                          data-testid="input-text"
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={reset} data-testid="button-back-method">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={handleSubmit}
                        disabled={!selectedFile && !inputValue}
                        data-testid="button-process"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Process with AI
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-12 text-center">
                    <motion.div
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity },
                      }}
                      className="w-24 h-24 mx-auto mb-6"
                    >
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-primary via-primary/50 to-primary flex items-center justify-center">
                        <ChefHat className="h-12 w-12 text-primary-foreground" />
                      </div>
                    </motion.div>
                    
                    <h2 className="text-xl font-bold mb-2">AI Magic in Progress</h2>
                    <p className="text-muted-foreground mb-6">
                      Extracting ingredients, instructions, and generating a beautiful photo...
                    </p>
                    
                    <Progress value={progress} className="h-2 mb-2" />
                    <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-12 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10, stiffness: 100 }}
                      className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
                    >
                      <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </motion.div>
                    
                    <h2 className="text-xl font-bold mb-2">Recipe Added!</h2>
                    <p className="text-muted-foreground mb-6">
                      Your recipe has been successfully processed and saved.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={reset} data-testid="button-add-another">
                        Add Another Recipe
                      </Button>
                      <Button asChild data-testid="button-view-recipe">
                        <Link href={`/recipe/${createdRecipeId}`}>
                          View Recipe
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    
                    <h2 className="text-xl font-bold mb-2">Processing Failed</h2>
                    <p className="text-muted-foreground mb-6">
                      {errorMessage || "We couldn't extract enough information from your input."}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={reset} data-testid="button-try-again">
                        Try Again
                      </Button>
                      <Button asChild data-testid="button-manual-fallback">
                        <Link href="/add-recipe/manual">
                          Add Manually
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
