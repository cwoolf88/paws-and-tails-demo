export type ContactUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
  };
};

export type ContactFormValues = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
};

export type ContactPrimaryResult = {
  patches: unknown[];
  results: { status: string; message?: string; error?: string; httpStatus?: number }[];
  attemptedPrimary: boolean;
  savedLocally?: boolean;
  syncedToNextAddress?: boolean;
  nextAddressHttp4xx?: boolean;
  failureMessages?: string[];
};

export type ContactIntegrationTab = "basic" | "custom";
