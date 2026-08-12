import deskDock from '../../assets/products/modular-phone-accessory-desk-dock.png';
import entrywayStation from '../../assets/products/entryway-key-wallet-station.png';
import fourPhotoCube from '../../assets/products/four-photo-lithophane-cube-lamp.png';
import hobbyRack from '../../assets/products/hobby-paint-bottle-rack.png';
import lithophane from '../../assets/products/custom-photo-lithophane-night-light.png';
import nameSign from '../../assets/products/personalized-name-desk-sign.png';
import pegboard from '../../assets/products/modular-pegboard-starter-kit.png';
import petMemorial from '../../assets/products/pet-memorial-silhouette-stand.png';
import planter from '../../assets/products/self-watering-planter.png';

const productImages: Partial<Record<string, number>> = {
  'PG-01': lithophane,
  'PG-02': fourPhotoCube,
  'DT-01': deskDock,
  'PD-01': planter,
  'PG-03': nameSign,
  'HO-01': entrywayStation,
  'DT-07': pegboard,
  'PG-05': petMemorial,
  'GH-04': hobbyRack,
};

export function getProductImage(productId: string) {
  return productImages[productId];
}
