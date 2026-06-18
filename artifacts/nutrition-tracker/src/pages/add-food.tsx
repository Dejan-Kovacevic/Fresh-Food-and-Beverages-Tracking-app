import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAnalyzeFood,
  useAnalyzeFoodImage,
  useCreateEntry,
  getListEntriesQueryKey,
  getGetDailySummaryQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, ArrowLeft, Camera, X, ScanLine } from "lucide-react";

const entrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  servingSize: z.string().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

type EntryFormValues = z.infer<typeof entrySchema>;

type InputMode = "text" | "camera" | "manual";

const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = typeof VALID_MEAL_TYPES[number];

function getMealTypeFromUrl(): MealType {
  const param = new URLSearchParams(window.location.search).get("meal") ?? "";
  return (VALID_MEAL_TYPES as readonly string[]).includes(param)
    ? (param as MealType)
    : "lunch";
}

export function AddFood() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [description, setDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState<EntryFormValues | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const analyzeFood = useAnalyzeFood();
  const analyzeFoodImage = useAnalyzeFoodImage();
  const createEntry = useCreateEntry();

  const isAnalyzing = analyzeFood.isPending || analyzeFoodImage.isPending;

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: "",
      mealType: getMealTypeFromUrl(),
    },
  });

  const determineMealType = (): "breakfast" | "lunch" | "dinner" | "snack" => {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 21) return "dinner";
    return "snack";
  };

  const applyResult = (result: { name: string; calories: number; protein: number; carbs: number; fat: number; servingSize: string; notes?: string | null }) => {
    const mealType = determineMealType();
    const values: EntryFormValues = {
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      servingSize: result.servingSize,
      mealType,
    };
    setAnalysisResult(values);
    form.reset(values);
    if (result.notes) {
      toast({ title: "AI Note", description: result.notes });
    }
  };

  const handleAnalyzeText = () => {
    if (!description.trim()) return;
    analyzeFood.mutate(
      { data: { description } },
      {
        onSuccess: applyResult,
        onError: () =>
          toast({ title: "Analysis Failed", description: "Could not analyze. Try manual entry.", variant: "destructive" }),
      }
    );
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);

      // Extract base64 and mime type from data URL
      const [header, base64] = dataUrl.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";

      analyzeFoodImage.mutate(
        { data: { imageBase64: base64, mimeType } },
        {
          onSuccess: applyResult,
          onError: () =>
            toast({ title: "Scan Failed", description: "Could not analyze the image. Try describing the food instead.", variant: "destructive" }),
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setInputMode("text");
    setDescription("");
    setCapturedImage(null);
    form.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (data: EntryFormValues) => {
    createEntry.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey({ date: today }) });
          queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
          toast({ title: "Food Logged!", description: "Your meal has been recorded successfully." });
          setLocation("/");
        },
        onError: () =>
          toast({ title: "Error", description: "Failed to log food. Please try again.", variant: "destructive" }),
      }
    );
  };

  const showAnalysisForm = analysisResult !== null || inputMode === "manual";

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Add Food</h1>
        </header>

        {/* Hidden file input for camera / gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageCapture}
          data-testid="input-camera"
        />

        <AnimatePresence mode="wait">
          {!showAnalysisForm ? (
            <motion.div
              key="input-options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Mode tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setInputMode("text")}
                  data-testid="tab-text"
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    inputMode === "text"
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Describe
                </button>
                <button
                  onClick={() => setInputMode("camera")}
                  data-testid="tab-camera"
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    inputMode === "camera"
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Scan
                </button>
              </div>

              <AnimatePresence mode="wait">
                {inputMode === "text" ? (
                  <motion.div
                    key="text-input"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Textarea
                        placeholder="E.g. A bowl of oatmeal with a sliced banana and a tablespoon of peanut butter..."
                        className="min-h-[160px] text-base p-4 resize-none border-2 focus-visible:ring-primary shadow-sm"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        data-testid="input-description"
                      />
                      <div className="absolute bottom-3 right-3 text-muted-foreground flex items-center gap-1 text-xs font-medium">
                        <Sparkles className="w-3 h-3 text-primary" /> AI Powered
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full text-base font-bold h-14"
                      onClick={handleAnalyzeText}
                      disabled={!description.trim() || isAnalyzing}
                      data-testid="button-analyze"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                      ) : (
                        "Analyze Food"
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="camera-input"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    {capturedImage && isAnalyzing ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg">
                        <img src={capturedImage} alt="Captured food" className="w-full max-h-64 object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                          <div className="relative">
                            <ScanLine className="w-10 h-10 text-primary animate-pulse" />
                          </div>
                          <p className="text-white font-semibold text-sm">Analyzing your food...</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing}
                        data-testid="button-scan"
                        className="w-full border-2 border-dashed border-primary/40 rounded-2xl p-10 flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-foreground">Take a photo or upload</p>
                          <p className="text-sm text-muted-foreground mt-1">AI will identify the food and estimate calories</p>
                        </div>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-muted" />
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium">OR</span>
                <div className="flex-grow border-t border-muted" />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setInputMode("manual")}
                data-testid="button-manual"
              >
                Enter Manually
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Preview image if scanned */}
              {capturedImage && (
                <div className="relative rounded-2xl overflow-hidden shadow-md">
                  <img src={capturedImage} alt="Scanned food" className="w-full max-h-48 object-cover" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {analysisResult && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex gap-3 items-start">
                  {capturedImage ? (
                    <Camera className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold text-primary">
                      {capturedImage ? "Scan Complete" : "AI Analysis Complete"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review and adjust the values below if needed before saving.
                    </p>
                  </div>
                </div>
              )}

              <Card className="shadow-lg border-muted">
                <CardContent className="p-6">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label>Food Name</Label>
                      <Input {...form.register("name")} placeholder="e.g. Oatmeal" className="font-semibold" data-testid="input-name" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Calories</Label>
                        <Input type="number" step="any" {...form.register("calories")} className="font-bold text-primary tabular-nums" data-testid="input-calories" />
                      </div>
                      <div className="space-y-2">
                        <Label>Serving Size</Label>
                        <Input {...form.register("servingSize")} placeholder="e.g. 1 bowl" data-testid="input-serving" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-chart-2">Protein (g)</Label>
                        <Input type="number" step="any" {...form.register("protein")} className="tabular-nums" data-testid="input-protein" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-chart-3">Carbs (g)</Label>
                        <Input type="number" step="any" {...form.register("carbs")} className="tabular-nums" data-testid="input-carbs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-chart-4">Fat (g)</Label>
                        <Input type="number" step="any" {...form.register("fat")} className="tabular-nums" data-testid="input-fat" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Meal Type</Label>
                      <Select
                        onValueChange={(val: "breakfast" | "lunch" | "dinner" | "snack") => form.setValue("mealType", val)}
                        defaultValue={form.getValues("mealType")}
                      >
                        <SelectTrigger data-testid="select-meal-type">
                          <SelectValue placeholder="Select meal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={handleReset}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={createEntry.isPending}
                        data-testid="button-save-food"
                      >
                        {createEntry.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Log Food
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
