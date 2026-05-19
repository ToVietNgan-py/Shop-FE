// e2e/checkout.spec.js
import { test, expect } from '@playwright/test'

test('user mua hàng thành công', async ({ page }) => {
    // 1. Đăng nhập
    await page.goto('/login')
    await page.fill('input[name=email]', 'test@gmail.com')
    await page.fill('input[name=password]', '123456')
    await page.click('button[type=submit]')
    await expect(page).toHaveURL('/')

    // 2. Vào trang sản phẩm, thêm vào giỏ
    await page.goto('/products/1')
    await page.click('button:has-text("Thêm vào giỏ")')

    // 3. Checkout
    await page.goto('/checkout')
    await page.fill('input[name=fullname]', 'Việt Ngân')
    await page.fill('input[name=phone]', '0901234567')
    await page.fill('input[name=address]', '123 Test Street')
    await page.click('button:has-text("Đặt hàng")')

    // 4. Xác nhận thành công
    await expect(page).toHaveURL(/payment-result|order-success/)
    await expect(page.locator('h1')).toContainText('Đặt hàng thành công')
})