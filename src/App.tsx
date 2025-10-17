import React from "react";
import ArtworkTable from "./Component/DataTable";

const App: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <h2>Artworks (server-side pagination)</h2>
      <ArtworkTable />
    </div>
  );
};

export default App;
