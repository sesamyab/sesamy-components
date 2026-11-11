import { PaywallStatus, PaywallTemplate, type Paywall } from '../../types/Paywall';

/** Paywall settings for the offer-page story, served by the fake sesamy-js instead of api-proxy. */
export const publicOfferPaywall: Paywall = {
  id: 'pw_public_offer',
  vendorId: 'acme',
  name: 'Offer page',
  currency: 'SEK',
  status: PaywallStatus.ACTIVE,
  headline: 'Choose your subscription',
  features: ['Every article', 'Ad-free reading'],
  mainColor: '#000000',
  showLoginButton: false,
  subscriptions: [
    {
      id: 'sub_monthly',
      sku: 'sku_monthly',
      poId: 'po_monthly',
      title: 'Offer page monthly plan',
      selected: true,
      price: 99
    },
    {
      id: 'sub_yearly',
      sku: 'sku_yearly',
      poId: 'po_yearly',
      title: 'Offer page yearly plan',
      selected: false,
      price: 990
    }
  ],
  footerPaymentMethods: [],
  settings: {
    useDefaultLogo: false,
    useDefaultCurrency: true,
    useDefaultColor: true,
    template: PaywallTemplate.BOXES,
    styling: { showBackground: false, dropShadow: false },
    loginFields: {}
  }
};
