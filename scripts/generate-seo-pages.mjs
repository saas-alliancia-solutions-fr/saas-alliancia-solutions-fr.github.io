import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "https://saas.alliancia-solutions.fr";
const updated = "2026-09-17";
const updatedLabel = "17 septembre 2026";

const guides = [
  {
    slug: "sauvegarde-cloud-tpe-pme",
    updated: "2026-09-24",
    updatedLabel: "24 septembre 2026",
    readingMinutes: 8,
    title: "Sauvegarde cloud pour TPE et PME",
    navTitle: "Sauvegarde cloud pour TPE et PME",
    description: "Guide pratique pour choisir et organiser une sauvegarde cloud adaptée aux TPE et PME : données prioritaires, fréquence, restauration et budget.",
    lede: "Protégez les données essentielles de votre entreprise avec une sauvegarde externalisée, supervisée et réellement restaurable.",
    answer: "Une TPE n’a pas besoin d’une architecture complexe. Elle a besoin de savoir quoi sauvegarder, combien de temps elle peut rester sans ses données et comment les récupérer après une erreur ou un incident.",
    takeaways: ["Inventorier les données vitales", "Fixer un délai de reprise acceptable", "Tester une restauration avant l’incident"],
    sections: [
      { id: "priorites", title: "Commencer par le risque métier, pas par le stockage", body: `<p>La première question n’est pas « combien de gigaoctets possédons-nous ? », mais « quelles données empêcheraient l’entreprise de travailler si elles disparaissaient demain ? ». Listez les fichiers clients, documents comptables, dossiers de production, bases métier et configurations qui conditionnent l’activité.</p><p>Pour chaque ensemble, définissez deux repères simples : la quantité de travail que vous acceptez de perdre et le temps maximal pendant lequel l’activité peut fonctionner sans ces données. Ces repères orientent la fréquence des sauvegardes et l’ordre de restauration.</p>` },
      { id: "perimetre", title: "Construire un périmètre de sauvegarde utile", body: `<div class="guide-table-wrap"><table><thead><tr><th>Élément</th><th>Question à poser</th><th>Décision attendue</th></tr></thead><tbody><tr><td>Postes de travail</td><td>Les fichiers restent-ils uniquement sur le poste ?</td><td>Inclure les dossiers métier et profils nécessaires</td></tr><tr><td>Serveurs et NAS</td><td>Quelles applications et données partagées y résident ?</td><td>Sauvegarder les volumes et dépendances critiques</td></tr><tr><td>Microsoft 365</td><td>Quelles données sont dans OneDrive, SharePoint ou Exchange ?</td><td>Vérifier la couverture et la rétention adaptées</td></tr><tr><td>Données hors site</td><td>Une copie est-elle séparée du réseau local ?</td><td>Prévoir une copie externalisée protégée</td></tr></tbody></table></div>` },
      { id: "methode", title: "Une méthode de mise en place en cinq étapes", body: `<ol class="guide-steps"><li><strong>Recenser</strong><span>Localisez les données et identifiez leur propriétaire métier.</span></li><li><strong>Prioriser</strong><span>Classez ce qui doit être restauré dans l’heure, la journée ou la semaine.</span></li><li><strong>Automatiser</strong><span>Planifiez les sauvegardes sans dépendre d’une manipulation quotidienne.</span></li><li><strong>Surveiller</strong><span>Traitez les alertes et les postes qui ne sauvegardent plus.</span></li><li><strong>Tester</strong><span>Restaurez un fichier puis un dossier représentatif et documentez la procédure.</span></li></ol>` },
      { id: "controle", title: "Mettre en place un contrôle mensuel en quinze minutes", body: `<p>Une sauvegarde peut cesser de couvrir une donnée importante sans qu’aucune panne ne soit visible : nouveau poste, dossier déplacé, volume saturé ou compte désactivé. Un contrôle court et régulier évite que ces changements passent inaperçus.</p><div class="guide-table-wrap"><table><thead><tr><th>Contrôle</th><th>Preuve attendue</th><th>Action si anomalie</th></tr></thead><tbody><tr><td>Dernière sauvegarde</td><td>Date récente pour chaque équipement critique</td><td>Relancer l’agent et vérifier sa connexion</td></tr><tr><td>Volume protégé</td><td>Évolution cohérente avec l’activité</td><td>Rechercher un dossier exclu ou un stockage saturé</td></tr><tr><td>Alertes</td><td>Aucune erreur persistante non traitée</td><td>Attribuer un responsable et une échéance</td></tr><tr><td>Restauration témoin</td><td>Fichier ouvert et version vérifiée</td><td>Documenter l’échec et corriger avant clôture</td></tr></tbody></table></div><p>Conservez la date du test, le fichier restauré, la durée observée et le nom de la personne qui l’a réalisé. Cette trace transforme une simple sauvegarde déclarée en capacité de reprise vérifiée.</p>` },
      { id: "choix", title: "Ce que le diagnostic doit vous permettre de décider", body: `<p>À la fin du diagnostic, vous devez disposer d’un périmètre clair, d’un volume estimé, d’une fréquence, d’une durée de conservation et d’un scénario de restauration. Le coût devient alors comparable à un besoin concret, et non à une capacité de stockage abstraite.</p><div class="guide-callout"><strong>Conseil pratique</strong><p>Demandez une démonstration de restauration avec un fichier proche de votre usage réel. Une sauvegarde n’a de valeur que si la récupération est comprise et vérifiée.</p></div>` }
    ],
    faqs: [
      ["Combien de données faut-il sauvegarder ?", "Commencez par les données irremplaçables ou longues à reconstruire. Le diagnostic sert ensuite à mesurer ce périmètre et à choisir une marge raisonnable."],
      ["Faut-il sauvegarder tous les postes ?", "Pas nécessairement tout leur contenu, mais chaque emplacement contenant des données métier non centralisées doit être identifié et protégé."],
      ["Une sauvegarde automatique suffit-elle ?", "Non. Il faut aussi surveiller les échecs, conserver plusieurs versions et tester régulièrement une restauration."],
      ["À quelle fréquence faut-il contrôler les sauvegardes ?", "Contrôlez les alertes au fil de l’eau et réalisez au minimum chaque mois une revue des équipements, du volume protégé et d’une restauration témoin."],
    ],
    sources: [{ label: "ANSSI — Fondamentaux de la sauvegarde des systèmes d’information", href: "https://cyber.gouv.fr/sites/default/files/document/anssi-fondamentaux-sauvegarde_systemes_dinformation_v1-0.pdf" }],
    related: ["comparatif-sauvegarde-locale-cloud", "sauvegarde-externalisee-france", "restauration-donnees-apres-incident"]
  },
  {
    slug: "sauvegarde-nas-synology-qnap",
    title: "Sauvegarde NAS Synology et QNAP",
    navTitle: "Sauvegarde NAS Synology et QNAP",
    description: "Comment sauvegarder un NAS Synology ou QNAP hors site : RAID, snapshots, copie externalisée, rétention et tests de restauration.",
    lede: "Un NAS centralise vos fichiers, mais il ne devient une sauvegarde que lorsque ses données existent aussi sur une copie indépendante et restaurable.",
    answer: "Le RAID améliore la disponibilité face à la panne d’un disque ; il ne protège pas à lui seul contre la suppression, le vol, l’incendie, une erreur d’administration ou le chiffrement du NAS.",
    takeaways: ["Distinguer disponibilité et sauvegarde", "Externaliser une copie", "Tester dossiers, droits et versions"],
    sections: [
      { id: "raid", title: "RAID, snapshot et sauvegarde : trois rôles différents", body: `<div class="guide-table-wrap"><table><thead><tr><th>Mécanisme</th><th>Ce qu’il apporte</th><th>Sa limite principale</th></tr></thead><tbody><tr><td>RAID</td><td>Continuité lors de la panne d’un disque</td><td>Réplique aussi les suppressions et corruptions</td></tr><tr><td>Snapshot</td><td>Retour rapide à un état antérieur du volume</td><td>Reste souvent dépendant du même équipement</td></tr><tr><td>Sauvegarde externalisée</td><td>Copie séparée avec historique</td><td>Doit être surveillée et testée</td></tr></tbody></table></div><p>Ces mécanismes se complètent. Le bon montage conserve la rapidité locale du NAS tout en ajoutant une copie située hors de l’équipement et, idéalement, hors du site.</p>` },
      { id: "perimetre", title: "Définir ce qui doit quitter le NAS", body: `<p>Évitez de copier sans discernement des archives déjà redondantes, des caches ou des fichiers temporaires. Séparez les partages métier, les dossiers utilisateurs, les exports de bases de données et les configurations indispensables à la remise en route.</p><ul class="guide-checklist"><li>Repérer les volumes et partages critiques</li><li>Vérifier les comptes utilisés par la tâche de sauvegarde</li><li>Exclure les données reconstructibles et temporaires</li><li>Prévoir la croissance du volume sur douze mois</li></ul>` },
      { id: "restauration", title: "Tester plus qu’un fichier isolé", body: `<p>Un test pertinent vérifie un fichier récent, une version ancienne, un dossier complet et, si nécessaire, les droits d’accès associés. Pour une application hébergée sur le NAS, la restauration des fichiers ne suffit pas toujours : il faut aussi connaître l’ordre de remise en service et les dépendances.</p><div class="guide-callout"><strong>Point de contrôle</strong><p>Documentez qui peut déclencher une restauration, où les données seront récupérées et combien d’espace temporaire est nécessaire.</p></div>` },
      { id: "mise-en-place", title: "Préparer le NAS avant la première sauvegarde", body: `<ol class="guide-steps"><li><strong>Mettre à jour</strong><span>Installez les correctifs du NAS et des paquets.</span></li><li><strong>Limiter les droits</strong><span>Utilisez un compte dédié avec les autorisations nécessaires.</span></li><li><strong>Planifier</strong><span>Choisissez une plage qui n’affecte pas les usages critiques.</span></li><li><strong>Contrôler</strong><span>Vérifiez la première sauvegarde complète et les alertes.</span></li><li><strong>Restaurer</strong><span>Réalisez un test représentatif avant de considérer le dispositif opérationnel.</span></li></ol>` }
    ],
    faqs: [
      ["Le RAID 1 est-il une sauvegarde ?", "Non. Il maintient une copie miroir pour continuer à fonctionner après la panne d’un disque, mais une suppression ou un chiffrement est répliqué."],
      ["Faut-il ouvrir le NAS sur Internet ?", "La sauvegarde doit être configurée avec le minimum d’exposition nécessaire. Évitez les interfaces d’administration publiques et limitez les droits du compte dédié."],
      ["Peut-on restaurer vers un autre NAS ?", "Cela dépend des données, du format et de l’application. Le scénario de remplacement doit être validé pendant le diagnostic et documenté."],
    ],
    sources: [{ label: "ANSSI — Fondamentaux de la sauvegarde des systèmes d’information", href: "https://cyber.gouv.fr/sites/default/files/document/anssi-fondamentaux-sauvegarde_systemes_dinformation_v1-0.pdf" }],
    related: ["sauvegarde-externalisee-france", "protection-rancongiciels", "restauration-donnees-apres-incident"]
  },
  {
    slug: "sauvegarde-microsoft-365",
    title: "Sauvegarde Microsoft 365",
    navTitle: "Sauvegarde Microsoft 365",
    description: "Guide pour définir une stratégie de sauvegarde Microsoft 365 : Exchange, OneDrive, SharePoint, rétention, suppression et restauration.",
    lede: "Les fonctions natives de Microsoft 365 et une sauvegarde répondent à des objectifs différents. Commencez par définir les données à récupérer et le délai attendu.",
    answer: "La disponibilité du service, la corbeille, les politiques de rétention et la sauvegarde ne sont pas interchangeables. Votre politique doit préciser les services couverts, la durée de récupération et le niveau de granularité attendu.",
    takeaways: ["Cartographier Exchange, OneDrive et SharePoint", "Aligner rétention et risques", "Tester la récupération d’un élément et d’un ensemble"],
    sections: [
      { id: "responsabilites", title: "Clarifier ce que vous voulez pouvoir récupérer", body: `<p>Microsoft protège l’infrastructure de sa plateforme et propose des fonctions de conservation et de récupération. Votre organisation reste responsable de la configuration de ses politiques, des comptes, des droits et de la réponse à ses besoins métier.</p><p>Décrivez des scénarios concrets : un message supprimé, un dossier OneDrive écrasé, une bibliothèque SharePoint altérée ou le compte d’un collaborateur compromis. Chaque scénario peut nécessiter une durée et une granularité différentes.</p>` },
      { id: "perimetre", title: "Établir le périmètre par service", body: `<div class="guide-table-wrap"><table><thead><tr><th>Service</th><th>Données à examiner</th><th>Test recommandé</th></tr></thead><tbody><tr><td>Exchange Online</td><td>Boîtes, dossiers, messages et pièces jointes</td><td>Récupérer un message et un dossier</td></tr><tr><td>OneDrive</td><td>Fichiers utilisateurs et versions</td><td>Restaurer un fichier à une date choisie</td></tr><tr><td>SharePoint</td><td>Sites, bibliothèques et droits</td><td>Récupérer une bibliothèque représentative</td></tr><tr><td>Teams</td><td>Fichiers et données liées aux services sous-jacents</td><td>Identifier précisément la source à restaurer</td></tr></tbody></table></div>` },
      { id: "retention", title: "Ne pas confondre rétention réglementaire et reprise", body: `<p>Une politique de rétention vise à conserver ou supprimer des contenus selon des règles. Une stratégie de sauvegarde vise à restaurer un état exploitable après une erreur, un incident ou une suppression. Les deux peuvent coexister, mais leurs paramètres doivent être documentés séparément.</p><div class="guide-callout"><strong>Question utile</strong><p>Si un compte est compromis aujourd’hui, jusqu’à quelle date pouvez-vous revenir, et qui est autorisé à lancer la récupération ?</p></div>` },
      { id: "checklist", title: "Checklist avant de choisir une solution", body: `<ul class="guide-checklist"><li>Recenser les licences, comptes actifs et comptes à conserver</li><li>Identifier les espaces SharePoint et OneDrive critiques</li><li>Définir les durées de récupération par type de contenu</li><li>Contrôler la résidence, les accès administratifs et la traçabilité</li><li>Tester la restauration et la remise à disposition aux utilisateurs</li></ul>` }
    ],
    faqs: [
      ["La corbeille Microsoft 365 remplace-t-elle une sauvegarde ?", "Elle répond à certains scénarios de récupération, mais pas à tous les besoins de durée, de couverture ou d’indépendance. Il faut comparer ses limites à vos scénarios métier."],
      ["Quels services faut-il protéger en priorité ?", "Commencez par ceux qui contiennent les données nécessaires à l’activité : généralement Exchange, OneDrive et SharePoint, puis examinez les dépendances de Teams."],
      ["Faut-il sauvegarder les comptes supprimés ?", "Définissez une procédure de départ collaborateur : durée de conservation, transfert de propriété et date de suppression définitive."],
    ],
    sources: [{ label: "Microsoft Learn — Confidentialité, sécurité et conformité dans Microsoft 365 Backup", href: "https://learn.microsoft.com/fr-fr/microsoft-365/backup/backup-privacy-security?view=o365-worldwide" }],
    related: ["sauvegarde-cloud-tpe-pme", "protection-rancongiciels", "sauvegarde-externalisee-france"]
  },
  {
    slug: "protection-rancongiciels",
    title: "Protéger ses sauvegardes contre les rançongiciels",
    navTitle: "Protection contre les rançongiciels",
    description: "Mesures concrètes pour protéger les sauvegardes d’une TPE ou PME contre un rançongiciel : séparation, historique, accès et tests de reprise.",
    lede: "Une sauvegarde connectée avec les mêmes droits que les postes peut être chiffrée en même temps qu’eux. La protection repose sur la séparation, l’historique et les tests.",
    answer: "La sauvegarde ne bloque pas l’attaque. Elle réduit son impact si une copie exploitable reste hors de portée de l’incident et si l’entreprise sait la restaurer dans un environnement sain.",
    takeaways: ["Séparer les accès de sauvegarde", "Conserver plusieurs points de restauration", "Préparer une reprise sur environnement sain"],
    sections: [
      { id: "strategie", title: "Appliquer la logique 3-2-1 sans la réduire à un slogan", body: `<p>La règle 3-2-1 recommande trois copies des données, sur deux supports différents, dont une copie hors ligne. Dans une petite entreprise, l’objectif reste le même même si la mise en œuvre varie : éviter qu’une seule panne, un seul compte compromis ou un seul site affecte toutes les copies.</p><p>Une copie externalisée en ligne peut contribuer à cette séparation si ses accès, sa rétention et son administration sont conçus pour résister à l’incident touchant le système principal.</p>` },
      { id: "acces", title: "Réduire les chemins qui mènent aux sauvegardes", body: `<ul class="guide-checklist"><li>Utiliser des comptes dédiés qui ne servent pas au travail quotidien</li><li>Limiter les droits de suppression et d’administration</li><li>Protéger les accès administratifs avec une authentification forte</li><li>Éviter de monter en permanence les dépôts de sauvegarde sur les postes</li><li>Surveiller les échecs, volumes anormaux et changements de configuration</li></ul>` },
      { id: "historique", title: "Choisir un historique compatible avec la détection", body: `<p>Un rançongiciel peut rester discret avant d’être découvert. Si toutes les versions saines ont déjà expiré, la sauvegarde la plus récente ne suffit pas. La durée de conservation doit donc tenir compte du délai possible entre l’intrusion, le chiffrement et sa détection.</p><div class="guide-callout"><strong>Dans SAAS</strong><p>Les formules incluent 365 jours de rétention. Le diagnostic sert à vérifier que cette durée et la fréquence de sauvegarde correspondent à vos données critiques.</p></div>` },
      { id: "reprise", title: "Tester une restauration après compromission", body: `<ol class="guide-steps"><li><strong>Isoler</strong><span>Ne restaurez pas tant que la propagation n’est pas contenue.</span></li><li><strong>Choisir</strong><span>Identifiez un point de restauration antérieur à la compromission.</span></li><li><strong>Nettoyer</strong><span>Préparez un système sain et corrigez la cause de l’incident.</span></li><li><strong>Restaurer</strong><span>Commencez par les services prioritaires et contrôlez l’intégrité.</span></li><li><strong>Surveiller</strong><span>Renforcez la vigilance pendant la remise en production.</span></li></ol>` }
    ],
    faqs: [
      ["Une sauvegarde cloud empêche-t-elle un rançongiciel ?", "Non. Elle sert à récupérer les données. La prévention nécessite aussi correctifs, comptes protégés, segmentation, sensibilisation et surveillance."],
      ["Pourquoi conserver plusieurs versions ?", "Pour pouvoir revenir avant une suppression, une corruption ou une compromission découverte tardivement."],
      ["Quand faut-il tester la restauration ?", "À la mise en service, après une modification importante du périmètre et régulièrement selon la criticité de l’activité."],
    ],
    sources: [{ label: "ANSSI — Guide de cybersécurité pour les TPE et PME", href: "https://cyber.gouv.fr/sites/default/files/document/20241212_np_anssi_guide_tpe-pme_v2.pdf" }],
    related: ["restauration-donnees-apres-incident", "sauvegarde-externalisee-france", "sauvegarde-nas-synology-qnap"]
  },
  {
    slug: "restauration-donnees-apres-incident",
    title: "Restaurer ses données après un incident",
    navTitle: "Restauration après incident",
    description: "Plan pratique de restauration après suppression, panne ou cyberattaque : isolation, priorités, choix du point de reprise, contrôle et retour en production.",
    lede: "La restauration commence avant l’incident : priorités, responsabilités, accès et tests doivent être connus lorsque chaque minute compte.",
    answer: "Ne restaurez pas immédiatement par réflexe. Commencez par contenir l’incident, comprendre ce qui est touché et choisir un point de reprise fiable avant de remettre les données en production.",
    takeaways: ["Contenir avant de restaurer", "Prioriser les services essentiels", "Contrôler l’intégrité avant la reprise"],
    sections: [
      { id: "premieres-actions", title: "Les premières actions selon le type d’incident", body: `<div class="guide-table-wrap"><table><thead><tr><th>Incident</th><th>Première action</th><th>Restauration</th></tr></thead><tbody><tr><td>Fichier supprimé</td><td>Identifier l’emplacement et l’heure</td><td>Restaurer la bonne version sans écraser l’existant</td></tr><tr><td>Panne matérielle</td><td>Sécuriser le support et préparer un équipement sain</td><td>Récupérer les données selon leur priorité</td></tr><tr><td>Rançongiciel</td><td>Isoler les systèmes et contenir la propagation</td><td>Revenir à un point sain après analyse</td></tr><tr><td>Erreur applicative</td><td>Arrêter les écritures si elles aggravent la corruption</td><td>Coordonner fichiers, base et configuration</td></tr></tbody></table></div>` },
      { id: "priorites", title: "Restaurer dans l’ordre qui relance l’activité", body: `<p>Une restauration complète n’est pas toujours le moyen le plus rapide de reprendre. Classez les fonctions : authentification et réseau, données partagées, application principale, postes essentiels, puis archives. Identifiez aussi les dépendances invisibles comme les certificats, comptes de service et configurations.</p><div class="guide-callout"><strong>Deux objectifs à écrire</strong><p>Le délai maximal de reprise indique combien de temps le service peut rester indisponible. Le point de reprise indique quelle quantité de données récentes peut être perdue.</p></div>` },
      { id: "procedure", title: "Une procédure de restauration vérifiable", body: `<ol class="guide-steps"><li><strong>Qualifier</strong><span>Déterminez l’étendue, la cause probable et l’heure de début.</span></li><li><strong>Préserver</strong><span>Conservez les éléments utiles à l’analyse avant toute remise à zéro.</span></li><li><strong>Sélectionner</strong><span>Choisissez la version ou le point de reprise approprié.</span></li><li><strong>Restaurer</strong><span>Travaillez d’abord dans un emplacement contrôlé.</span></li><li><strong>Valider</strong><span>Faites vérifier les données par leur propriétaire métier avant la production.</span></li></ol>` },
      { id: "test", title: "Transformer chaque test en preuve opérationnelle", body: `<p>Un bon compte rendu indique la date, les données testées, le volume, le temps nécessaire, les personnes impliquées et les problèmes rencontrés. Cette trace révèle si les objectifs sont réalistes et améliore la procédure suivante.</p><p>SAAS permet la restauration autonome 24h/24. Pour les scénarios plus larges, le diagnostic permet de définir à l’avance les équipements, espaces temporaires et responsabilités nécessaires.</p>` }
    ],
    faqs: [
      ["Dois-je restaurer la sauvegarde la plus récente ?", "Pas toujours. Après une corruption ou une attaque, il faut sélectionner un point antérieur à l’incident et vérifier qu’il est exploitable."],
      ["Comment éviter d’écraser un fichier encore utile ?", "Restaurez d’abord dans un emplacement séparé, comparez les versions, puis validez le remplacement avec le propriétaire du document."],
      ["Qui doit valider le retour en production ?", "Le responsable technique confirme l’intégrité du système et le responsable métier vérifie que les données permettent réellement de reprendre l’activité."],
    ],
    sources: [{ label: "ANSSI — Fondamentaux de la sauvegarde des systèmes d’information", href: "https://cyber.gouv.fr/sites/default/files/document/anssi-fondamentaux-sauvegarde_systemes_dinformation_v1-0.pdf" }],
    related: ["protection-rancongiciels", "sauvegarde-cloud-tpe-pme", "comparatif-sauvegarde-locale-cloud"]
  },
  {
    slug: "sauvegarde-externalisee-france",
    title: "Sauvegarde externalisée en France",
    navTitle: "Sauvegarde externalisée en France",
    description: "Critères pour choisir une sauvegarde externalisée en France : localisation, sécurité, rétention, restauration, réversibilité et accompagnement.",
    lede: "Externaliser une copie réduit le risque lié au site principal. Encore faut-il vérifier où sont les données, qui y accède et comment les récupérer.",
    answer: "La mention « hébergé en France » ne résume pas le service. Examinez aussi la chaîne d’exploitation, les accès, le chiffrement, la rétention, la réversibilité et la procédure de restauration.",
    takeaways: ["Vérifier la localisation contractuelle", "Comprendre les accès et la réversibilité", "Tester la restauration depuis l’extérieur"],
    sections: [
      { id: "criteres", title: "Les critères à demander par écrit", body: `<div class="guide-table-wrap"><table><thead><tr><th>Critère</th><th>Question concrète</th><th>Pourquoi c’est important</th></tr></thead><tbody><tr><td>Localisation</td><td>Dans quels pays les données et copies sont-elles stockées ?</td><td>Comprendre la juridiction et les engagements</td></tr><tr><td>Accès</td><td>Qui peut administrer ou restaurer les sauvegardes ?</td><td>Limiter les risques de privilèges excessifs</td></tr><tr><td>Rétention</td><td>Combien de versions et pendant combien de temps ?</td><td>Revenir avant une erreur découverte tardivement</td></tr><tr><td>Réversibilité</td><td>Comment récupérer les données en fin de contrat ?</td><td>Éviter une dépendance non maîtrisée</td></tr><tr><td>Restauration</td><td>Quel est le processus pour un fichier et pour un volume important ?</td><td>Préparer les délais et responsabilités</td></tr></tbody></table></div>` },
      { id: "securite", title: "Évaluer l’exploitation, pas seulement le datacenter", body: `<p>Une infrastructure certifiée est un signal utile, mais la qualité du service dépend aussi de sa configuration, de la gestion des identités, des alertes et des procédures. Demandez comment les échecs sont détectés, comment les droits sont accordés et comment les incidents sont traités.</p><div class="guide-callout"><strong>Engagement SAAS</strong><p>Les données SAAS sont hébergées en France au sein d’une infrastructure HDS et ISO 27001. Le diagnostic précise le périmètre, la rétention de 365 jours et le mode de restauration.</p></div>` },
      { id: "reversibilite", title: "Préparer la sortie dès l’entrée", body: `<p>La réversibilité doit indiquer le format de restitution, le canal de transfert, les délais, les éventuels coûts et la suppression des copies restantes. Une procédure claire protège l’entreprise lors d’un changement de prestataire ou d’une cessation d’activité.</p><ul class="guide-checklist"><li>Nommer le responsable de la demande de restitution</li><li>Prévoir un espace de réception suffisamment dimensionné</li><li>Contrôler l’intégrité des fichiers récupérés</li><li>Conserver la preuve de clôture et de suppression prévue au contrat</li></ul>` },
      { id: "diagnostic", title: "Ce que doit couvrir votre diagnostic", body: `<p>Le diagnostic doit relier les exigences de localisation au besoin métier : types de données, sensibilité, volume, croissance, personnes autorisées, délai de reprise et contraintes de connexion. Il permet ensuite de comparer des offres sur le même périmètre.</p>` }
    ],
    faqs: [
      ["Hébergement en France signifie-t-il que tout est français ?", "Pas nécessairement. Demandez la localisation des données, l’identité des entités qui exploitent le service et les engagements contractuels applicables."],
      ["Une certification suffit-elle à garantir ma sauvegarde ?", "Non. Elle atteste un cadre ou un périmètre donné. Vérifiez aussi la configuration, la surveillance, les accès et vos propres tests de restauration."],
      ["Comment récupérer beaucoup de données après une panne ?", "Le scénario dépend du volume et de la connexion disponible. Il doit être préparé pendant le diagnostic, avec un mode de restitution adapté."],
    ],
    sources: [{ label: "ANSSI — Fondamentaux de la sauvegarde des systèmes d’information", href: "https://cyber.gouv.fr/sites/default/files/document/anssi-fondamentaux-sauvegarde_systemes_dinformation_v1-0.pdf" }],
    related: ["sauvegarde-cloud-tpe-pme", "comparatif-sauvegarde-locale-cloud", "protection-rancongiciels"]
  },
  {
    slug: "comparatif-sauvegarde-locale-cloud",
    title: "Sauvegarde locale ou sauvegarde cloud : que choisir ?",
    navTitle: "Comparatif sauvegarde locale et cloud",
    description: "Comparatif pratique entre sauvegarde locale et sauvegarde cloud : rapidité, coûts, risques, exploitation, restauration et stratégie hybride.",
    lede: "La sauvegarde locale et la sauvegarde cloud répondent à des contraintes différentes. Dans beaucoup de cas, leur complémentarité est plus utile qu’un choix exclusif.",
    answer: "Le local facilite les restaurations rapides et le contrôle direct. Le cloud externalise une copie et réduit la dépendance au site. Une stratégie hybride bien exploitée couvre davantage de scénarios.",
    takeaways: ["Comparer les scénarios de panne", "Inclure le temps d’exploitation", "Prévoir une copie hors du site"],
    sections: [
      { id: "comparaison", title: "Comparer sur des critères opérationnels", body: `<div class="guide-table-wrap"><table><thead><tr><th>Critère</th><th>Sauvegarde locale</th><th>Sauvegarde cloud</th></tr></thead><tbody><tr><td>Restauration d’un gros volume</td><td>Rapide sur le réseau local si le matériel fonctionne</td><td>Dépend du débit et du mode de restitution</td></tr><tr><td>Sinistre du site</td><td>Vulnérable si la copie reste au même endroit</td><td>Copie séparée du site principal</td></tr><tr><td>Investissement</td><td>Matériel, remplacement et capacité à prévoir</td><td>Service récurrent selon le volume</td></tr><tr><td>Exploitation</td><td>Surveillance et maintenance internes</td><td>Partagée avec le prestataire selon l’offre</td></tr><tr><td>Contrôle</td><td>Accès physique direct</td><td>Contrat, console et procédures de restitution</td></tr></tbody></table></div>` },
      { id: "cout", title: "Calculer le coût complet, pas seulement le stockage", body: `<p>Pour le local, incluez le matériel, les disques de remplacement, l’électricité, le temps de surveillance, les mises à jour et le renouvellement. Pour le cloud, incluez l’abonnement, le volume, les éventuels frais de restauration ou de sortie et le temps d’administration.</p><p>SAAS ne facture ni la restauration ni la sortie et autorise plusieurs postes dans un même contrat ; le tarif dépend du volume sauvegardé.</p>` },
      { id: "hybride", title: "Pourquoi une stratégie hybride est souvent pertinente", body: `<p>Une copie locale peut accélérer la récupération d’un fichier ou d’un volume important. Une copie externalisée protège contre le vol, l’incendie ou l’attaque affectant le site. L’enjeu est d’éviter que les deux copies dépendent des mêmes comptes ou du même équipement.</p><div class="guide-callout"><strong>Repère 3-2-1</strong><p>Conservez trois copies des données sur deux supports différents, dont une hors ligne. Adaptez ensuite la fréquence et la durée de conservation à votre activité.</p></div>` },
      { id: "decision", title: "Une grille de décision en quatre questions", body: `<ol class="guide-steps"><li><strong>Volume</strong><span>Combien de données faut-il restaurer en urgence ?</span></li><li><strong>Délai</strong><span>Combien de temps l’activité peut-elle attendre ?</span></li><li><strong>Sinistre</strong><span>La copie reste-t-elle disponible si le site ou le réseau est touché ?</span></li><li><strong>Exploitation</strong><span>Qui surveille, remplace les supports et teste la restauration ?</span></li></ol>` }
    ],
    faqs: [
      ["Le cloud est-il toujours plus lent à restaurer ?", "Cela dépend du volume, du débit et du mode de restitution. Pour quelques fichiers, la différence peut être faible ; un volume complet doit être anticipé."],
      ["Un disque USB est-il suffisant ?", "Il peut constituer une copie, mais il doit être alterné, contrôlé et déconnecté. Une seule copie branchée en permanence reste exposée à plusieurs incidents."],
      ["Faut-il choisir entre local et cloud ?", "Pas forcément. Une combinaison bien conçue apporte souvent une récupération locale rapide et une copie séparée du site."],
    ],
    sources: [{ label: "ANSSI — Guide de cybersécurité pour les TPE et PME", href: "https://cyber.gouv.fr/sites/default/files/document/20241212_np_anssi_guide_tpe-pme_v2.pdf" }],
    related: ["sauvegarde-cloud-tpe-pme", "sauvegarde-externalisee-france", "sauvegarde-nas-synology-qnap"]
  }
];

const bySlug = Object.fromEntries(guides.map((guide) => [guide.slug, guide]));

const header = (guidePage = false) => `
  <header class="site-header" data-header>
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="SAAS, accueil"><img src="/assets/alliancia-logo-144-v1.png" decoding="async" alt="" width="48" height="48"><span class="brand-copy"><strong>SAAS</strong><small>Service d’Archivage<br>Automatique Sécurisé</small></span></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" data-menu-toggle><span></span><span></span><span></span><span class="sr-only">Ouvrir le menu</span></button>
      <nav id="main-nav" class="main-nav" aria-label="Navigation principale" data-nav><a href="/">Accueil</a><a href="/#solution">La solution</a><a href="/#tarifs">Tarifs</a><a href="/guides.html"${guidePage ? ' aria-current="page"' : ""}>Guides</a><a href="/helpwire.html">Assistance</a><a href="/contact.html">Contact</a><a class="nav-account" href="/connexion.html">Se connecter</a></nav>
    </div>
  </header>`;

const footer = `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-cta"><div class="footer-cta-copy"><h2>Un besoin ? <span>Parlons-en.</span></h2><p>Diagnostic, installation ou assistance à distance : un interlocuteur Alliancia vous répond.</p></div><div class="footer-actions"><a class="button" href="/contact.html">Nous contacter</a><a class="button button-secondary" href="/helpwire.html">Assistance à distance</a></div></div>
      <div class="footer-main">
        <div class="footer-primary"><img src="/assets/alliancia-logo-144-v1.png" loading="lazy" decoding="async" alt="" width="50" height="50"><strong>SAAS</strong><span>Service d’Archivage Automatique Sécurisé</span><p>La sauvegarde cloud française accompagnée par Alliancia Solutions.</p><address>5 rue Grenouillère · 68230 Turckheim, France</address></div>
        <nav class="footer-nav" aria-label="Solution"><strong>Solution</strong><a href="/#solution">La solution</a><a href="/#fonctionnement">Comment ça marche</a><a href="/#tarifs">Tarifs</a><a href="/guides.html">Guides pratiques</a><a href="/helpwire.html">Assistance à distance</a></nav>
        <nav class="footer-nav" aria-label="Espace client"><strong>Espace client</strong><a href="/connexion.html">Se connecter</a><a href="/espace-client.html">Téléchargements</a><a href="/contact.html?objet=Assistance%20technique#formulaire">Contacter l’assistance</a></nav>
        <nav class="footer-nav" aria-label="Informations"><strong>Informations</strong><a href="/contact.html">Nous contacter</a><a href="https://alliancia-solutions.fr">Alliancia Solutions</a><a href="/mentions-legales.html">Mentions légales</a><a href="/confidentialite.html">Confidentialité</a></nav>
      </div>
      <div class="footer-bottom"><span>© <span data-year>2026</span> Alliancia Solutions</span><span class="footer-trust">Données hébergées en France · Infrastructure HDS &amp; ISO 27001</span></div>
    </div>
  </footer>`;

const head = ({ title, description, path, type = "article", schema }) => `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#10233f">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${baseUrl}/${path}">
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=20260917-4">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${baseUrl}/${path}">
  <meta property="og:image" content="${baseUrl}/assets/saas-hero-v3.png">
  <meta property="og:image:alt" content="SAAS, sauvegarde cloud française pour TPE et PME">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>`;

const diagnosticCta = `
    <section class="guide-diagnostic" aria-labelledby="diagnostic-title">
      <div class="container guide-diagnostic-inner"><div><h2 id="diagnostic-title">Votre sauvegarde résiste-t-elle au scénario qui vous concerne ?</h2><p>En 30 minutes, nous vérifions vos données, vos équipements, vos délais de reprise et le volume réellement utile.</p></div><div><a class="button booking-link" href="mailto:contact@alliancia-solutions.fr?subject=Diagnostic%20SAAS%20de%2030%20minutes">Planifier mon diagnostic</a><span>Gratuit · Sans engagement · En visioconférence</span></div></div>
    </section>`;

function articleSchema(guide) {
  const url = `${baseUrl}/${guide.slug}.html`;
  const modified = guide.updated || updated;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", "@id": `${url}#article`, headline: guide.title, description: guide.description, datePublished: updated, dateModified: modified, inLanguage: "fr-FR", mainEntityOfPage: url, author: { "@type": "Organization", name: "Alliancia Solutions", url: "https://alliancia-solutions.fr" }, publisher: { "@type": "Organization", "@id": `${baseUrl}/#organization`, name: "Alliancia Solutions", logo: { "@type": "ImageObject", url: `${baseUrl}/assets/alliancia-logo-144-v1.png` } } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${baseUrl}/guides.html` },
        { "@type": "ListItem", position: 3, name: guide.title, item: url }
      ] }
    ]
  };
}

function renderArticle(guide) {
  const related = guide.related.map((slug) => bySlug[slug]);
  const path = `${guide.slug}.html`;
  return `${head({ title: `${guide.title} — Guide SAAS`, description: guide.description, path, schema: articleSchema(guide) })}
<body class="guide-page">
  <a class="skip-link" href="#contenu">Aller au contenu</a>
${header(true)}
  <main id="contenu">
    <section class="guide-hero">
      <div class="container guide-hero-grid">
        <div class="guide-hero-copy">
          <nav class="breadcrumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span aria-hidden="true">›</span><a href="/guides.html">Guides</a><span aria-hidden="true">›</span><span>${guide.title}</span></nav>
          <h1>${guide.title}</h1><p>${guide.lede}</p>
          <div class="guide-hero-actions"><a class="button booking-link" href="mailto:contact@alliancia-solutions.fr?subject=Diagnostic%20SAAS%20de%2030%20minutes">Planifier mon diagnostic</a><a class="text-link" href="#guide">Lire le guide ↓</a></div>
          <p class="guide-meta">Publié par Alliancia Solutions · Mis à jour le ${guide.updatedLabel || updatedLabel} · Lecture : ${guide.readingMinutes || 7} minutes</p>
        </div>
        <aside class="guide-answer" aria-label="Réponse courte"><strong>À retenir</strong><p>${guide.answer}</p><ul>${guide.takeaways.map((item) => `<li>${item}</li>`).join("")}</ul></aside>
      </div>
    </section>
    <section class="guide-content" id="guide">
      <div class="container guide-layout">
        <aside class="guide-toc"><strong>Dans ce guide</strong><nav aria-label="Sommaire">${guide.sections.map((section) => `<a href="#${section.id}">${section.title}</a>`).join("")}<a href="#questions">Questions fréquentes</a></nav></aside>
        <article class="guide-article">
          ${guide.sections.map((section) => `<section id="${section.id}"><h2>${section.title}</h2>${section.body}</section>`).join("\n")}
          <section id="questions" class="guide-faq"><h2>Questions fréquentes</h2>${guide.faqs.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join("")}</section>
          <section class="guide-sources" aria-labelledby="sources-title"><h2 id="sources-title">Sources utiles</h2><p>Ces ressources officielles permettent d’approfondir les recommandations et d’adapter la stratégie à votre contexte.</p><ul>${guide.sources.map((source) => `<li><a href="${source.href}">${source.label}</a></li>`).join("")}</ul></section>
        </article>
      </div>
    </section>
    <section class="related-guides" aria-labelledby="related-title"><div class="container"><div class="related-heading"><h2 id="related-title">Poursuivre avec un guide complémentaire</h2><a href="/guides.html">Voir tous les guides →</a></div><div class="related-grid">${related.map((item) => `<a href="/${item.slug}.html"><strong>${item.navTitle}</strong><span>${item.description}</span><b>Lire le guide →</b></a>`).join("")}</div></div></section>
${diagnosticCta}
  </main>
${footer}
  <script src="/site-ui.js?v=20260917-1" defer></script><script src="/config.js"></script><script src="/script.js?v=20260914-3" defer></script>
</body>
</html>`;
}

function renderHub() {
  const path = "guides.html";
  const title = "Guides de sauvegarde et restauration pour TPE et PME — SAAS";
  const description = "Guides pratiques SAAS pour choisir une sauvegarde cloud, protéger un NAS ou Microsoft 365, anticiper un rançongiciel et restaurer après incident.";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${baseUrl}/${path}#collection`, name: title, description, url: `${baseUrl}/${path}`, inLanguage: "fr-FR", isPartOf: { "@id": `${baseUrl}/#website` } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${baseUrl}/${path}` }
      ] }
    ]
  };
  return `${head({ title, description, path, type: "website", schema })}
<body class="guide-page guide-hub-page">
  <a class="skip-link" href="#contenu">Aller au contenu</a>
${header(true)}
  <main id="contenu">
    <section class="guide-hub-hero"><div class="container"><nav class="breadcrumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span aria-hidden="true">›</span><span>Guides</span></nav><h1>Mieux décider avant d’avoir besoin de restaurer.</h1><p>Des guides concrets pour identifier les données critiques, choisir une stratégie de sauvegarde et préparer la reprise après un incident.</p><a class="button booking-link" href="mailto:contact@alliancia-solutions.fr?subject=Diagnostic%20SAAS%20de%2030%20minutes">Planifier mon diagnostic</a></div></section>
    <section class="guide-library" aria-labelledby="library-title"><div class="container"><div class="guide-library-heading"><h2 id="library-title">Choisissez votre point de départ</h2><p>Chaque guide répond à une décision précise et se termine par une checklist utilisable avec votre équipe ou votre prestataire.</p></div><div class="guide-library-list">${guides.map((guide, index) => `<a href="/${guide.slug}.html"><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${guide.navTitle}</h3><p>${guide.description}</p></div><b aria-hidden="true">→</b></a>`).join("")}</div></div></section>
    <section class="guide-method"><div class="container guide-method-grid"><div><h2>Trois questions avant de comparer les solutions</h2><p>Une bonne stratégie commence par votre activité, pas par une fiche technique.</p></div><ol><li><strong>Quelles données arrêtent l’entreprise si elles disparaissent ?</strong><span>Identifiez les fichiers, applications et configurations réellement indispensables.</span></li><li><strong>Combien de temps pouvez-vous attendre ?</strong><span>Fixez un ordre de reprise et un délai acceptable par service.</span></li><li><strong>Avez-vous déjà réussi une restauration ?</strong><span>Un test réel vaut davantage qu’une sauvegarde supposée réussie.</span></li></ol></div></section>
${diagnosticCta}
  </main>
${footer}
  <script src="/site-ui.js?v=20260917-1" defer></script><script src="/config.js"></script><script src="/script.js?v=20260914-3" defer></script>
</body>
</html>`;
}

await Promise.all([
  writeFile(resolve(root, "guides.html"), renderHub()),
  ...guides.map((guide) => writeFile(resolve(root, `${guide.slug}.html`), renderArticle(guide))),
]);

console.log(`Generated ${guides.length + 1} guide pages.`);
