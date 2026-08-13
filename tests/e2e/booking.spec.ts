import { test, expect, type Page } from "@playwright/test";

/**
 * Complete a public booking on the wizard: service → staff → first available
 * date → first slot → customer info → submit. Returns the chosen date and slot
 * (parsed from the UI), so a test can re-enter the wizard and assert the booked
 * slot is no longer offered.
 */
async function bookThroughWizard(
  page: Page,
  tenantSlug: string,
  staffName: string,
  customerName: string,
): Promise<{ date: string; slot: string }> {
  await page.goto(`/booking/${tenantSlug}`);
  await page.getByRole("heading", { name: "Chọn dịch vụ" }).waitFor();

  await page.getByRole("button", { name: /Cắt tóc/ }).first().click();
  await page.getByRole("heading", { name: "Chọn nhân viên và thời gian" }).waitFor();

  await page.getByRole("button", { name: staffName, exact: true }).click();

  // Date chips render only after availability loads; disabled chips have no
  // free slots. Pick the first enabled one.
  const chip = page.locator('button[title]:not([disabled])').first();
  await chip.waitFor({ state: "visible" });
  const title = (await chip.getAttribute("title")) ?? "";
  const m = /\d{2}\/\d{2}\/\d{4}/.exec(title);
  if (!m) throw new Error(`Cannot parse date from chip title "${title}"`);
  const [dd, mm, yyyy] = m[0].split("/");
  const date = `${yyyy}-${mm}-${dd}`;
  await chip.click();

  const slotBtn = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
  await slotBtn.waitFor({ state: "visible" });
  const slot = (await slotBtn.innerText()).trim();
  await slotBtn.click();

  await page.getByRole("heading", { name: "Thông tin khách hàng" }).waitFor();
  await page.getByLabel("Họ và tên").fill(customerName);
  await page.getByLabel("Số điện thoại").fill("0901234567");
  await page.getByLabel("Ghi chú", { exact: false }).fill("E2E test booking");
  await page.getByRole("button", { name: "Xác nhận đặt lịch" }).click();

  await expect(page.getByRole("heading", { name: "Đặt lịch thành công!" })).toBeVisible();
  await expect(page.getByText(/#[A-Z0-9]{8}/)).toBeVisible();
  return { date, slot };
}

/** Monday (YYYY-MM-DD) of the week containing `date` — matches the app's mondayOf(). */
function mondayOf(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const target = new Date(Date.UTC(y, m - 1, d - ((dow + 6) % 7)));
  return target.toISOString().slice(0, 10);
}

test("E2E 1: public booking flow succeeds (tenant demo, AUTO confirm)", async ({ page }) => {
  const customerName = `E2E Khách ${Date.now()}`;
  await bookThroughWizard(page, "demo", "Lan", customerName);

  await expect(page.getByText(`Cảm ơn ${customerName}`, { exact: false })).toBeVisible();
  // AUTO confirm → the booking arrives CONFIRMED on the success screen.
  await expect(page.getByText("Đã xác nhận", { exact: false })).toBeVisible();
});

test("E2E 1b: booked slot is no longer offered for the same staff and date", async ({ page }) => {
  const customerName = `E2E Recheck ${Date.now()}`;
  const { date, slot } = await bookThroughWizard(page, "demo", "Hùng", customerName);

  // Re-enter the wizard, pick the same staff + date: the used slot is blocked.
  await page.goto("/booking/demo");
  await page.getByRole("button", { name: /Cắt tóc/ }).first().click();
  await page.getByRole("heading", { name: "Chọn nhân viên và thời gian" }).waitFor();
  await page.getByRole("button", { name: "Hùng", exact: true }).click();

  const dateChip = page.locator(`button[title*="${date.slice(8)}/${date.slice(5, 7)}/${date.slice(0, 4)}"]`).first();
  await dateChip.waitFor({ state: "visible" });
  if (await dateChip.isEnabled()) {
    await dateChip.click();
    await expect(page.getByRole("button", { name: slot, exact: true })).toHaveCount(0);
  }
  // If the chip is disabled, the whole day has no free slots left — the booked
  // slot is certainly gone; nothing further to assert.
});

test("E2E 2: owner approves a PENDING booking (tenant manual, MANUAL confirm)", async ({ page }) => {
  const customerName = `E2E Owner Khách ${Date.now()}`;

  // 1) Create a PENDING booking through the public UI — the manual tenant's
  //    confirmMode keeps it PENDING (no seeded booking needed → no date drift).
  const { date } = await bookThroughWizard(page, "manual", "NV Manual", customerName);
  await expect(page.getByText("Chờ xác nhận từ cơ sở")).toBeVisible();

  // 2) Login as the manual tenant's owner.
  await page.goto("/login");
  await page.getByLabel("Email").fill("manual@demo.com");
  await page.getByLabel("Mật khẩu").fill("manual123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // 3) Open /bookings on the week containing the booking we just made.
  await page.goto(`/bookings?start=${mondayOf(date)}`);

  const card = page.locator(".rounded-lg.border-l-4", { hasText: customerName }).first();
  await expect(card).toBeVisible();
  await expect(card.getByText("Chờ xác nhận")).toBeVisible();

  // 4) Approve: PENDING → CONFIRMED.
  await card.getByRole("button", { name: "Duyệt" }).click();
  await expect(card.getByText("Đã xác nhận")).toBeVisible();
  await expect(card.getByRole("button", { name: "Duyệt" })).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Hoàn tất" })).toBeVisible();
});
