import { useState } from "react";
import { Save } from "lucide-react";

export default function Settings() {
  const [name, setName] = useState("Rushikesh");
  const [email, setEmail] =
    useState("demo@planora.local");
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem(
      "planora-settings",
      JSON.stringify({ name, email })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PREFERENCES</span>
          <h1>Settings</h1>
          <p>Manage your Planora profile.</p>
        </div>
      </div>

      <div className="panel settings-panel">
        <label>Name</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Email</label>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="primary-button"
          onClick={save}
        >
          <Save size={17} />
          {saved ? "Saved" : "Save Settings"}
        </button>
      </div>
    </section>
  );
}
