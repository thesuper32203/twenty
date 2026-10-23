import { type AddressMetadata } from 'twenty-shared/types';

const normalizePart = (value: string | undefined): string =>
  (value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();

export const normalizePropertyAddressKey = (
  address: Partial<AddressMetadata> | null | undefined,
): string | null => {
  const street = normalizePart(address?.addressStreet1);

  if (street.length === 0) {
    return null;
  }

  return [
    street,
    normalizePart(address?.addressCity),
    normalizePart(address?.addressState),
    normalizePart(address?.addressPostcode),
  ].join('|');
};
