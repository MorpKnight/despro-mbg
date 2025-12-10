import { CdnMetadataSchema } from "../schemas/cdn";
import { Platform } from "react-native";

const CDN_URL = process.env.EXPO_PUBLIC_CDN_URL;
const CDN_AUTH_TOKEN = process.env.EXPO_PUBLIC_CDN_AUTH_TOKEN;

function buildUrl(path: string) {
  return (CDN_URL || "").replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}

export async function cdnUploadFile(file: any, filename: string): Promise<string> {
  const form = new FormData();

  if (Platform.OS === "android") {
    console.log("[CDN] Preparing Android upload:", file);

    // Android file must use { uri, type, name }
    form.append("file", {
      uri: file.uri ?? file,     // supports both { uri } or raw URI string
      type: "image/jpeg",
      name: filename,
    });
  } else {
    console.log("[CDN] Preparing iOS/Web upload as Blob");
    // iOS/Web → Blob upload
    form.append("file", file, filename);
  }

  const response = await fetch(buildUrl("upload"), {
    method: "POST",
    headers: {
      Authorization: CDN_AUTH_TOKEN || "",
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`CDN Upload Failed: ${await response.text()}`);
  }

  const json = await response.json();
  const parsed = CdnMetadataSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid CDN response format");

  return parsed.data.files[0].url;
}
