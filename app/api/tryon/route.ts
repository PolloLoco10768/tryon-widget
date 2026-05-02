import Replicate from "replicate";

export async function GET() {
  return Response.json({
    message: "Try-on API is working",
  });
}

export async function POST(req: Request) {
  try {
    // 🔐 Check API key exists
    if (!process.env.REPLICATE_API_TOKEN) {
      return Response.json(
        { error: "Missing REPLICATE_API_TOKEN" },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // 🔥 THIS WAS THE MISSING LINE (IMPORTANT)
    const { image, clothing } = await req.json();

    // 🛑 Validate input
    if (!image || !clothing) {
      return Response.json(
        { error: "Missing image or clothing" },
        { status: 400 }
      );
    }

    // 🤖 Call AI model
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: `A realistic fashion photo of a person wearing ${clothing.name}, studio lighting, high quality`,
        },
      }
    );

    // ✅ Success response
    return Response.json({
      success: true,
      result: output,
    });

  } catch (err) {
    console.error("TRYON API ERROR:", err);

    return Response.json(
      {
        error: "AI request failed",
        details: String(err),
      },
      { status: 500 }
    );
  }
}