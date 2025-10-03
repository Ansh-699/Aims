export const runtime = 'edge';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const form = new URLSearchParams({ username, password });

  const res = await fetch(
    "https://abes.platform.simplifii.com/api/v1/admin/authenticate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://abes.web.simplifii.com",
        Referer: "https://abes.web.simplifii.com/",
      },
      body: form.toString(),
    }
  );

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
