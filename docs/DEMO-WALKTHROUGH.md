# Five-minute demo walkthrough

1. Open the app. It starts with Alex Morgan's sample profile, two saved shoes, two example orders, a sample address, and $325 demo wallet credit.
2. Use **All sneakers**. Search `Velocity`, change the maximum price, or choose a brand/category. Clear filters to restore the catalog. On mobile, tap **Filters** to expand them.
3. Open a product. Check the size guide, choose US 9, and **Add to bag**. The quick-add (+) button on product cards also asks for a size.
4. Open **Bag**. Change quantity, apply `WELCOME10`, and continue to checkout. Promo rules are visible in Help.
5. Choose a saved address, or add a new sample address. Select standard, express, or next-business-day delivery.
6. Choose **Demo wallet** or **Demo card**. Review the items and click **Place demo order**. No real payment happens.
7. Refresh the page. The order remains. Open the receipt and use **Simulate next tracking step** until delivered.
8. Leave a review. The same order cannot be reviewed twice. The review also appears under Reviews on the relevant product pages.
9. In **Account → Wallet**, inspect the debit and add $50 demo credit. A cancelled unshipped wallet order refunds its credit.
10. Open the notification inbox, mark all read, edit the profile, and manage addresses. **Account → Reset demo** restores the original sample data after confirmation.

Demo data stays in localStorage under `solehaven.demo.v1`. It is scoped to this browser, device, and origin; it is not synchronized across devices. Multiple tabs receive storage updates, but simultaneous editing in separate tabs is last-write-wins. API mode is the separate server-backed experience.

Browser storage failures show a warning and allow an in-memory session. Basic invalid/corrupt stored data is replaced with a new demo; the error recovery screen also provides a local reset. Do not enter real payment data. The demo profile is not an authentication mechanism.
