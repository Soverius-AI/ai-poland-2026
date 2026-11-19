export interface LocalModelConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  reviewModel: string;
}
export function localModelConfig(
  env: Record<string, string | undefined> = process.env,
): LocalModelConfig {
  const baseURL = (
    env["LOCAL_MODEL_BASE_URL"] || "http://127.0.0.1:8080/v1"
  ).replace(/\/+$/, "");
  const url = new URL(baseURL);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "LOCAL_MODEL_BASE_URL must be an HTTP(S) model API URL without credentials, query or fragment.",
    );
  const model = env["LOCAL_MODEL_NAME"]?.trim() || "gemma-local";
  return {
    baseURL,
    apiKey: env["LOCAL_MODEL_API_KEY"] || "local",
    model,
    reviewModel: env["LOCAL_REVIEW_MODEL"]?.trim() || model,
  };
}
