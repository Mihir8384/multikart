/**
 * Calculate promotional price based on active discounts
 * @param {Object} product - The product object
 * @param {Array} discounts - Array of discount rules
 * @returns {Number} - Calculated promotional price or 0 if no discount applies
 */
export function calculatePromotionalPrice(product, discounts) {
  if (!product || !discounts || discounts.length === 0) {
    return 0;
  }

  const now = new Date();
  let bestDiscount = null;
  let maxDiscountAmount = 0;

  // Find the best applicable discount
  for (const discount of discounts) {
    // Check if discount is active and within date range
    if (!discount.status) continue;
    
    const startDate = new Date(discount.start_date);
    const endDate = new Date(discount.end_date);
    
    if (now < startDate || now > endDate) continue;

    // Check if discount applies to this product
    let applies = false;
    
    if (discount.application_type === "All") {
      applies = true;
    } else if (discount.application_type === "Product") {
      const productId = product._id?.toString() || product.id?.toString();
      const applyOnId = discount.apply_on?.toString();
      applies = productId === applyOnId;
    } else if (discount.application_type === "Category") {
      const categoryId = product.category_id?._id?.toString() || product.category_id?.toString();
      const applyOnId = discount.apply_on?.toString();
      applies = categoryId === applyOnId;
    }

    if (!applies) continue;

    // Calculate discount amount
    const basePrice = Number(product.base_price) || Number(product.price) || 0;
    let discountAmount = 0;

    if (discount.discount_type === "Percentage") {
      discountAmount = (basePrice * discount.value) / 100;
    } else if (discount.discount_type === "Amount") {
      discountAmount = discount.value;
    }

    // Keep track of the best discount
    if (discountAmount > maxDiscountAmount) {
      maxDiscountAmount = discountAmount;
      bestDiscount = discount;
    }
  }

  // Calculate final promotional price
  if (bestDiscount && maxDiscountAmount > 0) {
    const basePrice = Number(product.base_price) || Number(product.price) || 0;
    const promoPrice = basePrice - maxDiscountAmount;
    
    // Ensure promotional price doesn't go below floor price
    const floorPrice = Number(product.floor_price) || 0;
    return Math.max(promoPrice, floorPrice);
  }

  return 0;
}

/**
 * Apply discounts to a product and return updated product with promo_price
 * @param {Object} product - The product object
 * @param {Array} discounts - Array of discount rules
 * @returns {Object} - Product with calculated promo_price
 */
export function applyDiscountsToProduct(product, discounts) {
  const promoPrice = calculatePromotionalPrice(product, discounts);
  
  return {
    ...product,
    promo_price: promoPrice > 0 ? promoPrice : null,
    has_discount: promoPrice > 0,
  };
}

/**
 * Apply discounts to multiple products
 * @param {Array} products - Array of product objects
 * @param {Array} discounts - Array of discount rules
 * @returns {Array} - Products with calculated promo_price
 */
export function applyDiscountsToProducts(products, discounts) {
  if (!Array.isArray(products) || !Array.isArray(discounts)) {
    return products;
  }

  return products.map(product => applyDiscountsToProduct(product, discounts));
}
