import { Router } from "express";
import OpenAI from "openai";
import { AnalyzeFoodBody, AnalyzeFoodImageBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /analyze-food
router.post("/analyze-food", async (req, res): Promise<void> => {
  const parsed = AnalyzeFoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { description } = parsed.data;

  const systemPrompt = `You are a precise nutrition analyst. When given a food description, return ONLY a valid JSON object with nutritional information. Be realistic and accurate with serving sizes and macros.

Return exactly this JSON structure (no markdown, no explanation):
{
  "name": "descriptive food name",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "servingSize": "e.g. 1 cup (240g)",
  "confidence": "high" | "medium" | "low",
  "notes": "optional brief note or null"
}

Rules:
- calories/protein/carbs/fat are numbers (no units in values)
- confidence is "high" for common foods, "medium" for estimates, "low" for vague descriptions
- notes can be null or a brief clarification
- Be accurate: 1 large egg is ~70 cal, 6g protein, 0g carbs, 5g fat`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: description },
      ],
      max_tokens: 300,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      // Try to extract JSON from response if wrapped in markdown
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        req.log.error({ raw }, "Failed to parse AI response as JSON");
        res.status(500).json({ error: "Could not parse nutritional data" });
        return;
      }
    }

    res.json({
      name: String(result.name || description),
      calories: Number(result.calories) || 0,
      protein: Number(result.protein) || 0,
      carbs: Number(result.carbs) || 0,
      fat: Number(result.fat) || 0,
      servingSize: String(result.servingSize || "1 serving"),
      confidence: ["high", "medium", "low"].includes(result.confidence) ? result.confidence : "medium",
      notes: result.notes || null,
    });
  } catch (err) {
    logger.error({ err }, "AI food analysis failed");
    res.status(500).json({ error: "AI analysis failed" });
  }
});

const nutritionSystemPrompt = `You are a precise nutrition analyst. When given a food image, identify all visible food items and return ONLY a valid JSON object with nutritional information. Be realistic and accurate.

Return exactly this JSON structure (no markdown, no explanation):
{
  "name": "descriptive food name",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "servingSize": "e.g. 1 plate (approx 400g)",
  "confidence": "high" | "medium" | "low",
  "notes": "optional brief note or null"
}

Rules:
- calories/protein/carbs/fat are numbers (no units in values)
- confidence is "high" for clearly visible food, "medium" for partially visible, "low" for unclear images
- notes can be null or a brief clarification about what was identified
- If multiple foods are visible, combine totals and list items in the name (e.g. "Chicken, rice and salad plate")
- Estimate portion size from visual cues (plate size, hand size etc.)`;

// POST /analyze-food-image
router.post("/analyze-food-image", async (req, res): Promise<void> => {
  const parsed = AnalyzeFoodImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64, mimeType } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: nutritionSystemPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        req.log.error({ raw }, "Failed to parse AI image response as JSON");
        res.status(500).json({ error: "Could not parse nutritional data from image" });
        return;
      }
    }

    res.json({
      name: String(result.name || "Unknown food"),
      calories: Number(result.calories) || 0,
      protein: Number(result.protein) || 0,
      carbs: Number(result.carbs) || 0,
      fat: Number(result.fat) || 0,
      servingSize: String(result.servingSize || "1 serving"),
      confidence: ["high", "medium", "low"].includes(result.confidence) ? result.confidence : "medium",
      notes: result.notes || null,
    });
  } catch (err) {
    logger.error({ err }, "AI food image analysis failed");
    res.status(500).json({ error: "AI image analysis failed" });
  }
});

export default router;
