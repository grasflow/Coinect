import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  const { error } = await locals.supabase.auth.signOut();

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Błąd podczas wylogowywania",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return redirect("/login");
};
