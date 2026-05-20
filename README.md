TASK:
Build a pricing logic for a subscription system with:
Request Payload:
{
  "userPlan”: "premium",
  "basePrice": 100,
  "addons": [
    { "name": "extra_storage", "price": 20 },
    { "name": "priority_support", "price": 10 }
  ],
  "coupon": “CD10"
}

Rules:
1. Premium users get 5% discount on base price only.
2. Coupon CD10 gives:
    - 10% off total (after premium discount)
    - BUT max discount is 15.
3. If total exceeds 120 after discounts:
    - Add 8% tax.
4. Final price must never be negative.
5. Round to 2 decimal places.

Implement using function name below:
calculateFinalPrice(payload)

Sample response payload expected
{
  "finalPrice": 123.45,
  "items”: { ... }
}
