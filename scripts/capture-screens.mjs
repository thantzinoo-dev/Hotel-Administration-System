import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.resolve(__dirname, "../docs/screenshots");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Find browser executable
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

let executablePath = chromePath;
if (!fs.existsSync(chromePath) && fs.existsSync(edgePath)) {
  executablePath = edgePath;
}

console.log(`Using browser at: ${executablePath}`);

async function clickTab(page, tabText) {
  await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const tab = buttons.find((b) => b.textContent.trim() === text);
    if (tab) {
      tab.click();
    }
  }, tabText);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2
    },
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });

  const page = await browser.newPage();

  async function snap(filename, delayMs = 500) {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    const target = path.join(outputDir, filename);
    await page.screenshot({ path: target, fullPage: false });
    console.log(`Saved screenshot: ${filename}`);
  }

  try {
    // 1. Landing Page
    console.log("Capturing 01-landing-page.png...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForSelector("h1");
    // wait for rooms grid to render
    await page.waitForSelector("button", { timeout: 10000 });
    await snap("01-landing-page.png", 1000);

    // 2. Booking Modal
    console.log("Capturing 02-booking-modal.png...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const bookBtn = buttons.find((b) => b.textContent.includes("Book Now"));
      if (bookBtn) bookBtn.click();
    });
    await page.waitForSelector("form", { timeout: 5000 }).catch(() => {});
    await snap("02-booking-modal.png", 800);

    // 3. Login Page
    console.log("Capturing 03-login-page.png...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    await page.waitForSelector("input#email");
    await snap("03-login-page.png", 600);

    // 4. Admin Login & Dashboard - Rooms
    console.log("Logging in as Admin...");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    await page.waitForSelector("h1");
    // Wait for the room table to load
    await page.waitForSelector("table", { timeout: 10000 });
    // Wait for KPI cards
    await page.waitForFunction(() => !document.querySelector(".animate-pulse"), { timeout: 10000 }).catch(() => {});
    console.log("Capturing 04-admin-dashboard-rooms.png...");
    await snap("04-admin-dashboard-rooms.png", 1000);

    // 5. Admin Add Room Modal
    console.log("Capturing 05-admin-add-room-modal.png...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const addBtn = buttons.find((b) => b.textContent.includes("Add Room"));
      if (addBtn) addBtn.click();
    });
    await page.waitForSelector("form", { timeout: 5000 }).catch(() => {});
    await snap("05-admin-add-room-modal.png", 800);

    // Close modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const cancelBtn = buttons.find((b) => b.textContent.includes("Cancel") || b.getAttribute("aria-label") === "Close");
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // 6. Admin Guests Tab
    console.log("Capturing 06-admin-dashboard-guests.png...");
    await clickTab(page, "Guests");
    await page.waitForSelector("table", { timeout: 10000 });
    await snap("06-admin-dashboard-guests.png", 800);

    // 7. Admin Bookings Tab
    console.log("Capturing 07-admin-dashboard-bookings.png...");
    await clickTab(page, "Bookings");
    await page.waitForSelector("table", { timeout: 10000 });
    await snap("07-admin-dashboard-bookings.png", 800);

    // 8. Admin Reports Tab
    console.log("Capturing 08-admin-dashboard-reports.png...");
    await clickTab(page, "Reports");
    await page.waitForSelector(".recharts-responsive-container, .recharts-surface", { timeout: 10000 }).catch(() => {});
    await snap("08-admin-dashboard-reports.png", 1500);

    // 9. Staff / Receptionist Login & Dashboard
    console.log("Logging in as Receptionist...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const recBtn = buttons.find((b) => b.textContent.includes("Receptionist"));
      if (recBtn) recBtn.click();
    });
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    await page.waitForSelector("h1");
    await page.waitForFunction(() => !document.querySelector(".animate-pulse"), { timeout: 10000 }).catch(() => {});

    console.log("Capturing 09-staff-dashboard-today.png...");
    await snap("09-staff-dashboard-today.png", 1000);

    // 10. Staff Active Tab
    console.log("Capturing 10-staff-dashboard-active.png...");
    await clickTab(page, "Active");
    await page.waitForSelector("table", { timeout: 10000 });
    await snap("10-staff-dashboard-active.png", 800);

    // 11. Staff All Bookings Tab
    console.log("Capturing 11-staff-dashboard-all.png...");
    await clickTab(page, "All Bookings");
    await page.waitForSelector("table", { timeout: 10000 });
    await snap("11-staff-dashboard-all.png", 800);

    // 12. Staff Payment Modal
    console.log("Capturing 12-staff-payment-modal.png...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const payBtn = buttons.find((b) => b.textContent.trim() === "Pay" || b.textContent.includes("Pay"));
      if (payBtn) payBtn.click();
    });
    await page.waitForSelector("input#amount, form", { timeout: 5000 }).catch(() => {});
    await snap("12-staff-payment-modal.png", 800);

    console.log("All screenshots successfully captured!");
  } catch (error) {
    console.error("Screenshot error:", error);
  } finally {
    await browser.close();
  }
}

main();
