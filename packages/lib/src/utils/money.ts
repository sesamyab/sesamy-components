export const parsePrice = (priceString: string) => {
  const parsedPrice = parseFloat(priceString);
  return isNaN(parsedPrice) ? 0 : parsedPrice;
};
