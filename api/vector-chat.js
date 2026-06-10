const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const MODEL = "gpt-4.1-mini";
const SITE_ORIGIN = "https://vector-portfolio-2026.vercel.app";

const systemPrompt = `
You are Vector Bot, a concise Korean portfolio consultation assistant for Vector World.
Help visitors understand possible work with Vector: eP robot customization, physical robot builds,
AI hardware, event/exhibition operation, marketing, and video production.

Rules:
- Answer in Korean unless the visitor writes in English.
- Keep replies practical and brief, usually 2-4 sentences.
- Ask for project goal, desired deliverable, schedule, budget range, and contact info when relevant.
- Do not promise confirmed availability, price, legal guarantees, or technical feasibility without a follow-up.
- If a visitor wants to proceed, guide them to leave contact details or email vector@geekble.kr.
`;

const notifyEndpoint = "https://formsubmit.co/ajax/vector@geekble.kr";

const json = (response, statusCode = 200) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
};

const cleanText = (value, maxLength) => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
};

const extractText = (data) => {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
};

const createResponse = async (apiKey, input, maxOutputTokens = 360) => {
  const aiResponse = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: systemPrompt,
      input,
      max_output_tokens: maxOutputTokens,
      temperature: 0.6,
    }),
  });

  const data = await aiResponse.json();
  return { aiResponse, data };
};

const buildTranscript = (history) =>
  history
    .map((item) => {
      const role = item && item.role === "assistant" ? "assistant" : "user";
      const text = cleanText(item && item.content, 700);
      return text ? `${role}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");

const sendNotification = async ({ apiKey, topic, contact, history }) => {
  const transcript = buildTranscript(history);
  const summaryInput = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `다음 상담 대화를 Vector에게 전달할 짧은 한국어 요약으로 정리하세요.

포함할 내용:
- 상담 주제
- 방문자가 원하는 것
- 예산/일정/연락처가 있으면 표시
- 바로 follow-up 해야 할 질문

상담 주제: ${topic}
방문자 연락처: ${contact || "(미입력)"}
대화:
${transcript || "(대화 없음)"}`,
        },
      ],
    },
  ];

  const { aiResponse, data } = await createResponse(apiKey, summaryInput, 280);
  if (!aiResponse.ok) {
    throw new Error("summary_failed");
  }

  const summary = extractText(data) || transcript || "상담 내용이 비어 있습니다.";
  const mailResponse = await fetch(notifyEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: SITE_ORIGIN,
      Referer: `${SITE_ORIGIN}/`,
    },
    body: JSON.stringify({
      _subject: `[Vector Chat 상담 요약] ${topic}`,
      _template: "table",
      _captcha: "false",
      topic,
      contact: contact || "(미입력)",
      summary,
      transcript: transcript || "(대화 없음)",
    }),
  });

  const mailResult = await mailResponse.json().catch(() => ({}));
  const needsActivation = String(mailResult.message || "").toLowerCase().includes("activation");
  if (!mailResponse.ok || mailResult.success === "false") {
    if (!needsActivation) {
      throw new Error("mail_failed");
    }
  }

  return { summary, needsActivation };
};

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    json(response, 405);
    response.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  const apiKey = process.env.VECTOR_CHAT_API_KEY || process.env.VECTOR_CHAT || process.env.vector_chat;
  if (!apiKey) {
    json(response, 503);
    response.end(JSON.stringify({ error: "missing_api_key" }));
    return;
  }

  const body = typeof request.body === "object" && request.body ? request.body : {};
  const topic = cleanText(body.topic, 80) || "일반 문의";
  const message = cleanText(body.message, 1200);
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const contact = cleanText(body.contact, 220);

  if (body.action === "notify") {
    try {
      const result = await sendNotification({ apiKey, topic, contact, history });
      json(response);
      response.end(JSON.stringify({ ok: true, summary: result.summary, needsActivation: result.needsActivation }));
    } catch (error) {
      json(response, 500);
      response.end(JSON.stringify({ error: "notification_failed" }));
    }
    return;
  }

  if (!message) {
    json(response, 400);
    response.end(JSON.stringify({ error: "empty_message" }));
    return;
  }

  const transcript = buildTranscript(history);

  try {
    const { aiResponse, data } = await createResponse(apiKey, [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `상담 주제: ${topic}\n방문자 연락처: ${contact || "(미입력)"}\n이전 대화:\n${transcript || "(없음)"}\n\n방문자 메시지: ${message}`,
          },
        ],
      },
    ]);

    if (!aiResponse.ok) {
      json(response, aiResponse.status);
      response.end(JSON.stringify({ error: "openai_error", detail: data.error && data.error.message }));
      return;
    }

    json(response);
    response.end(JSON.stringify({ reply: extractText(data) || "좋습니다. 프로젝트 목적과 일정, 필요한 산출물을 조금 더 알려주세요." }));
  } catch (error) {
    json(response, 500);
    response.end(JSON.stringify({ error: "server_error" }));
  }
};
