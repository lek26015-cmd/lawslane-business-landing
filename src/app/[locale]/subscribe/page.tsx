import { redirect } from 'next/navigation';

// หน้านี้เดิมสร้างบัญชีแล้วตั้ง role: 'admin' ให้ตัวเองจากฝั่ง browser และ "จำลองการจ่ายเงิน"
// ด้วย setTimeout 2 วินาที (ไม่มีการตัดเงินจริง) — ปิดไว้ก่อนจนกว่าจะมีระบบชำระเงินจริง
// ส่งผู้สนใจไปหน้าติดต่อพร้อมชื่อแพลนแทน
export default async function SubscribePage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ plan?: string }>;
}) {
    const { locale } = await params;
    const { plan } = await searchParams;
    redirect(`/${locale}/contact${plan ? `?plan=${encodeURIComponent(plan)}` : ''}`);
}
