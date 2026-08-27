# Smartphone Store

This context describes the products customers can browse, configure, and keep in a shopping cart.

## Language

**Product**:
A smartphone model offered in the catalog, independently of its selectable color and storage.
_Avoid_: Phone, device, catalog item

**Product variant**:
An exact combination of a Product, color, and storage; storage determines its unit price and color determines its product image.
_Avoid_: Option, configuration, SKU

**Cart line**:
A Product variant in the Cart together with its quantity; adding the exact same Product variant increases this quantity instead of creating another line.
_Avoid_: Cart item, product entry

**Cart**:
The persisted collection of Cart lines that the customer intends to purchase.
_Avoid_: Bag, basket
