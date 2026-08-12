import adjustableLaptopStand from '../../assets/products/adjustable-vertical-laptop-stand.png';
import bathroomOrganizer from '../../assets/products/bathroom-organizer.png';
import batteryRack from '../../assets/products/battery-storage-rack.png';
import coordinatesKeepsake from '../../assets/products/coordinates-date-keepsake.png';
import customQrSign from '../../assets/products/custom-qr-display-sign.png';
import decorativeVase from '../../assets/products/decorative-vase-glass-insert.png';
import doorwaySilhouette from '../../assets/products/doorway-silhouette-decoration.png';
import deskDock from '../../assets/products/modular-phone-accessory-desk-dock.png';
import entrywayStation from '../../assets/products/entryway-key-wallet-station.png';
import fourPhotoCube from '../../assets/products/four-photo-lithophane-cube-lamp.png';
import geometricPlanterTrio from '../../assets/products/geometric-planter-trio.png';
import hangingAirPlantHolder from '../../assets/products/hanging-air-plant-holder.png';
import headphoneStand from '../../assets/products/headphone-stand.png';
import hobbyRack from '../../assets/products/hobby-paint-bottle-rack.png';
import lithophane from '../../assets/products/custom-photo-lithophane-night-light.png';
import mailOrganizer from '../../assets/products/mail-key-wall-organizer.png';
import makeupOrganizer from '../../assets/products/makeup-skincare-organizer.png';
import drawerBins from '../../assets/products/modular-drawer-bin-set.png';
import plantTrellis from '../../assets/products/modular-plant-trellis-set.png';
import nameSign from '../../assets/products/personalized-name-desk-sign.png';
import notesOrganizer from '../../assets/products/pen-notes-phone-organizer.png';
import pegboard from '../../assets/products/modular-pegboard-starter-kit.png';
import petMemorial from '../../assets/products/pet-memorial-silhouette-stand.png';
import personalizedBagTag from '../../assets/products/personalized-name-bag-tag.png';
import personalizedOrnament from '../../assets/products/personalized-ornament.png';
import planter from '../../assets/products/self-watering-planter.png';
import propagationStation from '../../assets/products/propagation-station.png';
import cableKit from '../../assets/products/six-piece-cable-management-kit.png';
import smallPartsBins from '../../assets/products/stackable-small-parts-bins.png';
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
  'HO-09': bathroomOrganizer,
  'HO-10': smallPartsBins,
  'DT-07': pegboard,
  'PG-05': petMemorial,
  'PD-02': propagationStation,
  'PD-03': geometricPlanterTrio,
  'PD-04': hangingAirPlantHolder,
  'PD-05': decorativeVase,
  'PD-06': doorwaySilhouette,
  'PD-07': plantTrellis,
  'GH-04': hobbyRack,
  'SE-01': personalizedOrnament,
  'SE-06': coordinatesKeepsake,
  'SE-07': lithophane,
  'BE-05': personalizedBagTag,
};

export function getProductImage(productId: string) {
  return productImages[productId];
}
