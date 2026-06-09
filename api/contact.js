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

  const form = new URLSearchParams({
    _subject: `[Vector World 문의] ${cleanTitle}`,
    _template: "table",
    _captcha: "false",
    title: cleanTitle,
    email: cleanEmail,
    message: cleanMessage || "(내용 없음)",
  });

  const submitResponse = await fetch("https://formsubmit.co/ajax/vector@geekble.kr", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form,
  });

  if (!submitResponse.ok) {
    return response.status(502).json({ error: "Failed to forward inquiry" });
  }

  return response.status(200).json({ ok: true });
};
