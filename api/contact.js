module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const { title, email, message } = request.body || {};
  const cleanTitle = String(title || "").trim();
  const cleanEmail = String(email || "").trim();
  const cleanMessage = String(message || "").trim();

  if (!cleanTitle || !cleanEmail) {
    return response.status(400).json({ error: "Title and email are required" });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(cleanEmail)) {
    return response.status(400).json({ error: "Invalid email" });
  }

  const payload = {
    _subject: `[Vector World 문의] ${cleanTitle}`,
    _template: "table",
    _captcha: "false",
    _replyto: cleanEmail,
    title: cleanTitle,
    email: cleanEmail,
    message: cleanMessage || "(내용 없음)",
  };

  const submitResponse = await fetch("https://formsubmit.co/ajax/vector@geekble.kr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: "https://vector-portfolio-2026.vercel.app/",
    },
    body: JSON.stringify(payload),
  });

  if (!submitResponse.ok) {
    return response.status(502).json({ error: "Failed to forward inquiry" });
  }

  const result = await submitResponse.json();
  const submitMessage = String(result.message || "");
  const needsActivation = submitMessage.toLowerCase().includes("activation");

  if (result.success === "false" && !needsActivation) {
    return response.status(502).json({ error: "Failed to forward inquiry" });
  }

  return response.status(200).json({ ok: true, needsActivation });
};
