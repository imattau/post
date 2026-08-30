import type { EmbeddingProvider, EmbeddingVector } from "@0xx0lostcause0xx0/polypack";

// all-MiniLM-L6-v2, self-hosted (weights under public/models, ONNX runtime WASM
// under public/ort) so nothing is fetched from huggingface.co or a CDN at
// runtime. 384-dim output, matching polypack's feature-hash default.
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const DIMENSIONS = 384;

type FeatureExtractor = (
  text: string,
  options?: { pooling?: "mean"; normalize?: boolean },
) => Promise<{ data: Float32Array | Float64Array }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

async function getExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");

      env.allowRemoteModels = false;
      env.allowLocalModels = true;
      env.localModelPath = "/models/";
      if (env.backends.onnx.wasm) {
        env.backends.onnx.wasm.wasmPaths = {
          wasm: "/ort/ort-wasm-simd-threaded.asyncify.wasm",
          mjs: "/ort/ort-wasm-simd-threaded.asyncify.mjs",
        };
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.proxy = false;
      }

      return pipeline("feature-extraction", MODEL_ID) as unknown as Promise<FeatureExtractor>;
    })();
  }
  return extractorPromise;
}

/**
 * Semantic sentence embedding backed by a locally-run all-MiniLM-L6-v2 model
 * (transformers.js / ONNX Runtime Web, WASM backend). Replaces polypack's
 * default lexical feature-hash embedding with real semantic similarity.
 * Browser/Tauri-webview only — the model and runtime load lazily on first
 * use, entirely client-side.
 */
export const semanticEmbedding: EmbeddingProvider = {
  dimensions: DIMENSIONS,
  async embed(text: string): Promise<EmbeddingVector> {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return new Float32Array(output.data);
  },
};
