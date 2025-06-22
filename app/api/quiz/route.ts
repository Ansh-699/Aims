// Enhanced caching with request deduplication
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const pendingRequests = new Map<string, Promise<any>>();

type CacheEntry = {
  data: any;
  timestamp: number;
};
const quizCache = new Map<string, CacheEntry>();

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Token required in Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.split(" ")[1];

  // Check cache first
  const cacheKey = `quiz_${token.slice(0, 10)}`;
  const cached = quizCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log("[quiz] serving from cache");
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=300, stale-while-revalidate=1800",
        "X-Cache": "HIT"
      },
    });
  }

  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    console.log("[quiz] waiting for pending request");
    try {
      const result = await pendingRequests.get(cacheKey);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=300, stale-while-revalidate=1800",
          "X-Cache": "PENDING"
        },
      });
    } catch (error) {
      // If pending request failed, continue to make new request
    }
  }

  // Create new request
  const requestPromise = makeQuizRequest(token);
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const quizData = await requestPromise;
    
    // Store in cache
    quizCache.set(cacheKey, {
      data: quizData,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify(quizData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=300, stale-while-revalidate=1800",
        "X-Cache": "MISS"
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
  } finally {
    // Clean up pending request
    pendingRequests.delete(cacheKey);
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
