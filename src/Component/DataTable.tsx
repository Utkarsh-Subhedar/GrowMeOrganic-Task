import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { fetchArtworks } from "./Api";
import { Dropdown } from "primereact/dropdown";
import { OverlayPanel } from "primereact/overlaypanel"; // Added Import
import { Button } from "primereact/button"; // Added Import

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string | null;
  artist_display: string | null;
  inscriptions: string | null;
  date_start: number | null;
  date_end: number | null;
}

// Helper to map API data to Artwork type
const mapToArtwork = (item: any): Artwork => ({
  id: item.id,
  title: item.title,
  place_of_origin: item.place_of_origin,
  artist_display: item.artist_display,
  inscriptions: item.inscriptions,
  date_start: item.date_start,
  date_end: item.date_end,
});

const ArtworkTable: React.FC = () => {
  const [rows, setRows] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selection state: store selected rows across all pages using a Map
  const [selectedMap, setSelectedMap] = useState<Map<number, Artwork>>(new Map());

  // Overlay and Input state for the new feature
  const [inputNumber, setInputNumber] = useState("");
  const overlayRef = useRef<OverlayPanel>(null);

  // Derive current page selection for DataTable
  const selectedOnPage = rows.filter((r) => selectedMap.has(r.id));

  // -------------------------------------------------------------------
  // DATA FETCHING & PAGINATION
  // -------------------------------------------------------------------

  const loadPage = async (p: number, limit: number) => {
    setLoading(true);
    try {
      const data: any = await fetchArtworks(p, limit);
      const mapped = (data.data || [])
        .filter((d: any) => d.id) // Filter out items without an ID
        .map(mapToArtwork);

      setRows(mapped);

      if (data.pagination && data.pagination.total) {
        setTotalRecords(data.pagination.total);
      } else if (data.pagination && data.pagination.total_pages) {
        setTotalRecords(data.pagination.total_pages * limit);
      }
    } catch (err) {
      console.error("Failed to fetch artworks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const onPage = (event: any) => {
    const newPage = Math.floor(event.first / event.rows) + 1;
    setPage(newPage);
  };

  // -------------------------------------------------------------------
  // SELECTION HANDLERS
  // -------------------------------------------------------------------

  // Checkbox selection handler: Merges current page selection with global map
  const onSelectionChange = (e: { value: Artwork[] }) => {
    const newlySelected = new Set(e.value.map((r) => r.id));
    const currentRowsIds = new Set(rows.map((r) => r.id));

    setSelectedMap((prev) => {
      const updated = new Map(prev);

      // 1. Remove rows from the map that were on the current page and are now UNSELECTED
      rows.forEach((r) => {
        if (!newlySelected.has(r.id) && prev.has(r.id)) {
          updated.delete(r.id);
        }
      });

      // 2. Add all currently selected rows to the map
      e.value.forEach((r) => updated.set(r.id, r));

      return updated;
    });
  };

  // Handler for the new 'Select N Rows' feature
  const handleSelectSubmit = async () => {
    const numberToSelect = parseInt(inputNumber);

    if (isNaN(numberToSelect) || numberToSelect <= 0) {
      alert("Please enter a valid positive number!");
      return;
    }

    // Reset selection before bulk selecting
    setSelectedMap(new Map());
    
    let remainingToSelect = numberToSelect;
    let currentPageNumber = 1;
    let newSelectedRows: Artwork[] = [];

    // Loop through API pages to fetch and select rows
    while (remainingToSelect > 0) {
      const data: any = await fetchArtworks(currentPageNumber, rowsPerPage);

      if (!data || !data.data || data.data.length === 0) {
        break; // Stop if no more data
      }

      const pageArtworks = (data.data || [])
        .filter((d: any) => d.id)
        .map(mapToArtwork);

      const numberToTake = Math.min(remainingToSelect, pageArtworks.length);
      const rowsToAdd = pageArtworks.slice(0, numberToTake);

      newSelectedRows = newSelectedRows.concat(rowsToAdd);
      remainingToSelect -= numberToTake;
      currentPageNumber++;

      // Stop if we hit the end of total pages
      if (data.pagination && currentPageNumber > data.pagination.total_pages) {
        break;
      }
    }

    // Convert the collected array into a Map for state update
    const newSelectedMap = new Map(newSelectedRows.map(r => [r.id, r]));
    setSelectedMap(newSelectedMap);

    // After selection, load the first page to show the selection immediately
    // If the current page contains the first set of selected rows, they will be checked.
    setPage(1); 
    loadPage(1, rowsPerPage); 
    
    // Clear input and close panel
    setInputNumber("");
    if (overlayRef.current) {
      overlayRef.current.hide();
    }
  };


  // -------------------------------------------------------------------
  // RENDER COMPONENTS
  // -------------------------------------------------------------------

  // Custom Header for the Title column with the OverlayPanel
  const titleHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span>Title</span>
      <Button
        icon="pi pi-filter"
        rounded
        text
        severity="secondary"
        onClick={(e) => {
          if (overlayRef.current) {
            overlayRef.current.toggle(e);
          }
        }}
      />
      <OverlayPanel ref={overlayRef}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "150px",
          }}
        >
          <input
            type="number"
            placeholder="Enter rows to select..."
            value={inputNumber}
            onChange={(e) => setInputNumber(e.target.value)}
            style={{
              padding: "4px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <Button
            label="Select Rows"
            onClick={handleSelectSubmit}
            style={{ padding: "4px", fontSize: "14px" }}
          />
        </div>
      </OverlayPanel>
    </div>
  );

  const rowsPerPageOptions = [
    { label: "5", value: 5 },
    { label: "10", value: 10 },
    { label: "25", value: 25 },
    { label: "50", value: 50 },
  ];

  return (
    <div style={{ padding: "1rem" }}>
      <h3 style={{ marginBottom: "1rem" }}>Artworks</h3>

      <DataTable<Artwork[]> // Use the inferred type or cast if necessary in your environment
        value={rows}
        paginator
        lazy
        rows={rowsPerPage}
        totalRecords={totalRecords}
        first={(page - 1) * rowsPerPage}
        onPage={onPage}
        loading={loading}
        dataKey="id"
        removableSort
        selection={selectedOnPage} // Only show selected rows from current page
        onSelectionChange={onSelectionChange}
        selectionMode="checkbox"
        paginatorLeft={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label htmlFor="rowsPerPage">Rows per page:</label>
            <Dropdown
              id="rowsPerPage"
              value={rowsPerPage}
              options={rowsPerPageOptions}
              onChange={(e) => {
                setRowsPerPage(e.value);
                setPage(1);
              }}
              style={{ width: "80px" }}
            />
          </div>
        }
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />

        {/* 🔑 Custom header added here */}
        <Column field="title" header={titleHeader} /> 

        <Column field="place_of_origin" header="Place" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start" />
        <Column field="date_end" header="End" />
      </DataTable>
    </div>
  );
};

export default ArtworkTable;