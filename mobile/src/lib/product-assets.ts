import adjustableLaptopStand from '../../assets/products/adjustable-vertical-laptop-stand.png';
import batteryRack from '../../assets/products/battery-storage-rack.png';
import coordinatesKeepsake from '../../assets/products/coordinates-date-keepsake.png';
import customQrSign from '../../assets/products/custom-qr-display-sign.png';
import deskDock from '../../assets/products/modular-phone-accessory-desk-dock.png';
import entrywayStation from '../../assets/products/entryway-key-wallet-station.png';
import fourPhotoCube from '../../assets/products/four-photo-lithophane-cube-lamp.png';
import headphoneStand from '../../assets/products/headphone-stand.png';
import hobbyRack from '../../assets/products/hobby-paint-bottle-rack.png';
import lithophane from '../../assets/products/custom-photo-lithophane-night-light.png';
import mailOrganizer from '../../assets/products/mail-key-wall-organizer.png';
import makeupOrganizer from '../../assets/products/makeup-skincare-organizer.png';
import drawerBins from '../../assets/products/modular-drawer-bin-set.png';
import nameSign from '../../assets/products/personalized-name-desk-sign.png';
import notesOrganizer from '../../assets/products/pen-notes-phone-organizer.png';
import pegboard from '../../assets/products/modular-pegboard-starter-kit.png';
import petMemorial from '../../assets/products/pet-memorial-silhouette-stand.png';
import personalizedBagTag from '../../assets/products/personalized-name-bag-tag.png';
import personalizedOrnament from '../../assets/products/personalized-ornament.png';
import planter from '../../assets/products/self-watering-planter.png';
import cableKit from '../../assets/products/six-piece-cable-management-kit.png';
import labelClips from '../../assets/products/storage-label-clips.png';
import tabletStand from '../../assets/products/tablet-ereader-stand.png';
import underDeskHook from '../../assets/products/under-desk-headphone-hook.png';
import underShelfHooks from '../../assets/products/under-shelf-hook-set.png';
import controllerStand from '../../assets/products/universal-controller-stand.png';
import remoteHolder from '../../assets/products/wall-mounted-remote-holder.png';
import webcamRiser from '../../assets/products/webcam-small-light-riser.png';

const productImages: Partial<Record<string, number>> = {
  'PG-01': lithophane,
  'PG-02': fourPhotoCube,
  'PG-04': personalizedBagTag,
  'PG-06': coordinatesKeepsake,
  'PG-07': customQrSign,
  'PG-08': personalizedOrnament,
  'DT-01': deskDock,
  'DT-02': headphoneStand,
  'DT-03': controllerStand,
  'DT-04': cableKit,
  'DT-05': adjustableLaptopStand,
  'DT-06': notesOrganizer,
  'DT-08': underDeskHook,
  'DT-09': tabletStand,
  'DT-10': webcamRiser,
  'PD-01': planter,
  'PG-03': nameSign,
  'HO-01': entrywayStation,
  'HO-02': drawerBins,
  'HO-03': remoteHolder,
  'HO-04': batteryRack,
  'HO-05': makeupOrganizer,
  'HO-06': labelClips,
  'HO-07': underShelfHooks,
  'HO-08': mailOrganizer,
  'DT-07': pegboard,
  'PG-05': petMemorial,
  'GH-04': hobbyRack,
};

export function getProductImage(productId: string) {
  return productImages[productId];
}
