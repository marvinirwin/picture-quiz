import Vision from "@google-cloud/vision";

export function getVision() {
  return new Vision.ImageAnnotatorClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS as string),
  });
}
