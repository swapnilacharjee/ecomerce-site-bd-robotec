import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM_INSTRUCTION = `You are the BD Robotec Expert Assistant. You are a highly knowledgeable robotics and embedded systems engineer. Your goal is to assist customers, students, and lab administrators with their technical and commercial inquiries about BD Robotec's high-fidelity catalog of parts.

Here is your current catalog:
1. Arduino Uno R3 (SKU: MCU-001) - Price: ৳3000 - ATmega328P, 5V, 14 digital I/O, 16 MHz, 32KB Flash
2. Servo Motor MG996R (SKU: ACT-996) - Price: ৳1500 - 10kg-cm torque, metal gears, 180° rotation
3. ESP32 DevKit V1 (SKU: IOT-032) - Price: ৳1070 - Dual-core 240MHz, Wi-Fi + BLE, 4MB Flash
4. Lidar Sensor TF-Luna (SKU: SNR-TF1) - Price: ৳4680 - 0.2m-8m range, 100Hz, I2C & UART

Bulk discounts: 100+ units: 5% off, 500+ units: 10% off + free shipping, 1000+ units: 20% off.
Shipping: 2-4 business days. Be polite, technical, and concise.`;

const FALLBACK_RESPONSES: Record<string, string> = {
  lidar: `**TF-Luna LiDAR Sensor:**\n- Range: 0.2m - 8m, Rate: 100Hz\n- Interface: I2C (SDA→A4, SCL→A5) or UART\n- Price: ৳4680`,
  servo: `**Servo Motor MG996R:**\n- Torque: ~10 kg-cm at 6V, Angle: 0-180°\n- Connect PWM to Arduino pin 9, use external 5-6V power\n- Price: ৳1500`,
  arduino: `**Arduino Uno R3:**\n- ATmega328P @ 16MHz, 14 digital pins, 6 analog\n- Best for rapid prototyping\n- Price: ৳3000`,
  esp32: `**ESP32 DevKit V1:**\n- Dual-core LX6 @ 240MHz, Wi-Fi + BLE\n- 30 GPIO pins, supports Arduino & MicroPython\n- Price: ৳1070`,
  bulk: `**Bulk Discounts:**\n- 100+ units: 5% off\n- 500+ units: 10% off + free shipping\n- 1000+ units: 20% off + engineer support`,
  shipping: `Standard shipping: **2-4 business days**. Orders dispatched within 24 hours.`,
};

function getFallbackReply(message: string): string {
  const q = message.toLowerCase();
  if (q.includes("lidar") || q.includes("luna") || q.includes("sensor")) return FALLBACK_RESPONSES.lidar;
  if (q.includes("servo") || q.includes("motor") || q.includes("mg996")) return FALLBACK_RESPONSES.servo;
  if (q.includes("arduino") || q.includes("uno")) return FALLBACK_RESPONSES.arduino;
  if (q.includes("esp32") || q.includes("wifi") || q.includes("bluetooth")) return FALLBACK_RESPONSES.esp32;
  if (q.includes("bulk") || q.includes("discount") || q.includes("quote")) return FALLBACK_RESPONSES.bulk;
  if (q.includes("shipping") || q.includes("delivery")) return FALLBACK_RESPONSES.shipping;
  return "Hi! I'm BD Robotec Support. Ask me about our products (Arduino, ESP32, Servo, LiDAR), pricing, bulk discounts, or shipping!";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
    await new Promise((r) => setTimeout(r, 500));
    return res.json({ text: getFallbackReply(message), isFallback: true });
  }

  try {
    const contents = [
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from Gemini");

    return res.json({ text, isFallback: false });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.json({ text: getFallbackReply(message), isFallback: true });
  }
}
