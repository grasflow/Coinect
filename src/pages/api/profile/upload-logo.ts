import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Logo file is required",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid file type. Only PNG and JPG are allowed.",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "File size exceeds 2MB limit",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || file.type.split("/")[1];
    const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer for Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Delete old logo if exists
    const { data: profile } = await supabase.from("profiles").select("logo_url").eq("id", user.id).single();

    if (profile?.logo_url) {
      // Extract file path from URL
      const oldPath = profile.logo_url.split("/logos/")[1];
      if (oldPath) {
        await supabase.storage.from("logos").remove([oldPath]);
      }
    }

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage.from("logos").upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL (even though bucket is private, we'll use signed URLs for PDF generation)
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Update profile with logo URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        logo_url: logoUrl,
        message: "Logo uploaded successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload logo error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "UPLOAD_FAILED",
          message: "Failed to upload logo",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
