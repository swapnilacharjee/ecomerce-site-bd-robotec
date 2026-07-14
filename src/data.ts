import { Product } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: "arduino-uno",
    name: "Arduino Uno R3",
    sku: "MCU-001",
    category: "MICROCONTROLLER",
    description: "Original ATmega328P Rev3. The standard for rapid prototyping and educational robotics.",
    price: 3000,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCLfqeyM-Sg0ed-hmjx9PFU3d-6yopdv1pxMTgxMiVYOavzQkDfGT-mmYZa-bcVBeFnitgVOCic6ZZI1acwRH9itI9AODfsoYKz0qgTqekLkclUwi0CkXmocHQIE6Jy7pSli722_Ko12REpygRKihvgYeAUPStDMiBT1cgEN652YTd1GekkiH61CXanG2xLlbcCUr1nlzGQur8xf0khmzOgZ0vDl2FhtdjuIqH7iT4rSDz-OwIM5sCE",
    specs: [
      "Processor: ATmega328P Rev3",
      "Operating Voltage: 5V",
      "Digital I/O Pins: 14 (6 PWM outputs)",
      "Analog Input Pins: 6",
      "Clock Speed: 16 MHz",
      "Flash Memory: 32 KB"
    ]
  },
  {
    id: "servo-mg996r",
    name: "Servo Motor MG996R",
    sku: "ACT-996",
    category: "ACTUATOR",
    description: "Torque: 10kg-cm. Precision metal gears for high-stress mechanical automation.",
    price: 1500,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmEbuWQNiEbUEyDRYSL3NTxwlYdCP1LbOZo38eAJ2J3mIGTZk1a9h_GUmRiA75h81H9yLlm1QrwKPjVNFLhzuogQcRrR0ZFlHiVZPpGD1pzLlyB9zNZhGTLY8lvXuAkZkjbfLMmrWx3jEwwl4EGRAzlt6qtgYQVadmXQhhgJlJZDOMdsMWfTqkD4o3pH4kJMX5WGSI43-XlqUTCl9JbXfMX8al7DuEEiEFdDA4RnGEsFSPosmE533u",
    specs: [
      "Stall Torque: 9.4 kg-cm (4.8V) / 11 kg-cm (6V)",
      "Gears: Double Ball Bearing & Metal Gear Train",
      "Operating Speed: 0.17 s/60° (4.8V) / 0.13 s/60° (6.0V)",
      "Operating Voltage: 4.8V to 7.2V",
      "Rotation Angle: 180°",
      "Weight: 55g"
    ]
  },
  {
    id: "esp32-devkit",
    name: "ESP32 DevKit V1",
    sku: "IOT-032",
    category: "WIRELESS MCU",
    description: "Dual-Core Wi-Fi + Bluetooth. Low-power IoT solution for connected devices.",
    price: 1070,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDcA0NxlAmNGIG8jFJ_h7AJWEEpea7vJ9w7cw9OY4phWi5wNqGS6LQnfyGgWtLFqLMmU8ouXcISwj3MFSvhYPB3hX_p0Z83ZpnEW5MQs_URXjeL3KCeqsX5EfIhfO305wX96eFV7juIA6qVRXTKvgTl1EH451bEX8b16kEyiUPy5390b838gd8YJlzMiRqnAvlPXfMiG05YnShqMQLWuQUbbGZSlVmw6p97ImqibOjaBS88g-oH47FM",
    specs: [
      "Processor: Xtensa Dual-Core 32-bit LX6 @ 240 MHz",
      "Wireless: Wi-Fi 802.11 b/g/n & BLE 4.2",
      "SRAM: 520 KB",
      "Flash Memory: 4 MB",
      "Interfaces: SPI, I2C, UART, ADC, DAC, PWM",
      "Form Factor: 30-pin Breadboard Friendly"
    ]
  },
  {
    id: "lidar-tf-luna",
    name: "Lidar Sensor TF-Luna",
    sku: "SNR-TF1",
    category: "SENSORS",
    description: "Range: 8m. ToF technology for high-precision distance measuring and obstacle avoidance.",
    price: 4680,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEhKtJDWQBw_MPM9rKe1dwgkHd2l1mu9LqoX5RvzPkEGQpsd7o2uBw7uBMKYfNesjzUzt2HyvQ9KaOcDXgkRZSMQC0TP1SJesr9eONZ6CofAMbmtQnKa_ZCY9RNausuXtGw39E6gdolNAwxp9NKExlaIA1UzR2E4vkoWEj9gPYLsPTi4GlJd0dKyAqZoNARoEMMUUw7v5Ova0_nOh0FXScGZJIw4lfRZZ5VAzhdYFZfJUYOA-hFY1O",
    specs: [
      "Operating Range: 0.2m to 8m",
      "Accuracy: ±6cm @ (0.2m-3m), ±2% @ (3m-8m)",
      "Measurement Frequency: 100Hz",
      "Field of View (FoV): 2°",
      "Communication Interface: I2C & UART",
      "Light Source: VCSEL 850nm"
    ]
  }
];
