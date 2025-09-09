export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("잘못된 요청 본문", { status: 400 });
  }
  const { messages = [], system: systemFromBody } = body || {};

  // 200자 제한
  const last = messages.at(-1);
  if (last?.role === "user" && last.content.length > 200) {
    return new Response("200자 이하만 입력 가능", { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;

  // 키가 없으면 개발용 에코 스트림으로 응답 (프론트 흐름 검증용)
  if (!key) {
    const userText = last?.content || "";
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        const lines = [
          `data: ${JSON.stringify({ output_text: `에코: ${userText}` })}\n\n`,
          "data: [DONE]\n\n",
        ];
        for (const l of lines) controller.enqueue(enc.encode(l));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const systemPrompt: string | undefined = systemFromBody;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      messages: (messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      system: systemPrompt,
    }),
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    const fallback = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        const msg = text || "AI 응답 오류가 발생했습니다.";
        controller.enqueue(
          enc.encode(`data: ${JSON.stringify({ output_text: msg })}\n\n`)
        );
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(fallback, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
      status: 200,
    });
  }

  // Anthropic SSE를 우리 포맷으로 변환하여 전달
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      const dec = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      function emitText(text: string) {
        controller.enqueue(
          enc.encode(`data: ${JSON.stringify({ output_text: text })}\n\n`)
        );
      }

      function handleLine(line: string) {
        if (line.startsWith(":")) return; // comment line
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
          return;
        }
        if (line.startsWith("data:")) {
          const jsonStr = line.slice(5).trim();
          if (jsonStr === "[DONE]") return; // anthropic doesn't use this, but guard
          try {
            const data = JSON.parse(jsonStr);
            // content_block_delta with text_delta carries text chunks
            if (
              currentEvent === "content_block_delta" &&
              data?.delta?.type === "text_delta" &&
              typeof data?.delta?.text === "string"
            ) {
              emitText(data.delta.text);
            }
            if (currentEvent === "message_stop") {
              controller.enqueue(enc.encode("data: [DONE]\n\n"));
            }
          } catch {}
        }
      }

      (async () => {
        const reader = resp.body!.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            handleLine(line);
          }
        }
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
