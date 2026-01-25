export default function GDPR() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Verantwortlicher</h2>
          <p className="leading-relaxed">
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          </p>
          <p className="leading-relaxed mt-2">
            Tobias Waslowski
            <br />
            E-Mail:{" "}
            <a
              href="mailto:contact@grammr.app"
              className="text-blue-600 hover:underline"
            >
              contact@grammr.app
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Erhebung und Verarbeitung personenbezogener Daten
          </h2>
          <p className="leading-relaxed">
            Wir erheben und verarbeiten ausschließlich Ihre E-Mail-Adresse, wenn
            Sie diese freiwillig auf unserer Website angeben.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Rechtsgrundlage der Verarbeitung
          </h2>
          <p className="leading-relaxed">
            Die Verarbeitung Ihrer E-Mail-Adresse erfolgt auf Grundlage von:
          </p>
          <ul className="list-disc list-inside leading-relaxed mt-2 ml-4">
            <li>
              Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), sofern Sie der
              Verarbeitung zugestimmt haben, oder
            </li>
            <li>
              Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), sofern die
              E-Mail-Adresse zur Erbringung unserer Dienstleistung erforderlich
              ist.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            4. Zweck der Datenverarbeitung
          </h2>
          <p className="leading-relaxed">
            Ihre E-Mail-Adresse wird verwendet für:
          </p>
          <ul className="list-disc list-inside leading-relaxed mt-2 ml-4">
            <li>Kommunikation und Beantwortung von Anfragen</li>
            <li>Bereitstellung unserer Dienstleistungen</li>
            <li>Versand von Informationen, sofern Sie dem zugestimmt haben</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Speicherdauer</h2>
          <p className="leading-relaxed">
            Wir speichern Ihre E-Mail-Adresse nur so lange, wie es für die oben
            genannten Zwecke erforderlich ist oder gesetzliche
            Aufbewahrungspflichten bestehen. Nach Wegfall des Zwecks oder
            Widerruf Ihrer Einwilligung werden Ihre Daten gelöscht.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            6. Weitergabe von Daten
          </h2>
          <p className="leading-relaxed">
            Eine Weitergabe Ihrer E-Mail-Adresse an Dritte erfolgt nur, wenn
            dies zur Erbringung unserer Dienstleistung notwendig ist (z.B. an
            E-Mail-Dienstleister oder Hosting-Anbieter) oder Sie ausdrücklich
            eingewilligt haben. Sofern Daten an Dienstleister außerhalb der
            EU/EEA übermittelt werden, stellen wir sicher, dass angemessene
            Garantien gemäß Art. 44 ff. DSGVO bestehen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Ihre Rechte</h2>
          <p className="leading-relaxed mb-2">
            Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
          </p>
          <ul className="list-disc list-inside leading-relaxed ml-4">
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>
              Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)
            </li>
            <li>
              Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3
              DSGVO)
            </li>
          </ul>
          <p className="leading-relaxed mt-4">
            Zur Ausübung dieser Rechte kontaktieren Sie uns bitte unter:{" "}
            <a
              href="mailto:contact@grammr.app"
              className="text-blue-600 hover:underline"
            >
              contact@grammr.app
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Beschwerderecht</h2>
          <p className="leading-relaxed">
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde
            über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu
            beschweren. In Deutschland können Sie sich an die für Ihren Wohnort
            zuständige Landesdatenschutzbehörde wenden.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Datensicherheit</h2>
          <p className="leading-relaxed">
            Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein,
            um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen,
            Verlust, Zerstörung oder gegen den Zugriff unberechtigter Personen
            zu schützen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            10. Automatisierte Entscheidungsfindung
          </h2>
          <p className="leading-relaxed">
            Wir verwenden keine automatisierte Entscheidungsfindung
            einschließlich Profiling gemäß Art. 22 DSGVO.
          </p>
        </section>
      </div>
    </div>
  );
}
