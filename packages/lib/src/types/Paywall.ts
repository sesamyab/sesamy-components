export enum PaywallStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  DELETED = 'DELETED'
}

export enum PaywallTemplate {
  ARTICLE = 'ARTICLE',
  BOXES = 'BOXES',
  EMAIL = 'EMAIL'
}

export type PaywallSubscription = {
  id: string;
  sku: string;
  poId: string;
  title?: string;
  description?: string;
  tag?: string;
  selected: boolean;
  discountCode?: string;
  // Period rendered next to the headline price (the discounted one when discountPrice is set)
  periodText?: string;
  // Period rendered next to the struck-through regular price, for intro offers where the
  // discount covers a different period than the recurring price. Defaults to periodText.
  comparePeriodText?: string;
  price?: number;
  discountPrice?: number;
  features?: string[];
  url?: string;
  buttonText?: string;
  preferBusiness?: boolean;
  readMoreLink?: string;
  readMoreText?: string;
  // Where the visitor lands after buying this option. Overrides the
  // paywall-wide `settings.redirectUrl`; see `resolveRedirectUrl`.
  redirectUrl?: string;
  // Label for the button back to the publisher on the checkout confirmation
  // page and in the order email. Overrides the paywall-wide
  // `settings.redirectLabel`; see `resolveRedirectLabel`.
  redirectLabel?: string;
};

export type PaywallSinglePurchase = {
  enabled: boolean;
  title?: string;
  description?: string;
  discountCode?: string;
};
export type PaywallSettings = {
  useDefaultLogo: boolean;
  useDefaultCurrency: boolean;
  useDefaultColor: boolean;
  template: PaywallTemplate;
  // Paywall-wide default for where the visitor lands after a purchase, used for
  // every option that does not carry its own `redirectUrl`.
  redirectUrl?: string;
  // Paywall-wide default for the label of the button back to the publisher,
  // used for every option that does not carry its own `redirectLabel`.
  redirectLabel?: string;
  styling: {
    showBackground: boolean;
    backgroundColor?: string;
    dropShadow: boolean;
  };
  loginFields: {
    name?: boolean;
    phone?: boolean;
  };
  displayOptions?: {
    enableGift?: boolean;
    enableCompany?: boolean;
    enableLoginButton?: boolean;
  };
};

export type Paywall = {
  id: string; // id: uniqueId of the paywall. THIS WAS CHANGED TO REQUIRED
  vendorId: string; // id: uniqueId of the paywall
  name: string; // Paywall name (used internally for the admin list)
  currency: string; // Currency code (USD, EUR, SEK)
  subscriptionsUrl?: string;
  status: PaywallStatus; // status (ACTIVE, CANCELED, DELETED)
  headline?: string; // free text
  logoUrl?: string;
  features: string[]; // a list of free strings
  mainColor: string; // Color picker. THIS WAS CHANGED TO REQUIRED
  showLoginButton: boolean;
  singlePurchase?: PaywallSinglePurchase;
  subscriptions: PaywallSubscription[];
  version?: number;
  settings: PaywallSettings;
  footerPaymentMethods?: (
    | 'visa'
    | 'apple-pay'
    | 'google-pay'
    | 'klarna'
    | 'amex'
    | 'mastercard'
    | 'vipps'
    | 'swish'
  )[];
};
