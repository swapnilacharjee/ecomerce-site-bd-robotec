import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side JSON body parsing
app.use(express.json());

// Initialize Gemini SDK lazily to prevent crash on startup if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is missing or set to placeholder. Operating in fallback offline mode.");
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI:", err);
    }
  }
  return aiClient;
}

// BD Robotec Products Knowledge Base for System Instruction
const SYSTEM_INSTRUCTION = `You are the BD Robotec Expert Assistant. 
You are a highly knowledgeable robotics and embedded systems engineer. 
Your goal is to assist customers, students, and lab administrators with their technical and commercial inquiries about BD Robotec's high-fidelity catalog of parts.

Here is your current catalog and technical specifications:
1. Arduino Uno R3 (SKU: MCU-001)
   - Category: Microcontroller
   - Price: $24.99
   - Specs: ATmega328P processor, 5V operating voltage, 14 digital I/O pins, 6 analog inputs, 16 MHz clock speed, 32 KB Flash Memory.
   - Best for: Rapid prototyping, educational robotics, simple automation.

2. Servo Motor MG996R (SKU: ACT-996)
   - Category: Actuator
   - Price: $12.50
   - Specs: Operating voltage 4.8V to 7.2V, Stall torque 9.4 kg-cm (4.8V) up to 11 kg-cm (6V), Metal gears, double ball bearing, rotation angle 180 degrees.
   - Best for: Joint movements in robot arms, steering control in RC models, heavy-duty physical automation.

3. ESP32 DevKit V1 (SKU: IOT-032)
   - Category: Wireless MCU
   - Price: $8.90
   - Specs: Dual-core Tensilica Xtensa 32-bit LX6 microprocessor running at 240 MHz, built-in 802.11 b/g/n Wi-Fi and Bluetooth v4.2 BR/EDR and BLE, 4MB Flash, 520 KB SRAM, USB-to-UART CP2102.
   - Best for: Internet of Things (IoT), smart home appliances, cloud-connected sensor nodes, wireless telemetry.

4. Lidar Sensor TF-Luna (SKU: SNR-TF1)
   - Category: Sensors
   - Price: $39.00
   - Specs: Single-point ranging LiDAR, range 0.2m to 8m, accuracy ±6cm @ (0.2m-3m) and ±2% @ (3m-8m), frame rate 100Hz, field of view (FoV) 2°, I2C and UART interfaces, light source VCSEL 850nm.
   - Best for: Distance measurement, obstacle avoidance in autonomous robots, drone altitude hold, intelligent traffic detection.

Procurement and Corporate details:
- Standard shipping takes 2-4 business days.
- We offer bulk tiered discounts for industrial laboratories, academic institutions, and hardware startups:
  - 100+ units: 5% off
  - 500+ units: 10% off + free premium freight shipping
  - 1000+ units: 20% off + custom system integration support
- We provide 100% Quality Assurance, where every component undergoes physical and functional validation prior to shipping.
- Customers can place orders directly by adding items to their cart and generating a WhatsApp order template or initiating a Chat.

Be polite, technical, helpful, and concise. Format specs clearly with bullet points where appropriate. If asked about code, write clean, brief Arduino/C++ or MicroPython snippets to interface with the specified board or sensor!`;

// Smart client-side fallback responses for offline mode
const FALLBACK_RESPONSES = [
  "Hi! I'm your BD Robotec support assistant. How can I assist you with component datasheets, technical inquiries, or orders today?",
  "Standard shipping takes 2-4 business days. For bulk orders over 500 units, we offer a 10% discount and free premium freight shipping!",
  "To connect the Lidar Sensor TF-Luna to the Arduino Uno R3, use the I2C interface. Connect SDA to A4 and SCL to A5, and power the sensor with 5V.",
  "The Servo Motor MG996R requires a stable external power supply if driving multiple units, as its peak stall current can exceed 1A. Avoid powering it directly from the Arduino's 5V pin under heavy loads.",
  "The ESP32 DevKit V1 is excellent for IoT! You can run MicroPython or C++ via Arduino IDE to connect to Wi-Fi and communicate over MQTT or HTTP.",
];

function getSmartFallbackReply(message: string): string {
  const query = message.toLowerCase();
  let reply = "";

  if (query.includes("lidar") || query.includes("luna") || query.includes("sensor")) {
    reply = `**TF-Luna LiDAR Sensor Technical Info:**\n- **Range:** 0.2m - 8m\n- **Rate:** 100Hz\n- **Interface:** I2C or UART\n- **Best Use:** Autonomous mobile robots (AMR) for obstacle avoidance.\n\nTo connect to an **Arduino Uno R3**, use SDA (Pin A4) and SCL (Pin A5). Ground to GND, and VCC to 5V. Use the standard \`<Wire.h>\` library to query distance registers.`;
  } else if (query.includes("servo") || query.includes("motor") || query.includes("mg996")) {
    reply = `**Servo Motor MG996R Details:**\n- **Torque:** ~10 kg-cm at 6.0V\n- **Gears:** High-precision metal gears\n- **Angle:** 0 to 180 degrees\n\n*Wiring Tip:* Connect PWM Signal (Orange/Yellow) to Arduino digital pin (e.g. Pin 9), Red to an external 5V-6V power source, and Black/Brown to common GND. **Warning:** Do not run off the Arduino 5V pin directly under load, as it might draw up to 1.2A!`;
  } else if (query.includes("arduino") || query.includes("uno")) {
    reply = `**Arduino Uno R3 Microcontroller Overview:**\n- **Processor:** ATmega328P @ 16 MHz\n- **Pins:** 14 digital pins (6 PWM-enabled) and 6 analog pins\n- **Operating Voltage:** 5V\n\nIt is the gold standard for rapid prototyping. Extremely durable and supported by thousands of open-source libraries.`;
  } else if (query.includes("esp32") || query.includes("wifi") || query.includes("wireless") || query.includes("bluetooth")) {
    reply = `**ESP32 DevKit V1 Wi-Fi + BLE module:**\n- **Processor:** Tensilica Dual-Core LX6 @ 240 MHz\n- **Wireless:** Integrated Wi-Fi & Bluetooth Classic/BLE\n- **Pin Count:** 30 GPIO pins\n\nIdeal for modern IoT, smart agriculture, and edge telemetry applications. Can be programmed in Arduino C++ or MicroPython.`;
  } else if (query.includes("bulk") || query.includes("discount") || query.includes("procure") || query.includes("quote")) {
    reply = `We support academic, lab, and industrial bulk procurement! Our tiers are:\n- **100+ units:** 5% discount\n- **500+ units:** 10% discount + free freight\n- **1000+ units:** 20% discount + direct systems engineer support\n\nYou can click **'GENERATE QUOTE'** below the inventory to customize your items, apply these discounts dynamically, and create a printable proposal!`;
  } else if (query.includes("shipping") || query.includes("delivery") || query.includes("time")) {
    reply = `Standard domestic shipping takes **2 to 4 business days**. We dispatch all orders within 24 hours of confirmation. Standard order fulfillment notification will be dispatched with real-time tracking links!`;
  } else {
    reply = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
  }
  return reply;
}

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const ai = getAiClient();

  if (!ai) {
    // Offline / Mock fallback response to keep the UI fully functional and responsive
    console.log("No active Gemini API key found. Providing smart local response.");
    const reply = getSmartFallbackReply(message);
    // Simulate short network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 600));
    return res.json({ text: reply, isFallback: true });
  }

  try {
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    if (history && Array.isArray(history) && history.length > 0) {
      config.history = history.map((h: { role: string; content: string }) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      }));
    }

    // Format history for GoogleGenAI SDK's chat
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: config,
    });

    const response = await chat.sendMessage({ message: message });
    return res.json({ text: response.text, isFallback: false });
  } catch (error: any) {
    console.error("Gemini API Error (gracefully falling back to local smart assistant):", error);
    const reply = getSmartFallbackReply(message);
    const disclaimerReply = `*(Note: The online AI model is currently under heavy load or temporarily unavailable. Providing offline assistant backup)*\n\n${reply}`;
    return res.json({ text: disclaimerReply, isFallback: true });
  }
});

// Configure Vite middleware / Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all non-API requests (Express v4 style)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BD Robotec Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
