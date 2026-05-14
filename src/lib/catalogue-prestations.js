export const CATALOGUE = {
  plombier: [
    { categorie: 'Robinetterie', items: [
      { designation: 'Remplacement robinet mitigeur lavabo — dépose + pose', quantite: 1, pu_ht: 120 },
      { designation: 'Remplacement robinet mitigeur cuisine — dépose + pose', quantite: 1, pu_ht: 130 },
      { designation: 'Changement joint de robinet', quantite: 1, pu_ht: 60 },
      { designation: 'Remplacement vanne d\'arrêt / robinet de barrage', quantite: 1, pu_ht: 95 },
    ]},
    { categorie: 'Sanitaires', items: [
      { designation: 'Pose lavabo encastré — fourniture et pose', quantite: 1, pu_ht: 280 },
      { designation: 'Installation WC suspendu avec bâti-support', quantite: 1, pu_ht: 550 },
      { designation: 'Pose baignoire — raccordement + évacuation', quantite: 1, pu_ht: 450 },
      { designation: 'Installation douche à l\'italienne — plomberie seule', quantite: 1, pu_ht: 620 },
      { designation: 'Raccordement lave-linge / lave-vaisselle', quantite: 1, pu_ht: 180 },
    ]},
    { categorie: 'Canalisations', items: [
      { designation: 'Débouchage canalisation — débouchoir électrique', quantite: 1, pu_ht: 150 },
      { designation: 'Recherche de fuite — diagnostic', quantite: 1, pu_ht: 180 },
      { designation: 'Soudure tube cuivre', quantite: 1, pu_ht: 35 },
      { designation: 'Pose tube PER multicouche (au mètre)', quantite: 1, pu_ht: 18 },
      { designation: 'Remplacement siphon d\'évier / lavabo', quantite: 1, pu_ht: 70 },
    ]},
    { categorie: 'Chauffe-eau & Chauffage', items: [
      { designation: 'Remplacement chauffe-eau électrique 150L — fourniture et pose', quantite: 1, pu_ht: 680 },
      { designation: 'Remplacement chauffe-eau électrique 200L — fourniture et pose', quantite: 1, pu_ht: 780 },
      { designation: 'Pose radiateur à eau — raccordement', quantite: 1, pu_ht: 380 },
      { designation: 'Purge radiateur', quantite: 1, pu_ht: 50 },
      { designation: 'Installation chaudière à gaz — pose et raccordement', quantite: 1, pu_ht: 1200 },
    ]},
    { categorie: 'Main d\'œuvre', items: [
      { designation: 'Main d\'œuvre plomberie — heure', quantite: 1, pu_ht: 55 },
      { designation: 'Déplacement et frais de mise en route', quantite: 1, pu_ht: 40 },
      { designation: 'Mise en service et test étanchéité', quantite: 1, pu_ht: 80 },
    ]},
  ],

  electricien: [
    { categorie: 'Tableau électrique', items: [
      { designation: 'Remplacement tableau électrique 12 modules — fourniture et pose', quantite: 1, pu_ht: 850 },
      { designation: 'Remplacement tableau électrique 18 modules — fourniture et pose', quantite: 1, pu_ht: 1050 },
      { designation: 'Remplacement disjoncteur différentiel 40A', quantite: 1, pu_ht: 280 },
      { designation: 'Ajout disjoncteur de protection', quantite: 1, pu_ht: 95 },
    ]},
    { categorie: 'Prises & Interrupteurs', items: [
      { designation: 'Installation prise de courant 16A — fourniture et pose', quantite: 1, pu_ht: 85 },
      { designation: 'Installation prise 32A dédiée (four, sèche-linge)', quantite: 1, pu_ht: 120 },
      { designation: 'Installation interrupteur simple — fourniture et pose', quantite: 1, pu_ht: 75 },
      { designation: 'Installation interrupteur va-et-vient — fourniture et pose', quantite: 1, pu_ht: 95 },
      { designation: 'Installation variateur d\'éclairage', quantite: 1, pu_ht: 110 },
    ]},
    { categorie: 'Éclairage', items: [
      { designation: 'Pose luminaire / plafonnier — branchement', quantite: 1, pu_ht: 100 },
      { designation: 'Pose spot encastré — perçage + branchement', quantite: 1, pu_ht: 85 },
      { designation: 'Installation éclairage extérieur avec détecteur', quantite: 1, pu_ht: 180 },
      { designation: 'Pose dalles LED bureau / commerce (unité)', quantite: 1, pu_ht: 130 },
    ]},
    { categorie: 'Câblage & Gaines', items: [
      { designation: 'Passage câble 2.5mm² sous gaine (au mètre)', quantite: 1, pu_ht: 14 },
      { designation: 'Passage câble 4mm² sous gaine (au mètre)', quantite: 1, pu_ht: 18 },
      { designation: 'Pose goulotte apparente (au mètre)', quantite: 1, pu_ht: 12 },
      { designation: 'Pose câble réseau RJ45 (au mètre)', quantite: 1, pu_ht: 15 },
      { designation: 'Installation boîte de dérivation', quantite: 1, pu_ht: 65 },
    ]},
    { categorie: 'Équipements spéciaux', items: [
      { designation: 'Installation VMC simple flux — fourniture et pose', quantite: 1, pu_ht: 480 },
      { designation: 'Installation borne de recharge VE 7kW — fourniture et pose', quantite: 1, pu_ht: 980 },
      { designation: 'Installation détecteur de fumée interconnecté', quantite: 1, pu_ht: 75 },
      { designation: 'Installation chauffage électrique à inertie', quantite: 1, pu_ht: 420 },
      { designation: 'Mise en conformité installation électrique', quantite: 1, pu_ht: 1250 },
    ]},
    { categorie: 'Main d\'œuvre', items: [
      { designation: 'Main d\'œuvre électricien — heure', quantite: 1, pu_ht: 55 },
      { designation: 'Déplacement et frais de mise en route', quantite: 1, pu_ht: 40 },
      { designation: 'Mise en service et tests de conformité', quantite: 1, pu_ht: 90 },
    ]},
  ],
}

export function getCatalogueByMetier(metier) {
  if (metier === 'plombier') return CATALOGUE.plombier
  if (metier === 'electricien') return CATALOGUE.electricien
  return []
}

export const METIER_LABELS = {
  plombier:    'Plombier',
  electricien: 'Électricien',
  autre:       'Autre BTP',
}
