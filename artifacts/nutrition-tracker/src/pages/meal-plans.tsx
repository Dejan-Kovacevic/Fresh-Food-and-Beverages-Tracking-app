import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  useCreateEntry,
  getListEntriesQueryKey,
  getGetDailySummaryQueryKey,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Coffee, Sun, Apple, Moon, Plus, Loader2, Flame, Dumbbell, Droplet, Wheat,
  CalendarPlus, RefreshCw, PartyPopper, ChefHat, ChevronDown, Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface PlanMeal {
  mealType: MealType;
  title: string;
  foods: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep: string[];
  note: string;
}

interface PlanSlot {
  options: PlanMeal[];
}

interface Plan {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  gradient: string;
  slots: PlanSlot[];
}

const MEAL_META: Record<MealType, { icon: React.ReactNode; label: string }> = {
  breakfast: { icon: <Coffee className="w-4 h-4 text-amber-500" />, label: "Frühstück" },
  lunch:     { icon: <Sun    className="w-4 h-4 text-orange-500" />, label: "Mittagessen" },
  snack:     { icon: <Apple  className="w-4 h-4 text-green-500"  />, label: "Snack" },
  dinner:    { icon: <Moon   className="w-4 h-4 text-indigo-400" />, label: "Abendessen" },
};

const PLANS: Plan[] = [
  {
    id: "cut",
    name: "Definitionsphase",
    shortName: "Definition",
    tagline: "Viel Protein, Kaloriendefizit — Muskeln erhalten, Fett verlieren",
    gradient: "from-emerald-950 via-slate-900 to-slate-800",
    slots: [
      {
        options: [
          {
            mealType: "breakfast", title: "Protein-Oatmeal mit Beeren", foods: "250g Magerquark, 40g Haferflocken, 100g Blaubeeren, Zimt", servingSize: "1 Schüssel", calories: 380, protein: 38, carbs: 45, fat: 5,
            prep: ["Haferflocken mit etwas heißem Wasser oder Milch 2–3 Minuten quellen lassen.", "Quark cremig unterrühren — bei Bedarf einen Schluck Milch dazugeben.", "Mit Blaubeeren und einer Prise Zimt toppen."],
            note: "Kalten Quark 5 Minuten bei Raumtemperatur stehen lassen — er wird deutlich cremiger.",
          },
          {
            mealType: "breakfast", title: "Eiweiß-Omelette mit Toast", foods: "4 Eiweiß + 1 Ei, 1 Scheibe Vollkorntoast, Tomaten, Spinat", servingSize: "1 Teller", calories: 360, protein: 35, carbs: 35, fat: 8,
            prep: ["Eiweiß mit dem ganzen Ei, Salz und Pfeffer verquirlen.", "In einer beschichteten Pfanne bei mittlerer bis niedriger Hitze stocken lassen.", "Spinat und Tomaten einklappen, auf dem getoasteten Brot servieren."],
            note: "Niedrige Hitze ist alles — Eiweiß wird gummiartig, sobald man es hetzt.",
          },
          {
            mealType: "breakfast", title: "Skyr-Bowl mit Banane & Chia", foods: "250g Skyr, ½ Banane, 10g Chiasamen, etwas Honig", servingSize: "1 Schüssel", calories: 360, protein: 30, carbs: 40, fat: 8,
            prep: ["Skyr glatt rühren und in eine Schüssel geben.", "Banane in Scheiben schneiden und darauf verteilen.", "Chiasamen darüberstreuen und mit etwas Honig abrunden."],
            note: "Chiasamen 10 Minuten ziehen lassen — sie bekommen einen angenehmen Pudding-Biss.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "lunch", title: "Gegrilltes Hähnchen mit Reis & Brokkoli", foods: "150g Hähnchenbrust, 60g Basmatireis (roh), 200g Brokkoli", servingSize: "1 Teller", calories: 450, protein: 48, carbs: 48, fat: 6,
            prep: ["Hähnchen mit Salz, Pfeffer und Paprika würzen; 5–6 Minuten pro Seite grillen oder braten.", "Reis nach Packungsanleitung kochen.", "Brokkoli 4–5 Minuten dämpfen, bis er leuchtend grün ist.", "Hähnchen vor dem Aufschneiden 3 Minuten ruhen lassen."],
            note: "Das Ruhen ist Pflicht — schneidest du sofort, landet der Saft auf dem Brett statt im Fleisch.",
          },
          {
            mealType: "lunch", title: "Putensteak mit Kartoffeln & Bohnen", foods: "150g Putenbrust, 300g Kartoffeln, 150g grüne Bohnen", servingSize: "1 Teller", calories: 440, protein: 45, carbs: 50, fat: 6,
            prep: ["Kartoffeln in Salzwasser 15–20 Minuten kochen.", "Putensteak bei mittelhoher Hitze 4–5 Minuten pro Seite braten.", "Grüne Bohnen 4 Minuten blanchieren und mit etwas Butter schwenken."],
            note: "Pute trocknet schnell aus — bei 72°C Kerntemperatur aus der Pfanne, keine Minute später.",
          },
          {
            mealType: "lunch", title: "Thunfischsalat mit Kichererbsen", foods: "1 Dose Thunfisch im eigenen Saft, 120g Kichererbsen, Blattsalat, 1 TL Olivenöl", servingSize: "1 große Schüssel", calories: 430, protein: 42, carbs: 35, fat: 12,
            prep: ["Thunfisch und Kichererbsen abtropfen lassen.", "Mit Salat, Gurke und roten Zwiebeln vermengen.", "Mit Olivenöl, Zitronensaft, Salz und Pfeffer anmachen."],
            note: "Ein Löffel Kichererbsenwasser (Aquafaba) bindet das Dressing wunderbar.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Skyr mit Mandeln", foods: "150g Skyr, 10g Mandeln", servingSize: "1 Becher", calories: 200, protein: 22, carbs: 10, fat: 8,
            prep: ["Skyr in einen Becher geben.", "Mandeln grob hacken und darüberstreuen."],
            note: "Mandeln 2 Minuten in der trockenen Pfanne rösten — der Geschmack wird deutlich intensiver.",
          },
          {
            mealType: "snack", title: "Proteinshake mit Apfel", foods: "30g Whey-Protein in Wasser, 1 Apfel", servingSize: "1 Shake + Obst", calories: 210, protein: 25, carbs: 25, fat: 2,
            prep: ["Whey mit 300ml kaltem Wasser schütteln, bis alles gelöst ist.", "Den Apfel dazu genießen."],
            note: "Eiskaltes Wasser macht den Shake spürbar cremiger als lauwarmes.",
          },
          {
            mealType: "snack", title: "Hüttenkäse mit Gurke", foods: "200g Hüttenkäse, ½ Gurke, Pfeffer", servingSize: "1 Schüssel", calories: 180, protein: 24, carbs: 8, fat: 5,
            prep: ["Gurke in Scheiben schneiden.", "Hüttenkäse mit Pfeffer und frischen Kräutern würzen, zusammen servieren."],
            note: "Frischer Dill oder Schnittlauch macht aus dem simplen Snack etwas richtig Gutes.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "dinner", title: "Ofenlachs mit Quinoa & Spargel", foods: "150g Lachsfilet, 50g Quinoa (roh), 200g grüner Spargel", servingSize: "1 Teller", calories: 520, protein: 40, carbs: 40, fat: 20,
            prep: ["Quinoa abspülen, dann 15 Minuten in der doppelten Menge Wasser köcheln.", "Lachs würzen und 12–14 Minuten bei 200°C backen.", "Spargel mit Olivenöl, Salz und Zitrone daneben rösten."],
            note: "Lachs ist fertig, wenn er blättert, aber innen noch glänzt — matt heißt verkocht.",
          },
          {
            mealType: "dinner", title: "Mageres Rind mit Zucchini & Reis", foods: "150g magere Rinderstreifen, 50g Reis (roh), Zucchini, Sojasauce", servingSize: "1 Teller", calories: 500, protein: 45, carbs: 45, fat: 15,
            prep: ["Reis kochen.", "Rinderstreifen heiß und kurz anbraten, 1–2 Minuten, dann beiseitelegen.", "Zucchini anbraten, mit Sojasauce ablöschen und das Fleisch zurückgeben."],
            note: "In Portionen anbraten — eine überfüllte Pfanne dämpft das Fleisch grau, statt es zu bräunen.",
          },
          {
            mealType: "dinner", title: "Garnelen-Pfanne mit Basmatireis", foods: "200g Garnelen, 60g Basmatireis (roh), Wok-Gemüse, 1 TL Öl", servingSize: "1 Teller", calories: 480, protein: 42, carbs: 55, fat: 9,
            prep: ["Basmatireis kochen.", "Gemüse 3–4 Minuten im sehr heißen Wok anbraten.", "Garnelen die letzten 2–3 Minuten mitbraten, bis sie rosa sind."],
            note: "Garnelen sind fertig, sobald sie sich zu einem lockeren C krümmen — ein enges O heißt verkocht.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Hüttenkäse vor dem Schlafen", foods: "200g Hüttenkäse (langsames Casein-Protein)", servingSize: "1 Schüssel", calories: 180, protein: 28, carbs: 7, fat: 4,
            prep: ["In eine Schüssel geben und würzen — süß mit Zimt oder herzhaft mit Pfeffer."],
            note: "Casein wird über 6–7 Stunden verdaut und versorgt deine Muskeln im Schlaf.",
          },
          {
            mealType: "snack", title: "Casein-Shake", foods: "30g Casein-Protein in Wasser", servingSize: "1 Shake", calories: 120, protein: 25, carbs: 3, fat: 1,
            prep: ["Casein mit 300ml Wasser mischen und kräftig schütteln."],
            note: "Casein dickt beim Stehen nach — nimm mehr Wasser als bei Whey.",
          },
          {
            mealType: "snack", title: "Harzer Käse mit Gewürzgurken", foods: "100g Harzer Käse, Gewürzgurken", servingSize: "1 Portion", calories: 130, protein: 27, carbs: 1, fat: 1,
            prep: ["Käse in Scheiben schneiden und mit den Gurken servieren."],
            note: "27g Protein bei fast null Fett — das am meisten unterschätzte Diät-Lebensmittel im Supermarkt.",
          },
        ],
      },
    ],
  },
  {
    id: "bulk",
    name: "Muskelaufbau",
    shortName: "Muskelaufbau",
    tagline: "Kalorienüberschuss mit guten Carbs & Protein für maximales Wachstum",
    gradient: "from-indigo-950 via-slate-900 to-slate-800",
    slots: [
      {
        options: [
          {
            mealType: "breakfast", title: "Rührei auf Vollkorntoast", foods: "3 Eier, 2 Scheiben Vollkorntoast, ½ Avocado", servingSize: "1 Teller", calories: 550, protein: 32, carbs: 45, fat: 26,
            prep: ["Eier mit einer Prise Salz verquirlen.", "Bei niedriger Hitze langsam rührend stocken lassen, bis sie gerade fest sind.", "Auf dem Toast mit Avocadoscheiben servieren."],
            note: "Nimm die Pfanne vom Herd, kurz bevor das Rührei fertig aussieht — es gart auf dem Teller nach.",
          },
          {
            mealType: "breakfast", title: "Protein-Pancakes mit Banane", foods: "50g Haferflocken, 30g Whey, 2 Eier, 1 Banane, Ahornsirup", servingSize: "3 Pancakes", calories: 560, protein: 38, carbs: 70, fat: 12,
            prep: ["Haferflocken, Whey, Eier und Banane zu einem glatten Teig mixen.", "Kleine Pancakes bei mittlerer Hitze 2–3 Minuten pro Seite backen.", "Stapeln und mit Ahornsirup toppen."],
            note: "Teig 5 Minuten ruhen lassen, damit die Haferflocken binden — die Pancakes lassen sich viel sauberer wenden.",
          },
          {
            mealType: "breakfast", title: "Frühstücks-Burrito", foods: "1 große Tortilla, 2 Eier, Käse, schwarze Bohnen, Salsa", servingSize: "1 Burrito", calories: 570, protein: 30, carbs: 55, fat: 24,
            prep: ["Eier verrühren und braten; Bohnen erwärmen.", "Eier, Käse, Bohnen und Salsa auf die Tortilla schichten.", "Fest einrollen und mit der Naht nach unten in der Pfanne anrösten."],
            note: "Das Anrösten der Naht verschließt den Burrito und sorgt für extra Crunch.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Mass-Gainer-Shake", foods: "1 Banane, 50g Haferflocken, 30g Whey-Protein, 15g Erdnussbutter, 300ml Milch", servingSize: "1 Shake", calories: 520, protein: 35, carbs: 60, fat: 15,
            prep: ["Alle Zutaten 30–45 Sekunden mixen, bis alles komplett glatt ist."],
            note: "Gefrorene Banane statt Eiswürfel — Milchshake-Konsistenz ohne Verwässern.",
          },
          {
            mealType: "snack", title: "Erdnussbutter-Marmeladen-Sandwich mit Milch", foods: "2 Scheiben Brot, 20g Erdnussbutter, Marmelade, 300ml Milch", servingSize: "1 Sandwich + Glas", calories: 540, protein: 22, carbs: 65, fat: 20,
            prep: ["Erdnussbutter auf die eine Scheibe, Marmelade auf die andere streichen.", "Zusammenklappen, diagonal schneiden, mit dem Glas Milch genießen."],
            note: "Erdnussbutter auf beide Scheiben streichen wirkt als Feuchtigkeitssperre — nie wieder matschiges Brot.",
          },
          {
            mealType: "snack", title: "Studentenfutter mit griechischem Joghurt", foods: "40g Nuss-Rosinen-Mix, 200g griechischer Joghurt", servingSize: "1 Schüssel", calories: 500, protein: 22, carbs: 45, fat: 25,
            prep: ["Studentenfutter in den Joghurt rühren oder getrennt genießen."],
            note: "Nüsse ungesalzen kaufen — du kontrollierst das Salz und der natürliche Geschmack kommt durch.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "lunch", title: "Rinderstreifen mit Pasta", foods: "150g mageres Rind, 100g Pasta (roh), Tomatensauce, Parmesan", servingSize: "1 Teller", calories: 650, protein: 45, carbs: 75, fat: 18,
            prep: ["Pasta in gut gesalzenem Wasser al dente kochen.", "Rinderstreifen bei hoher Hitze 1–2 Minuten scharf anbraten.", "Kurz mit der Tomatensauce köcheln, mit der Pasta vermengen, mit Parmesan abrunden."],
            note: "Eine Tasse Nudelwasser aufheben — ein Schuss davon macht jede Sauce seidig und bindet sie an die Pasta.",
          },
          {
            mealType: "lunch", title: "Hähnchen-Burrito-Bowl", foods: "150g Hähnchen, 80g Reis (roh), schwarze Bohnen, Mais, Salsa", servingSize: "1 Bowl", calories: 660, protein: 48, carbs: 80, fat: 14,
            prep: ["Reis kochen; Hähnchen mit Kreuzkümmel und Paprika würzen und anbraten.", "Bohnen und Mais erwärmen.", "Bowl zusammenstellen und mit Salsa toppen."],
            note: "15 Minuten in Limettensaft marinieren macht das Hähnchen zarter und die ganze Bowl frischer.",
          },
          {
            mealType: "lunch", title: "Lachs mit Süßkartoffelpüree", foods: "180g Lachs, 300g Süßkartoffel, 10g Butter, Blattgemüse", servingSize: "1 Teller", calories: 640, protein: 40, carbs: 60, fat: 24,
            prep: ["Süßkartoffel 15 Minuten kochen, dann mit Butter stampfen.", "Lachs 3–4 Minuten auf der Hautseite braten, dann 2 weitere Minuten.", "Mit dem Blattgemüse servieren."],
            note: "Mit der Hautseite nach unten starten und nicht bewegen — diese Geduld ist das ganze Geheimnis knuspriger Haut.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Griechischer Joghurt mit Granola & Honig", foods: "200g griechischer Joghurt, 40g Granola, 1 TL Honig", servingSize: "1 Schüssel", calories: 380, protein: 20, carbs: 50, fat: 10,
            prep: ["Joghurt, Granola und Honig in einer Schüssel schichten."],
            note: "Granola erst kurz vor dem Essen dazugeben, damit es knusprig bleibt.",
          },
          {
            mealType: "snack", title: "Reiswaffeln mit Erdnussbutter", foods: "4 Reiswaffeln, 20g Erdnussbutter, 1 Banane", servingSize: "1 Portion", calories: 370, protein: 12, carbs: 50, fat: 14,
            prep: ["Erdnussbutter auf die Reiswaffeln streichen und mit Bananenscheiben belegen."],
            note: "Eine winzige Prise Meersalz auf der Banane lässt die Süße richtig knallen.",
          },
          {
            mealType: "snack", title: "Käsebrot", foods: "2 Scheiben Vollkornbrot, 2 Scheiben Gouda, Butter", servingSize: "1 Sandwich", calories: 390, protein: 18, carbs: 40, fat: 16,
            prep: ["Brot buttern, Gouda drauflegen, fertig."],
            note: "Alter Gouda hat viel mehr Geschmack pro Gramm — du brauchst weniger davon.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "dinner", title: "Hähnchenschenkel mit Reis & Gemüse", foods: "180g Hähnchenschenkel, 80g Jasminreis (roh), Gemüsemix", servingSize: "1 Teller", calories: 620, protein: 45, carbs: 70, fat: 16,
            prep: ["Schenkel würzen und 25 Minuten bei 200°C mit der Hautseite nach oben braten.", "Reis kochen; Gemüse dämpfen oder anbraten.", "Hähnchen 5 Minuten ruhen lassen, dann servieren."],
            note: "Schenkel verzeihen alles — ein paar Minuten extra machen sie zarter, nicht trockener.",
          },
          {
            mealType: "dinner", title: "Rinder-Chili mit Reis", foods: "150g Rinderhack, Kidneybohnen, 70g Reis (roh), Tomaten", servingSize: "1 Schüssel", calories: 630, protein: 42, carbs: 65, fat: 20,
            prep: ["Hack in einem heißen Topf richtig anbraten.", "Bohnen und Tomaten dazu, mindestens 20 Minuten köcheln lassen.", "Über dem Reis servieren."],
            note: "Chili schmeckt am nächsten Tag immer besser — koch die doppelte Menge und dank dir morgen selbst.",
          },
          {
            mealType: "dinner", title: "Puten-Bolognese mit Pasta", foods: "150g Putenhack, 100g Vollkornpasta (roh), Tomatensauce", servingSize: "1 Teller", calories: 610, protein: 48, carbs: 75, fat: 12,
            prep: ["Putenhack mit Zwiebeln und Knoblauch anbraten.", "Tomatensauce dazugeben und 15 Minuten köcheln.", "Mit der gekochten Pasta vermengen."],
            note: "Eine kleine Prise Zucker in der Sauce gleicht die Tomatensäure perfekt aus.",
          },
        ],
      },
    ],
  },
  {
    id: "cheat",
    name: "Cheat Day",
    shortName: "Cheat Day",
    tagline: "Einmal pro Woche ohne schlechtes Gewissen genießen — das hilft beim Dranbleiben",
    gradient: "from-rose-950 via-slate-900 to-slate-800",
    slots: [
      {
        options: [
          {
            mealType: "breakfast", title: "Fluffige Pancakes mit Ahornsirup", foods: "3 Pancakes, Ahornsirup, 2 Streifen Bacon, Butter", servingSize: "1 Stapel", calories: 650, protein: 18, carbs: 85, fat: 26,
            prep: ["Teig nur kurz verrühren — Klümpchen sind völlig okay.", "Auf der gebutterten Pfanne backen, bis Bläschen entstehen, dann einmal wenden.", "Bacon knusprig braten, alles stapeln, in Ahornsirup ertränken."],
            note: "Zu viel Rühren entwickelt Gluten und macht Pancakes zäh — aufhören, solange der Teig klumpig ist.",
          },
          {
            mealType: "breakfast", title: "French Toast mit Beeren & Sahne", foods: "3 Scheiben French Toast, Beeren, Schlagsahne, Puderzucker", servingSize: "1 Teller", calories: 620, protein: 16, carbs: 75, fat: 28,
            prep: ["Eier, Milch, Zimt und Vanille verquirlen.", "Brotscheiben 30 Sekunden pro Seite einweichen.", "In Butter goldbraun braten, mit Beeren und Sahne toppen."],
            note: "Brot vom Vortag saugt die Eiermilch auf, ohne zu zerfallen — frisches Brot wird matschig.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "lunch", title: "Cheeseburger mit Pommes", foods: "1 Cheeseburger, mittlere Pommes, Ketchup & Mayo", servingSize: "1 Menü", calories: 850, protein: 35, carbs: 80, fat: 42,
            prep: ["Patties locker formen und nur außen würzen.", "Heiß anbraten, den Käse in der letzten Minute drauflegen.", "Buns toasten, stapeln, mit Pommes servieren."],
            note: "Eine kleine Mulde in die Patty-Mitte drücken — so bleibt sie flach, statt sich zu wölben.",
          },
          {
            mealType: "lunch", title: "Pizza Margherita", foods: "1 ganze Pizza mit Mozzarella, Tomate & Basilikum", servingSize: "1 Pizza", calories: 900, protein: 35, carbs: 110, fat: 32,
            prep: ["Teig ausziehen, dünn mit Sauce bestreichen, Mozzarella und Basilikum darauf.", "So heiß wie der Ofen kann backen, 8–10 Minuten."],
            note: "Ein vorgeheiztes Blech oder ein Pizzastein imitiert den Pizzaofen und macht den Boden richtig knusprig.",
          },
          {
            mealType: "lunch", title: "Döner Kebab", foods: "1 Döner mit Fleisch, Salat, Sauce im Fladenbrot", servingSize: "1 Döner", calories: 750, protein: 35, carbs: 65, fat: 38,
            prep: ["Fladenbrot erwärmen, mit Fleisch, Salat und beiden Saucen füllen."],
            note: "Selbstgemacht: dünn geschnittenes Hähnchen in Joghurt und Paprika marinieren und brutzelnd heiß anbraten.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Eisbecher", foods: "3 Kugeln Eis, Schokoladensauce, Schlagsahne", servingSize: "1 Becher", calories: 420, protein: 8, carbs: 50, fat: 20,
            prep: ["Kugeln, Sauce, Sahne — zusammenbauen und sofort genießen."],
            note: "Schokoladensauce leicht erwärmen, damit sie über das kalte Eis fließt, statt fest zu werden.",
          },
          {
            mealType: "snack", title: "Schokocroissant", foods: "1 großes Pain au Chocolat", servingSize: "1 Stück", calories: 380, protein: 6, carbs: 42, fat: 20,
            prep: ["3 Minuten bei 160°C im Ofen aufwärmen — niemals in der Mikrowelle."],
            note: "Die Mikrowelle macht Blätterteig zäh; der Ofen bringt die knusprigen Schichten zurück.",
          },
          {
            mealType: "snack", title: "Vanille-Milchshake", foods: "400ml Milchshake mit Vanilleeis", servingSize: "1 Shake", calories: 450, protein: 10, carbs: 55, fat: 20,
            prep: ["Eis mit Milch mixen, bis es gerade glatt ist."],
            note: "Weniger Milch heißt dickerer Shake — und nur kurz mixen, sonst schmilzt er dünn.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "dinner", title: "Cremige Pasta Carbonara", foods: "120g Pasta (roh), Speck, Sahne, Parmesan, Ei", servingSize: "1 Teller", calories: 800, protein: 28, carbs: 85, fat: 38,
            prep: ["Speck knusprig braten; Pasta al dente kochen.", "Ei, Sahne und Parmesan verquirlen.", "Die heiße Pasta abseits der Hitze mit der Sauce vermengen."],
            note: "Abseits der Hitze ist das ganze Geheimnis — auf der Flamme gibt's Rührei statt Carbonara.",
          },
          {
            mealType: "dinner", title: "Loaded Nachos mit Guacamole", foods: "Tortillachips, Käse, Rinderhack, Guacamole, Sour Cream", servingSize: "1 Platte", calories: 780, protein: 22, carbs: 70, fat: 45,
            prep: ["Chips, Käse und gewürztes Hack auf einem Blech schichten.", "8–10 Minuten bei 200°C backen, bis alles geschmolzen ist.", "Mit Guacamole und Sour Cream toppen."],
            note: "Käse zwischen die Chip-Schichten geben, nicht nur obendrauf — jeder Chip verdient Käse.",
          },
          {
            mealType: "dinner", title: "Schnitzel mit Pommes", foods: "1 Schweineschnitzel, Pommes, Zitrone & Remoulade", servingSize: "1 Teller", calories: 820, protein: 40, carbs: 70, fat: 40,
            prep: ["Schnitzel dünn klopfen; in Mehl, Ei und Semmelbröseln panieren.", "In reichlich Butterschmalz goldbraun ausbacken.", "Mit Pommes und einem Zitronenschnitz servieren."],
            note: "Die Pfanne beim Braten sanft schwenken — so souffliert die Panade zu den klassischen Wellen.",
          },
        ],
      },
      {
        options: [
          {
            mealType: "snack", title: "Schoki & Chips", foods: "50g Schokolade, kleine Tüte Chips", servingSize: "1 Portion", calories: 350, protein: 4, carbs: 40, fat: 19,
            prep: ["Kein Kochen nötig — purer Couch-Genuss."],
            note: "In eine Schüssel portionieren statt aus der Tüte essen — dein zukünftiges Ich sagt danke.",
          },
          {
            mealType: "snack", title: "Cookies mit Milch", foods: "3 Chocolate-Chip-Cookies, 250ml Milch", servingSize: "1 Portion", calories: 340, protein: 8, carbs: 45, fat: 14,
            prep: ["Cookies 2 Minuten im Ofen aufwärmen für den Frisch-gebacken-Effekt."],
            note: "Das Dunk-Timing zählt: 3 Sekunden sind der Sweet Spot vor dem Struktur-Kollaps.",
          },
        ],
      },
    ],
  },
];

export function MealPlans() {
  const [activePlanId, setActivePlanId] = useState<string>("cut");
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const [loggingDay, setLoggingDay] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createEntry = useCreateEntry();
  const today = format(new Date(), "yyyy-MM-dd");

  const plan = PLANS.find((p) => p.id === activePlanId)!;

  const getSelectedMeal = (slotIdx: number): PlanMeal => {
    const slot = plan.slots[slotIdx];
    const sel = selections[`${plan.id}-${slotIdx}`] ?? 0;
    return slot.options[sel % slot.options.length];
  };

  const swapMeal = (slotIdx: number) => {
    const key = `${plan.id}-${slotIdx}`;
    const count = plan.slots[slotIdx].options.length;
    setSelections((prev) => ({ ...prev, [key]: ((prev[key] ?? 0) + 1) % count }));
  };

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedMeals = plan.slots.map((_, i) => getSelectedMeal(i));
  const totals = selectedMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey({ date: today }) });
    queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
  };

  const entryData = (meal: PlanMeal) => ({
    name: meal.title,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    servingSize: meal.servingSize,
    mealType: meal.mealType,
  });

  const logMeal = async (meal: PlanMeal, key: string) => {
    setLoggingKey(key);
    try {
      await createEntry.mutateAsync({ data: entryData(meal) });
      invalidate();
      toast({ title: "Mahlzeit geloggt!", description: `${meal.title} wurde zu deinem Tag hinzugefügt.` });
    } catch {
      toast({ title: "Fehler", description: "Mahlzeit konnte nicht geloggt werden. Bitte versuche es erneut.", variant: "destructive" });
    } finally {
      setLoggingKey(null);
    }
  };

  const logFullDay = async () => {
    setLoggingDay(true);
    try {
      for (const meal of selectedMeals) {
        await createEntry.mutateAsync({ data: entryData(meal) });
      }
      invalidate();
      toast({ title: "Ganzer Tag geloggt!", description: `Alle ${selectedMeals.length} Mahlzeiten aus "${plan.name}" wurden hinzugefügt.` });
    } catch {
      invalidate();
      toast({ title: "Fehler", description: "Einige Mahlzeiten konnten nicht geloggt werden. Prüfe deine heutigen Einträge.", variant: "destructive" });
    } finally {
      setLoggingDay(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-full bg-slate-50">
        <div className="px-5 pt-5 pb-6 space-y-5">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ernährungspläne</h1>
            <p className="text-sm text-slate-500">Optimierte Tagespläne — Alternativen tauschen & mit einem Tipp loggen</p>
          </header>

          {/* Plan toggle */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlanId(p.id)}
                data-testid={`tab-plan-${p.id}`}
                aria-pressed={activePlanId === p.id}
                className={`py-2.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                  activePlanId === p.id
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.shortName}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Totals card (live — reflects current selection) */}
              <div className={`relative bg-gradient-to-b ${plan.gradient} rounded-3xl p-6 text-white overflow-hidden`}>
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    {plan.id === "cheat" && <PartyPopper className="w-4 h-4 text-rose-300 shrink-0" />}
                    <p className="text-sm text-white/70">{plan.tagline}</p>
                  </div>
                  <div className="flex items-end gap-1.5 mb-5">
                    <Flame className="w-5 h-5 text-orange-400 mb-1.5" />
                    <span className="text-4xl font-black tracking-tighter tabular-nums leading-none">
                      {totals.kcal}
                    </span>
                    <span className="text-white/60 text-sm mb-0.5">kcal / Tag</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Protein", value: totals.protein, icon: <Dumbbell className="w-3.5 h-3.5 text-blue-300" /> },
                      { label: "Kohlenh.", value: totals.carbs,  icon: <Wheat    className="w-3.5 h-3.5 text-emerald-300" /> },
                      { label: "Fett",    value: totals.fat,     icon: <Droplet  className="w-3.5 h-3.5 text-orange-300" /> },
                    ].map((m) => (
                      <div key={m.label} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {m.icon}
                          <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">{m.label}</span>
                        </div>
                        <span className="text-lg font-bold tabular-nums">{m.value}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Log full day */}
              <Button
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-md shadow-indigo-600/20"
                onClick={logFullDay}
                disabled={loggingDay || loggingKey !== null}
                data-testid="button-log-full-day"
              >
                {loggingDay ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Tag wird geloggt…</>
                ) : (
                  <><CalendarPlus className="w-4 h-4 mr-2" /> Ganzen Tag loggen</>
                )}
              </Button>

              {/* Meal slots */}
              <div className="space-y-3">
                {plan.slots.map((slot, slotIdx) => {
                  const meal = getSelectedMeal(slotIdx);
                  const key = `${plan.id}-${slotIdx}`;
                  const selIdx = (selections[key] ?? 0) % slot.options.length;
                  const isExpanded = !!expanded[key];
                  const meta = MEAL_META[meal.mealType];
                  return (
                    <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                            {meta.icon}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {meal.calories} <span className="font-normal text-slate-400">kcal</span>
                        </span>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${key}-${selIdx}`}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <h3 className="font-semibold text-slate-900">{meal.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{meal.foods}</p>
                          <p className="text-[11px] text-slate-400 mt-2">
                            {meal.protein}g P · {meal.carbs}g K · {meal.fat}g F
                          </p>

                          {/* Preparation & chef's note (expandable) */}
                          <button
                            onClick={() => toggleExpanded(key)}
                            aria-expanded={isExpanded}
                            data-testid={`button-prep-${key}`}
                            className="w-full mt-3 py-2.5 px-3 flex items-center justify-between gap-2 bg-amber-50 hover:bg-amber-100 active:bg-amber-100 border border-amber-200/60 rounded-xl transition-colors"
                          >
                            <span className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                              <ChefHat className="w-4 h-4 text-amber-600" />
                              Zubereitung & Chef-Tipp
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-amber-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <ol className="mt-3 space-y-2">
                                  {meal.prep.map((step, i) => (
                                    <li key={i} className="flex gap-2.5 text-xs text-slate-600 leading-relaxed">
                                      <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center mt-[1px]">
                                        {i + 1}
                                      </span>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                                <div className="mt-3 flex gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <p className="text-[11px] text-amber-800 leading-relaxed">
                                    <span className="font-semibold">Chef-Tipp:</span> {meal.note}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex gap-2 mt-4">
                        {slot.options.length > 1 && (
                          <button
                            onClick={() => swapMeal(slotIdx)}
                            disabled={loggingKey !== null || loggingDay}
                            data-testid={`button-swap-${key}`}
                            className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Tauschen ({selIdx + 1}/{slot.options.length})
                          </button>
                        )}
                        <button
                          onClick={() => logMeal(meal, key)}
                          disabled={loggingKey !== null || loggingDay}
                          data-testid={`button-log-meal-${key}`}
                          className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {loggingKey === key ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Wird geloggt…</>
                          ) : (
                            <><Plus className="w-3.5 h-3.5" /> Mahlzeit loggen</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">
                {plan.id === "cheat"
                  ? "Ein Cheat Day pro Woche kann dir helfen, langfristig dranzubleiben — morgen geht's zurück zum Plan."
                  : "Die Werte sind Schätzungen für einen durchschnittlichen Erwachsenen. Passe die Portionen an dein Körpergewicht und deine Aktivität an (Protein: ~2g pro kg Körpergewicht)."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
