import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const ASSESSMENT_BUCKET = "assessment-files";

function getAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://zfouzydarrtqfmrqjvsd.supabase.co";

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined on the server.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Uploads an assessment resource file to the private Supabase Storage bucket.
 *
 * @param filePath Path inside the bucket (e.g., `assessments/{id}/{fileName}`)
 * @param fileData Buffer, Uint8Array, or Blob containing the file content
 * @param contentType MIME type of the file
 */
export async function uploadAssessmentFile(
  filePath: string,
  fileData: ArrayBuffer | Buffer | Uint8Array,
  contentType: string
): Promise<{ path: string }> {
  const supabase = getAdminClient();

  const { data, error } = await supabase.storage
    .from(ASSESSMENT_BUCKET)
    .upload(filePath, fileData, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { path: data.path };
}

/**
 * Generates a time-limited signed URL for downloading a private assessment file.
 *
 * @param filePath Path inside the bucket
 * @param expiresInSeconds Duration in seconds for which the URL remains valid (default: 3600 = 1 hour)
 */
export async function getSignedAssessmentFileUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const supabase = getAdminClient();

  const { data, error } = await supabase.storage
    .from(ASSESSMENT_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed download URL: ${error?.message || "Unknown error"}`);
  }

  return data.signedUrl;
}

/**
 * Removes an assessment file from the storage bucket.
 *
 * @param filePath Path inside the bucket
 */
export async function deleteAssessmentFile(filePath: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase.storage
    .from(ASSESSMENT_BUCKET)
    .remove([filePath]);

  if (error) {
    console.warn(`[storage] Warning: could not delete file ${filePath}: ${error.message}`);
  }
}
