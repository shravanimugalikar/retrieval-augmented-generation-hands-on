import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Dot Product
function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must be the same length");
  }

  return a.reduce((sum, value, index) => {
    return sum + value * b[index];
  }, 0);
}

// Cosine Similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = dotProduct(a, b);

  const magnitudeA = Math.sqrt(dotProduct(a, a));
  const magnitudeB = Math.sqrt(dotProduct(b, b));

  return dot / (magnitudeA * magnitudeB);
}

async function main() {
  const sentences = [
    "I love coding in JavaScript",
    "TypeScript is my favorite language",
    "I love eating pizza",
  ];

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: sentences,
  });

  const [vec1, vec2, vec3] = response.data.map(
    (item) => item.embedding
  );

  // Dot Products
  const jsTsDot = dotProduct(vec1, vec2);
  const jsPizzaDot = dotProduct(vec1, vec3);

  // Cosine Similarities
  const jsTsCos = cosineSimilarity(vec1, vec2);
  const jsPizzaCos = cosineSimilarity(vec1, vec3);

  console.log("\n===== DOT PRODUCT =====");
  console.log("JavaScript vs TypeScript:", jsTsDot);
  console.log("JavaScript vs Pizza:", jsPizzaDot);

  console.log("\n===== COSINE SIMILARITY =====");
  console.log("JavaScript vs TypeScript:", jsTsCos);
  console.log("JavaScript vs Pizza:", jsPizzaCos);

  console.log("\n===== INTERPRETATION =====");

  if (jsTsCos > jsPizzaCos) {
    console.log(
      "JavaScript and TypeScript are semantically more similar."
    );
  } else {
    console.log(
      "JavaScript and Pizza are unexpectedly more similar."
    );
  }
}

main().catch(console.error);