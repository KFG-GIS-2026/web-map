// Local OSM street names within Neckargemünd's administrative boundary.
// Local data keeps autocomplete fast and avoids a geocoder request per keystroke.
const NECKARGEMUEND_STREETS = Object.freeze(`
Adalbert-Seifriz-Straße
Adalbert-Stifter-Straße
Adam-Siefert-Straße
Adolf-Kolping-Straße
Allmendweg
Almstraße
Alte Schulstraße
Alter Bammentaler Weg
Alter Hofweg
Alter Postweg
Alter Weg
Am Blumenstrich
Am Feuertor
Am Forlenwald
Am Hanfmarkt
Am Hang
Am Herrbach
Am Hollmuthhang
Am Kalkbrunnen
Am Kastanienberg
Am Katzenbuckel
Am Mühlrain
Am Mühlwald
Am Neckarberg
Am Ruthberg
Am Schänzel
Am Schulzenbuckel
An der Friedensbrücke
An der Münzenbach
An der Steige
Bachgasse
Bachweg
Bahnhofstraße
Bammentaler Straße
Banngartenstraße
Bannholzweg
Batzenhäuselweg
Bei der Walkmühle
Bergstraße
Birkenstraße
Böhmer Weg
Brückengasse
Brunnacker
Brunnengasse
Brunnenstubenweg
Bürgermeister-Müßig-Straße
Burghofweg
Campingplatz
Carl-Beck-Straße
Carl-Thilo-Weg
Dietrich-Bonhoeffer-Weg
Dilsberger Straße
Dorfplatz
Dreikreuzweg
Eichendorffstraße
Elisabeth-Walter-Straße
Elisenstraße
Elsenzweg
Erdgrubenweg
Fahrgasse
Falltorstraße
Fasanenweg
Finkenweg
Franz-Schubert-Straße
Friedhofstraße
Friedhofweg
Friedrich-Ebert-Straße
Fritz-von-Briesen-Straße
Gaiberger Straße
Gartenstraße
Goethestraße
Gottlob-Kamm-Straße
Großer Garten
Güterbahnhofstraße
Hauptstraße
Heidelberger Straße
Heinrich-Pestalozzi-Straße
Helen-Keller-Weg
Hermann-Walker-Straße
Herrenweg
Herrzehntenweg
Heuweg
Hildastraße
Hirschgasse
Hofwaldweg
Hofwiesen
Hollmuthstraße
Hollmuthtunnel
Im Biengarten
Im Bildsacker
Im Brühl
Im Franz Vollmer
Im Gitter
Im Hasengarten
Im Hirtenstück
Im Hopfengarten
Im Massenbach
Im Neckarhäuserhof
Im Rosengarten
Im Schafgarten
Im Schulzengarten
Im Spitzerfeld
In den Wingert
In der Oberen Haide
Jahnstraße
Jakob-Bernhard-Straße
Jakobsgasse
Josef-Werner-Straße
Julius-Menzer-Straße
Julius-Waibel-Leinpfad
Kapellenweg
Karl-Anton-Weg
Karl-Landsteiner-Straße
Karolinenweg
Kirchgasse
Kirchstraße
Kleppergasse
Kohlackerweg
Konrad-von-Dürn-Straße
Korngasse
Kraichgaustraße
Krautgartenweg
Kriegsmühle
Kurpfalzstraße
Kurt-Lindemann-Straße
Kümmelbachstraße
Langenacker
Langenbachweg
Langenzeller Straße
Langwiesenäcker
Lerchenweg
Lessingstraße
Lilienweg
Lindenstraße
Lochwiese
Ludwig-Uhland-Straße
Luisenstraße
Maria-Probst-Straße
Marktplatz
Marktweg
Melacpass
Merianstraße
Michael-Gerber-Straße
Mittlerer Weg
Montanaweg
Mühlgasse
Mühlwaldweg
Mückenlocher Straße
Neckargemünder Straße
Neckarhäuserhofstraße
Neckarsteinacher Straße
Neckarstraße
Neuer Friedhofweg
Neuer Hilsbacher Weg
Neuhofer Straße
Obere Straße
Obere Zwingergasse
Oberer Weg
Odenwaldstraße
Ortsstraße
Parkstraße
Peter-Schnellbach-Straße
Pfarrgasse
Pfluggasse
Poststraße
Postweg
Quellenweg
Reichensteinstraße
Reihe 1
Reihe 2
Reihe 3
Reihe 4
Reihe 5
Reihe 6
Reihe 7
Reihe 8
Reitenbergweg
Richard-Lenel-Weg
Richard-Schirrmann-Weg
Ringstraße
Ringweg
Rosengasse
Rosenweg
Ränkelweg
Saarstraße
Sandklinge
Savoyer Weg
Schiffgasse
Schillerstraße
Schulstraße
Schwimmbadstraße
Schützenhausstraße
Siedlerweg
Spitalgasse
Spitzenäcker
Steige
Talstraße
Tillyweg
Tulpenweg
Türkenlouisweg
Uferstraße
Untere Eulenscheich
Untere Straße
Untere Zwingergasse
Unterer Weg
Verbindungsweg
Vierburgenstraße
Vor dem Tor
Vordere Schützenhausstraße
Waldstraße
Waldwimmersbacher Straße
Wiesenbacher Straße
Wiesenweg
Ziegelhäuser Straße
Ziegelhütte
Zum Felsenberg
`.trim().split("\n"));
