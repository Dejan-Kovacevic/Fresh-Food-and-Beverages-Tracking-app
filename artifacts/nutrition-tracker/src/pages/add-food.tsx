import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useAnalyzeFood, 
  useCreateEntry,
  getListEntriesQueryKey,
  getGetDailySummaryQueryKey
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
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";

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

export function AddFood() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [description, setDescription] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EntryFormValues | null>(null);

  const analyzeFood = useAnalyzeFood();
  const createEntry = useCreateEntry();

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: "",
      mealType: "lunch"
    }
  });

  const handleAnalyze = () => {
    if (!description.trim()) return;

    analyzeFood.mutate(
      { data: { description } },
      {
        onSuccess: (result) => {
          // prefill form
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
            toast({
              title: "AI Note",
              description: result.notes,
            });
          }
        },
        onError: () => {
          toast({
            title: "Analysis Failed",
            description: "Could not analyze the food. Please try manual entry.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const determineMealType = (): "breakfast" | "lunch" | "dinner" | "snack" => {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 21) return "dinner";
    return "snack";
  };

  const onSubmit = (data: EntryFormValues) => {
    createEntry.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey({ date: today }) });
          queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
          toast({
            title: "Food Logged!",
            description: "Your meal has been recorded successfully.",
          });
          setLocation("/");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to log food. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Add Food</h1>
        </header>

        <AnimatePresence mode="wait">
          {!analysisResult && !isManual ? (
            <motion.div 
              key="analyze"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="relative">
                  <Textarea 
                    placeholder="E.g. A bowl of oatmeal with a sliced banana and a tablespoon of peanut butter..."
                    className="min-h-[160px] text-lg p-4 resize-none border-2 focus-visible:ring-primary shadow-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 text-muted-foreground flex items-center gap-1 text-xs font-medium">
                    <Sparkles className="w-3 h-3 text-primary" /> AI Powered
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full text-base font-bold h-14"
                  onClick={handleAnalyze}
                  disabled={!description.trim() || analyzeFood.isPending}
                  data-testid="button-analyze"
                >
                  {analyzeFood.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Food"
                  )}
                </Button>
              </div>

              <div className="text-center">
                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-muted"></div>
                  <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium">OR</span>
                  <div className="flex-grow border-t border-muted"></div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsManual(true)}
                  data-testid="button-manual"
                >
                  Enter Manually
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {analysisResult && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex gap-3 items-start">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary">AI Analysis Complete</h3>
                    <p className="text-sm text-muted-foreground mt-1">Review and adjust the values below if needed before saving.</p>
                  </div>
                </div>
              )}

              <Card className="shadow-lg border-muted">
                <CardContent className="p-6">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label>Food Name</Label>
                      <Input {...form.register("name")} placeholder="e.g. Oatmeal" className="font-semibold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Calories</Label>
                        <Input type="number" {...form.register("calories")} className="font-bold text-primary tabular-nums" />
                      </div>
                      <div className="space-y-2">
                        <Label>Serving Size</Label>
                        <Input {...form.register("servingSize")} placeholder="e.g. 1 bowl" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-chart-2">Protein (g)</Label>
                        <Input type="number" {...form.register("protein")} className="tabular-nums" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-chart-3">Carbs (g)</Label>
                        <Input type="number" {...form.register("carbs")} className="tabular-nums" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-chart-4">Fat (g)</Label>
                        <Input type="number" {...form.register("fat")} className="tabular-nums" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Meal Type</Label>
                      <Select 
                        onValueChange={(val: any) => form.setValue("mealType", val)} 
                        defaultValue={form.getValues("mealType")}
                      >
                        <SelectTrigger>
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
                        onClick={() => {
                          setAnalysisResult(null);
                          setIsManual(false);
                          setDescription("");
                          form.reset();
                        }}
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
