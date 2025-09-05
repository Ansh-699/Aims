// Disable caching to ensure fresh quiz data per user/token
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Token required in Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.split(" ")[1];

  try {
  const quizData = await makeQuizRequest(token);

    return new Response(JSON.stringify(quizData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Cache": "BYPASS"
      },
    });

  } catch (error) {
    console.error("[quiz] API error:", error);
    return new Response(JSON.stringify({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
    });
  }
}

async function makeQuizRequest(token: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced to 8s

  try {
    const quizRes = await fetch(
      "https://abes.platform.simplifii.com/api/v1/custom/myEvaluatedQuizzes",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    
    if (!quizRes.ok) {
      const quizData = await quizRes.json();
      throw new Error(`API request failed with status ${quizRes.status}: ${quizData.message || 'Unknown error'}`);
    }

    return await quizRes.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
