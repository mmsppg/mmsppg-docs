import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete("committee_auth", { path: "/" });
  return redirect("/login");
};