export type Plan = "purr" | "wag";

export type Product = {
  id: string;
  name: string;
  blurb: string;
  plan: Plan;
  price: string;
  per: string;
  imageEmoji: string;
  highlights: string[];
};

export const products: Product[] = [
  {
    id: "feline-salmon-breeze",
    name: "Feline: Salmon Breezy Dream",
    blurb: "Omega-rich kibble for cats who have purr-sonal trainers.",
    plan: "purr",
    price: "34.99",
    per: "month, delivered on your cat’s calendar (always Caturday).",
    imageEmoji: "🍣",
    highlights: [
      "Grain-optional, drama-forward",
      "Catches fish stories so your cat can nap like royalty",
    ],
  },
  {
    id: "caturday-night-feast",
    name: "Caturday Night Feasters",
    blurb: "Small-batch, big-attitude, with extra sass on the side.",
    plan: "purr",
    price: "29.99",
    per: "month, enough attitude for 9 lives.",
    imageEmoji: "🥘",
    highlights: [
      "Creamy pâté, zero patience",
      "Pairs well with red dot workouts",
    ],
  },
  {
    id: "bark-quet-n-gravy",
    name: "Bark-quet in Gravy",
    blurb: "Slow-braised beef notes with a high-five finish.",
    plan: "wag",
    price: "32.50",
    per: "month, for dogs who read nutrition labels and eat them.",
    imageEmoji: "🍖",
    highlights: [
      "Joint-cuddly glucosamine",
      "A hearty wag after every meal",
    ],
  },
  {
    id: "pawsta-primavera",
    name: "Pawsta Primavera (Dog Edition)",
    blurb: "Garden veggies and pasta-shaped joy—hold the carb guilt.",
    plan: "wag",
    price: "30.00",
    per: "month, for pups who like al dente zoomies.",
    imageEmoji: "🍝",
    highlights: [
      "Digestive harmony (no “backyard reprints”)",
      "Chef’s kiss, vet’s nod, mail carrier’s new best friend",
    ],
  },
];
