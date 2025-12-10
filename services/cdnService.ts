  import { CdnMetadataSchema } from "../schemas/cdn";

  const CDN_URL = process.env.EXPO_PUBLIC_CDN_URL;
  const CDN_AUTH_TOKEN = process.env.EXPO_PUBLIC_CDN_AUTH_TOKEN;

  function buildUrl(path: string) {
    // @ts-ignore: handling potential undefined environments gracefully
    return (CDN_URL || "").replace(/\/$/, "") + "/" + path.replace(/^\//, "");
  }

  export async function cdnUploadFile(file: File | Blob, filename: string): Promise<string> {
    const form = new FormData();
    // @ts-ignore: React Native FormData logic specific
    form.append("file", file, filename);
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

    // return the first uploaded file's URL
    return parsed.data.files[0].url;
  }