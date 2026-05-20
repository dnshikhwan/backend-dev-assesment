//Rules
// 1. Premium users get 5% discount on base price only.
// 2. Coupon CD10 gives: 10% off total (after premium discount), max discount is 15
// 3. if total exceeds 120 after discounts, add 8% tax
// 4. final price must be never negative
// 5. round to 2 decimal places
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// store plan discounts and percentage
var PLAN_DISCOUNTS = {
    premium: 0.05,
    basic: 0,
};
// store coupons list
var COUPONS = {
    CD10: { rate: 0.1, maxDiscount: 15 },
};
// apply tax if exceeds 120
var TAX_THRESHOLD = 120;
var TAX_RATE = 0.08;
var toRinggit = function (cents) { return cents / 100; };
var formatRinggit = function (cents) { return (cents / 100).toFixed(2); };
function calculateFinalPrice(payload) {
    var userPlan = payload.userPlan, basePrice = payload.basePrice, addons = payload.addons, coupon = payload.coupon;
    var basePriceCents = Math.round(basePrice * 100); //store price in cents
    var addonsCents = addons.map(function (addon) { return (__assign(__assign({}, addon), { priceCents: Math.round(addon.price * 100) })); });
    // plan discount for base price only
    var planDiscountRate = PLAN_DISCOUNTS[userPlan]; // get user plan discount
    var planDiscountCents = Math.round(basePriceCents * planDiscountRate);
    var discountedBaseCents = basePriceCents - planDiscountCents; // get discount base after discount
    var addonsTotalCents = addonsCents.reduce(
    // store addon's price in cent
    function (sum, addon) { return sum + addon.priceCents; }, 0);
    var subtotalCents = discountedBaseCents + addonsTotalCents;
    var couponDiscountCents = 0;
    var couponWasCapped = false;
    // check for couponCode
    if (coupon && COUPONS[coupon]) {
        var _a = COUPONS[coupon], rate = _a.rate, maxDiscount = _a.maxDiscount;
        var rawDiscountCents = Math.round(subtotalCents * rate);
        var maxDiscountCents = Math.round(maxDiscount * 100);
        couponDiscountCents = Math.min(rawDiscountCents, maxDiscountCents);
        couponWasCapped = rawDiscountCents > maxDiscountCents;
    }
    var afterCouponCents = subtotalCents - couponDiscountCents; // get price after coupun discount
    var taxThresholdCents = Math.round(TAX_THRESHOLD * 100);
    var taxApplied = afterCouponCents > taxThresholdCents;
    var taxAmountCents = taxApplied
        ? Math.round(afterCouponCents * TAX_RATE)
        : 0;
    var finalPriceCents = Math.max(0, afterCouponCents + taxAmountCents);
    return {
        finalPrice: formatRinggit(finalPriceCents),
        items: {
            basePrice: basePrice,
            planDiscount: {
                rate: planDiscountRate,
                amount: -toRinggit(planDiscountCents),
            },
            discountedBase: toRinggit(discountedBaseCents),
            addons: addons.map(function (_a) {
                var name = _a.name, price = _a.price;
                return ({
                    name: name,
                    price: price,
                });
            }),
            addonsTotal: toRinggit(addonsTotalCents),
            subtotal: toRinggit(subtotalCents),
            coupon: coupon !== null && coupon !== void 0 ? coupon : null,
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
var payload = {
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
