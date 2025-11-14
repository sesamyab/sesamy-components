export enum PaywallStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  DELETED = 'DELETED'
}

export enum PaywallTemplate {
  ARTICLE = 'ARTICLE',
  BOXES = 'BOXES'
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
  periodText?: string;
  price?: number;
  discountPrice?: number;
  features?: string[];
  url?: string;
  buttonText?: string;
  preferBusiness?: boolean;
  readMoreLink?: string;
  readMoreText?: string;
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
