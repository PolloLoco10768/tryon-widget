let analyticsEvents: any[] = [];

// GET → return analytics data
export async function GET() {
  return Response.json({
    totalEvents: analyticsEvents.length,
    events: analyticsEvents,
    counts: analyticsEvents.reduce((acc: any, event: any) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {}),
  });
}

// POST → receive analytics events
export async function POST(req: Request) {
  const body = await req.json();

  const event = {
    ...body,
    createdAt: new Date().toISOString(),
  };

  analyticsEvents.push(event);

  return Response.json({
    success: true,
    event,
  });
}