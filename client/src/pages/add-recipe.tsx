import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import heic2any from "heic2any";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Globe,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Family, InsertRecipe } from "@shared/schema";
import { Link } from "wouter";

type InputMethod = "photo" | "camera" | "url" | "text" | null;
type WizardStep = "select" | "input" | "processing" | "visibility" | "complete" | "error";

export default function AddRecipe() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("select");
  const [inputMethod, setInputMethod] = useState<InputMethod>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isConvertingHeic, setIsConvertingHeic] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdRecipeId, setCreatedRecipeId] = useState<string | null>(null);

  const { data: family } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  useEffect(() => {
    if (step === "processing") {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Recipe is still being processed. Are you sure you want to leave?";
        return e.returnValue;
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [step]);

  const processRecipeMutation = useMutation({
    mutationFn: async (data: { method: string; content: string }) => {
      const response = await apiRequest("POST", "/api/recipes/process", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedRecipeId(data.id);
      setStep("visibility");
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setStep("error");
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      return apiRequest("PATCH", `/api/recipes/${createdRecipeId}/visibility`, { isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setStep("complete");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to set visibility", variant: "destructive" });
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

  const convertToJpegBase64 = async (file: File): Promise<string> => {
    let imageBlob: Blob = file;
    
    const isHeic = file.type === "image/heic" || 
                   file.type === "image/heif" || 
                   file.name.toLowerCase().endsWith(".heic") ||
                   file.name.toLowerCase().endsWith(".heif");
    
    if (isHeic) {
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.85,
        });
        imageBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      } catch (e) {
        console.error("HEIC conversion failed:", e);
        throw new Error("Failed to convert HEIC image");
      }
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
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
      img.src = URL.createObjectURL(imageBlob);
    });
  };

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    const isHeic = file.type === "image/heic" || 
                   file.type === "image/heif" || 
                   file.name.toLowerCase().endsWith(".heic") ||
                   file.name.toLowerCase().endsWith(".heif");
    
    if (!isHeic) {
      return file;
    }
    
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
      });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
      return new File([blob], newFileName, { type: "image/jpeg" });
    } catch (e) {
      console.error("HEIC conversion failed:", e);
      throw new Error("Failed to convert HEIC image");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      const hasHeic = fileArray.some(f => 
        f.type === "image/heic" || 
        f.type === "image/heif" || 
        f.name.toLowerCase().endsWith(".heic") ||
        f.name.toLowerCase().endsWith(".heif")
      );
      
      setStep("input");
      
      if (hasHeic) {
        setIsConvertingHeic(true);
        setPreviewUrls([]);
        
        try {
          const convertedFiles = await Promise.all(fileArray.map(convertHeicToJpeg));
          setSelectedFiles(convertedFiles);
          setPreviewUrls(convertedFiles.map(f => URL.createObjectURL(f)));
        } catch {
          setErrorMessage("Failed to convert HEIC image. Please try a different photo.");
          setStep("error");
          return;
        } finally {
          setIsConvertingHeic(false);
        }
      } else {
        setSelectedFiles(fileArray);
        setPreviewUrls(fileArray.map(f => URL.createObjectURL(f)));
      }
    }
  };

  const handleSubmit = async () => {
    setStep("processing");
    setProgress(0);
    setProgressMessage("Preparing...");

    let content = inputValue;

    if (selectedFiles.length > 0) {
      try {
        setProgressMessage("Converting images...");
        setProgress(10);
        
        const base64Images: string[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          setProgressMessage(`Converting image ${i + 1} of ${selectedFiles.length}...`);
          setProgress(10 + (i / selectedFiles.length) * 30);
          const base64 = await convertToJpegBase64(selectedFiles[i]);
          base64Images.push(base64);
        }
        
        content = base64Images.join("|||IMAGE_SEPARATOR|||");
        setProgress(40);
      } catch {
        setErrorMessage("Failed to process image. Please try a different photo.");
        setStep("error");
        return;
      }
    }

    setProgressMessage("AI is analyzing your recipe...");
    setProgress(50);

    try {
      await processRecipeMutation.mutateAsync({
        method: inputMethod || "text",
        content,
      });
      setProgress(100);
      setProgressMessage("Complete!");
    } catch {
      // Error handled by mutation
    }
  };

  const reset = () => {
    setStep("select");
    setInputMethod(null);
    setInputValue("");
    setSelectedFiles([]);
    setPreviewUrls([]);
    setProgress(0);
    setProgressMessage("");
    setErrorMessage("");
    setCreatedRecipeId(null);
  };

  const inputMethods = [
    { id: "photo", icon: Upload, label: "Upload Photo", description: "From your device" },
    { id: "camera", icon: Camera, label: "Take Photo", description: "Use camera" },
    { id: "url", icon: LinkIcon, label: "Paste URL", description: "From a website" },
    { id: "text", icon: FileText, label: "Type or Paste", description: "Enter text" },
  ];

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Processing Recipe</h2>
            <p className="text-sm text-muted-foreground">
              {progressMessage || "Our AI is extracting your recipe..."}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Please don't close this page while processing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header family={family} />
      
      <main className="pt-20 pb-12 px-6">
        <div className="max-w-xl mx-auto">
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
            multiple
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Add a New Recipe</CardTitle>
                    <CardDescription>
                      Choose how you'd like to add your recipe. Our AI will handle the rest.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {inputMethods.map((method) => (
                        <button
                          key={method.id}
                          className="p-4 rounded-lg border border-border bg-background hover-elevate active-elevate-2 text-left transition-colors"
                          onClick={() => handleMethodSelect(method.id as InputMethod)}
                          data-testid={`card-method-${method.id}`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                            <method.icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-sm">{method.label}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4">
                      <Button variant="ghost" className="w-full" asChild data-testid="button-manual-entry">
                        <Link href="/add-recipe/manual">
                          Or add recipe manually
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {inputMethod === "photo" || inputMethod === "camera" ? "Review Images" : 
                       inputMethod === "url" ? "Enter Recipe URL" : "Enter Recipe Text"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(inputMethod === "photo" || inputMethod === "camera") && isConvertingHeic && (
                      <div className="mb-6 flex flex-col items-center justify-center py-8">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm text-muted-foreground">Converting HEIC image...</p>
                      </div>
                    )}
                    {(inputMethod === "photo" || inputMethod === "camera") && !isConvertingHeic && previewUrls.length > 0 && (
                      <div className="mb-6">
                        <div className={`grid gap-2 ${previewUrls.length === 1 ? '' : 'grid-cols-2'}`}>
                          {previewUrls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Recipe preview ${index + 1}`}
                              className="w-full max-h-48 object-contain rounded-lg bg-muted"
                            />
                          ))}
                        </div>
                        {previewUrls.length > 1 && (
                          <p className="text-sm text-muted-foreground mt-2 text-center">
                            {previewUrls.length} images selected
                          </p>
                        )}
                      </div>
                    )}

                    {inputMethod === "url" && (
                      <div className="mb-6">
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
                        disabled={selectedFiles.length === 0 && !inputValue}
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

            {step === "visibility" && (
              <motion.div
                key="visibility"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10, stiffness: 100 }}
                        className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
                      >
                        <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </motion.div>
                      <h2 className="text-xl font-bold mb-2">Recipe Extracted!</h2>
                      <p className="text-muted-foreground">
                        One last step: Choose who can see this recipe.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <button
                        onClick={() => visibilityMutation.mutate(false)}
                        disabled={visibilityMutation.isPending}
                        className="p-6 rounded-lg border-2 border-border hover:border-primary bg-background hover-elevate active-elevate-2 text-center transition-colors"
                        data-testid="button-visibility-private"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-semibold mb-1">Keep Private</p>
                        <p className="text-sm text-muted-foreground">
                          Only your family can see this recipe
                        </p>
                      </button>

                      <button
                        onClick={() => visibilityMutation.mutate(true)}
                        disabled={visibilityMutation.isPending}
                        className="p-6 rounded-lg border-2 border-border hover:border-primary bg-background hover-elevate active-elevate-2 text-center transition-colors"
                        data-testid="button-visibility-public"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <Globe className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-semibold mb-1">Make Public</p>
                        <p className="text-sm text-muted-foreground">
                          Anyone can discover and save this recipe
                        </p>
                      </button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      You can change this later from the recipe page.
                    </p>
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
                  <CardContent className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10, stiffness: 100 }}
                      className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
                    >
                      <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </motion.div>
                    
                    <h2 className="text-xl font-bold mb-2">Recipe Added!</h2>
                    <p className="text-muted-foreground mb-6">
                      Your recipe has been successfully processed and saved.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={reset} data-testid="button-add-another">
                        Add Another
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
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-destructive" />
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
