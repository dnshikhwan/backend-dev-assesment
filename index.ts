//Rules
// 1. Premium users get 5% discount on base price only.
// 2. Coupon CD10 gives: 10% off total (after premium discount), max discount is 15
// 3. if total exceeds 120 after discounts, add 8% tax
// 4. final price must be never negative
// 5. round to 2 decimal places

type UserPlan = "premium" | "basic";
type CouponCode = "CD10";

interface AddOns {
    name: string;
    price: number;
}

interface CouponDetail {
    amount: number;
    capped: boolean;
}

interface PlanDiscountDetail {
    rate: number;
    amount: number;
}

interface TaxDetail {
    rate: number;
    applied: boolean;
    amount: number;
}

interface PriceBreakdown {
    basePrice: number;
    planDiscount: PlanDiscountDetail;
    discountedBase: number;
    addons: AddOns[];
    addonsTotal: number;
    subtotal: number;
    coupon: CouponCode | null;
    couponDiscount: CouponDetail;
    afterCoupon: number;
    tax: TaxDetail;
}

interface Payload {
    userPlan: UserPlan;
    basePrice: number;
    addons: AddOns[];
    coupon: CouponCode | null;
}

interface PriceResult {
    finalPrice: string;
    items: PriceBreakdown;
}

// store plan discounts and percentage
const PLAN_DISCOUNTS: Record<UserPlan, number> = {
    premium: 0.05,
    basic: 0,
};

// store coupons list
const COUPONS: Record<CouponCode, { rate: number; maxDiscount: number }> = {
    CD10: { rate: 0.1, maxDiscount: 15 },
};

// apply tax if exceeds 120
const TAX_THRESHOLD = 120;
const TAX_RATE = 0.08;

// convert cents back to ringgit
const toRinggit = (cents: number): number => cents / 100;
const formatRinggit = (cents: number): string => (cents / 100).toFixed(2);

function calculateFinalPrice(payload: Payload): PriceResult {
    const { userPlan, basePrice, addons, coupon } = payload;

    // convert ringgit to cents to prevent floating-point math errors
    const basePriceCents = Math.round(basePrice * 100); //store price in cents
    const addonsCents = addons.map((addon) => ({
        ...addon,
        priceCents: Math.round(addon.price * 100),
    }));

    // plan discount for base price only
    const planDiscountRate = PLAN_DISCOUNTS[userPlan]; // get user plan discount
    const planDiscountCents = Math.round(basePriceCents * planDiscountRate);
    const discountedBaseCents = basePriceCents - planDiscountCents; // get discount base after discount

    const addonsTotalCents = addonsCents.reduce(
        (sum, addon) => sum + addon.priceCents,
        0,
    );

    // calculate dicounted base + total addons
    const subtotalCents = discountedBaseCents + addonsTotalCents;

    let couponDiscountCents = 0;
    let couponWasCapped = false;

    // check for couponCode
    if (coupon && COUPONS[coupon]) {
        const { rate, maxDiscount } = COUPONS[coupon];
        const rawDiscountCents = Math.round(subtotalCents * rate);
        const maxDiscountCents = Math.round(maxDiscount * 100);
        couponDiscountCents = Math.min(rawDiscountCents, maxDiscountCents);
        couponWasCapped = rawDiscountCents > maxDiscountCents;
    }

    const afterCouponCents = subtotalCents - couponDiscountCents; // get price after coupun discount

    const taxThresholdCents = Math.round(TAX_THRESHOLD * 100);
    const taxApplied = afterCouponCents > taxThresholdCents;
    const taxAmountCents = taxApplied
        ? Math.round(afterCouponCents * TAX_RATE)
        : 0;

    const finalPriceCents = Math.max(0, afterCouponCents + taxAmountCents);

    return {
        finalPrice: formatRinggit(finalPriceCents),
        items: {
            basePrice,
            planDiscount: {
                rate: planDiscountRate,
                amount: -toRinggit(planDiscountCents),
            },
            discountedBase: toRinggit(discountedBaseCents),
            addons: addons.map(({ name, price }) => ({
                name,
                price,
            })),
            addonsTotal: toRinggit(addonsTotalCents),
            subtotal: toRinggit(subtotalCents),
            coupon: coupon ?? null,
            couponDiscount: {
                amount: -toRinggit(couponDiscountCents),
                capped: couponWasCapped,
            },
            afterCoupon: toRinggit(afterCouponCents),
            tax: {
                rate: TAX_RATE,
                applied: taxApplied,
                amount: toRinggit(taxAmountCents),
            },
        },
    };
}

// test
const payload: Payload = {
    userPlan: "premium",
    basePrice: 100,
    addons: [
        {
            name: "extra_storage",
            price: 20,
        },
        {
            name: "priority_support",
            price: 10,
        },
    ],
    coupon: "CD10",
};

console.log(JSON.stringify(calculateFinalPrice(payload)));
