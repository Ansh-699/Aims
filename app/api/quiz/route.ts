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
    const quizRes = await fetch(
      "https://abes.platform.simplifii.com/api/v1/custom/myEvaluatedQuizzes",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const quizData = await quizRes.json();

    if (!quizRes.ok) {
      return new Response(JSON.stringify({
        error: "Failed to fetch quiz data",
        status: quizRes.status,
        response: quizData,
      }), {
        status: quizRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(quizData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
