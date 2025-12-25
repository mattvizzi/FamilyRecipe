import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { isHeicFile, convertHeicToJpeg, convertToJpegBase64 } from "@/lib/image-utils";
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
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Family } from "@shared/schema";
import { Link } from "wouter";

type InputMethod = "photo" | "camera" | "url" | "text" | null;
type WizardStep = "select" | "input" | "processing" | "error";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: family } = useQuery<Family>({
    queryKey: ["/api/family"],
  });

  const processRecipeMutation = useMutation({
    mutationFn: async (data: { method: string; content: string }) => {
      const response = await apiRequest("POST", "/api/recipes/process-background", data);
      return response.json();
    },
    onSuccess: () => {
      setStep("processing");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      const hasHeic = fileArray.some(isHeicFile);
      
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
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    let content = inputValue;

    if (selectedFiles.length > 0) {
      try {
        const base64Images: string[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          const base64 = await convertToJpegBase64(selectedFiles[i]);
          base64Images.push(base64);
        }
        content = base64Images.join("|||IMAGE_SEPARATOR|||");
      } catch {
        setErrorMessage("Failed to process image. Please try a different photo.");
        setStep("error");
        setIsSubmitting(false);
        return;
      }
    }

    processRecipeMutation.mutate({
      method: inputMethod || "text",
      content,
    });
  };

  const reset = () => {
    setStep("select");
    setInputMethod(null);
    setInputValue("");
    setSelectedFiles([]);
    setPreviewUrls([]);
    setErrorMessage("");
    setIsSubmitting(false);
  };

  const inputMethods = [
    { id: "photo", icon: Upload, label: "Upload Photo", description: "From your device" },
    { id: "camera", icon: Camera, label: "Take Photo", description: "Use camera" },
    { id: "url", icon: LinkIcon, label: "Paste URL", description: "From a website" },
    { id: "text", icon: FileText, label: "Type or Paste", description: "Enter text" },
  ];

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6" role="status" aria-live="polite">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Processing Your Recipe</h2>
              <p className="text-sm text-muted-foreground">
                Our AI is extracting your recipe. This usually takes about a minute.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 mb-6" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                You can leave this page anytime. Check the notification bell in the header when your recipe is ready.
              </p>
            </div>
            
            <Button
              onClick={() => navigate("/home")}
              className="w-full"
              data-testid="button-go-home"
            >
              Got it, take me home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="pt-20 sm:pt-28 pb-12 px-4 sm:px-6">
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
  );
}
