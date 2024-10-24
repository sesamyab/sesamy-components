export enum PaymentProviders {
  KLARNA = 'KLARNA',
  STRIPE = 'STRIPE',
  DUMMY = 'DUMMY',
  BILLOGRAM = 'BILLOGRAM',
  ADYEN = 'ADYEN',
  VIPPS = 'VIPPS'
}

type KlarnaPaymentSettings = {
  session: object; // TODO: should this use the KlarnaSession type from payments?
};

type StripePaymentSettings = {
  paymentIntentId?: string;
  clientSecret?: string;
  trial?: boolean;
  free?: boolean;
  setupIntent?: object;
};

export enum PaymentMethods {
  FREE = 'FREE',
  TEST = 'TEST',
  CARD = 'CARD',
  SWISH = 'SWISH',
  INVOICE = 'INVOICE',
  KLARNA_PRIVATE = 'KLARNA_PRIVATE',
  KLARNA_BUSINESS = 'KLARNA_BUSINESS',
  VIPPS = 'VIPPS'
}

export type PaymentProviderInfo = {
  provider: PaymentProviders;
  methods: PaymentMethods[];
};

export type PaymentOptions = {
  paymentProvider?: PaymentProviders;
  paymentMethod?: PaymentMethods;
  availablePaymentMethods?: Array<PaymentProviderInfo>;
  paymentSettings?: StripePaymentSettings | KlarnaPaymentSettings;
};

type Settings = {
  requireAddress: boolean;
  vendorId?: string;
  forceCountry?: string;
  forceCurrency?: string;
  redirectUrl?: string;
  fieldSettings?: {
    [key: string]: {
      enabled: boolean;
      required: boolean;
    };
  };
};

enum AppliedDiscountStatus {
  APPLIED = 'APPLIED',
  UNAPPLICABLE = 'UNAPPLICABLE'
}

type AppliedDiscountSummary = {
  code: string;
  id?: string;
  status: AppliedDiscountStatus;
  name?: string;
  description?: string;
  // ISO DATE, if not set, it's contract start.
  from?: string;
  // ISO DATE, if not set, it's instantaneous.
  until?: string;
};

enum ContentDataType {
  sample = 'sample',
  image = 'image',
  source = 'source',
  articleUrl = 'articleUrl'
}

enum EntitlementOrigin {
  // Legacy checkout
  CHECKOUT = 'CHECKOUT',
  // Payment system
  PAYMENTS = 'PAYMENTS',
  // External sources
  EXTERNAL = 'EXTERNAL',
  // Shopify purcahses
  SHOPIFY = 'SHOPIFY',
  // Entitlement created manually
  MANUAL = 'MANUAL',
  // Entitlement created by a campaign
  CAMPAIGN = 'CAMPAIGN',
  // Entitlement uploaded by the user
  UPLOAD = 'UPLOAD',
  // Entitlement created as part fo a bundle
  BUNDLE = 'BUNDLE',
  // Entitlement created as part of a multiuserlicence
  LICENSE = 'LICENSE'
}

enum EntitlementType {
  READ_RIGHTS = 'READ_RIGHTS',
  SUBSCRIPTION = 'SUBSCRIPTION'
}

enum EntitlementStatus {
  // Entitlement is valid but not used yet
  VALID = 'VALID',
  // Entitlement is valid and has been used
  ACTIVE = 'ACTIVE',
  // Entitlement was canceled by Sesamy or a provider
  CANCELED = 'CANCELED',
  // Entitlement has expired and needs to be renewed
  EXPIRED = 'EXPIRED',
  // Entitlement was soft-deleted
  DELETED = 'DELETED',
  // Entitlement was moved to another user
  MOVED = 'MOVED'
}

type EntitlementFormat = 'RSS' | 'MP3' | 'EPUB' | 'PDF' | 'MOBI' | 'URL';

enum RecurringPeriodLength {
  DAILY = 'day',
  WEEKLY = 'week',
  MONTHLY = 'month',
  YEARLY = 'year'
}

type RecurringPeriod = {
  period: RecurringPeriodLength;
  time: number;
  trialTime?: number;
};

enum PurchaseType {
  LOAN = 'LOAN',
  OWN = 'OWN',
  FREE = 'FREE',
  RECURRING = 'RECURRING',
  LEASE = 'LEASE'
}

enum ProductType {
  ARTICLE = 'article',
  AUDIOBOOK = 'audiobook',
  EBOOK = 'ebook',
  BUNDLE = 'bundle',
  PODCAST = 'podcast',
  PASS = 'pass'
}

type ProductInfo = {
  title: string;
  language?: string;
  excerpt?: string;
  authors?: string[];
  description?: string;
  cover?: string;
  keywords: string[];
  categories?: string[];
  collections?: string[];
  vendorId: string;
  vendorName: string;
  brandId?: string;
  brandName?: string;
  businessTags?: string[];
};

type VaultContentData = {
  title: string;
  id: string;
  filename: string;
  type: ContentDataType | string;
  url: string;
  contentLength?: number;
  duration?: number;
  mimeType?: string;
  offsetToFirstFrame?: number;
  lastModified?: string;
  publicKeyUrl?: string;
};

type Entitlement = ProductInfo & {
  content: VaultContentData[];
  userId: string;
  entitlementId: string;
  productType: ProductType;
  sku: string;
  productId: string;
  purchaseOptionId: string;
  purchaseOptionData?: {
    title: string;
    description?: string;
    purchaseType: PurchaseType;
    recurringSchedule?: RecurringPeriod;
  };
  supplierId: string;
  availableFormats: EntitlementFormat[];
  entitlementType: EntitlementType;
  status: EntitlementStatus;
  createdAt: string;
  modifiedAt: string;
  activatedAt?: string;
  canceledAt?: string;
  deletedAt?: string;
  expiresAt?: string;
  origin: EntitlementOrigin;
  originId: string;
  additionalProperties: { [key: string]: string };
};

type TaxSummary = {
  base: number;
  taxId: string;
  taxPct: number;
  taxName: string;
  taxAbbr: string;
  amount: number;
};

type OriginalPriceInfo = {
  netPrice: number;
  taxes: TaxSummary[];
  totalTaxes: number;
  total: number;
};

type ItemDiscount = {
  discount: number;
  discountAsPct: number;
  nominalDiscountAsPct?: number;
  nominalDiscount?: number;
  nominalDiscountCurrency?: string;
  originalPrice?: OriginalPriceInfo;
  isCurbed?: boolean;
  onTrialUntil?: string;
};

type Price = ItemDiscount & {
  netPrice: number;
  calculatedTaxRate: number;
  totalTaxes: number;
  taxes: TaxSummary[];
  total: number;
  currency: string;
};

type ScheduledPrice = Price & {
  from: string;
  to?: string;
  recurringSchedule: {
    trialTime?: number;
    period: RecurringPeriodLength;
    time: number;
  };
};

type BusinessDetails = {
  companyName?: string;
  vatNr?: string;
};

type UserAddress = {
  firstName: string;
  lastName: string;
  co?: string;
  street: string;
  city: string;
  zip: string;
  country: string;
};

enum CartStatus {
  PENDING = 'PENDING',
  // This status indicates that they are waiting for the third-party service to complete the payment
  WAITING_PAYMENT_CONFIRMATION = 'WAITING_PAYMENT_CONFIRMATION',
  COMPLETED = 'COMPLETED'
}

type UserData = {
  id: string;
  email: string;
  hasPrimaryAddress?: boolean;
};

type UserDetails = {
  fullName?: string;
  businessDetails?: BusinessDetails;
  isBusiness: boolean;
  address?: UserAddress;
  newsletters?: {
    [key: string]: boolean;
  };
  mobilePhone?: string;
};

enum CartType {
  SINGLE = 'SINGLE',
  RECURRING = 'RECURRING'
}

type CheckoutPrice = {
  initialPrice: Price;
  recurringPrice: Array<ScheduledPrice>;
};

type DisplayItem = {
  id: string;
  sku: string;
  price: CheckoutPrice;
  productType: string;
  purchaseOptionId: string;
  description?: string;
  title: string;
  cover?: string;
  vendorId: string;
  vendorName: string;
  consumeUrl?: string;
};

type CheckoutKeys = {
  id: string;
};

export type DisplayCheckout = CheckoutKeys & {
  status: CartStatus;
  user: UserData | null;
  userDetails: UserDetails | null;
  country: string;
  type: CartType;
  currency: string;
  price: CheckoutPrice;
  items: Array<DisplayItem>;
  itemsOwned: Array<DisplayItem>;
  entitlements: Array<Entitlement>;
  appliedDiscounts?: AppliedDiscountSummary[];
  requestedDiscountCodes: string[];
  settings: Settings;
  receiptUrl?: string | null;
  created?: string;
  modified?: string;
  paymentOptions: PaymentOptions;
  query?: {
    'client-id'?: string;
    [key: string]: string | undefined;
  };
};
