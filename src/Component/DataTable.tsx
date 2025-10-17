import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { fetchArtworks } from "./Api";
import { Dropdown } from "primereact/dropdown";
import { OverlayPanel } from "primereact/overlaypanel"; 
import { Button } from "primereact/button"; 

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string | null;
  artist_display: string | null;
  inscriptions: string | null;
  date_start: number | null;
  date_end: number | null;
}

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

  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState<number | undefined>(undefined);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedMap, setSelectedMap] = useState<Map<number, Artwork>>(new Map());

  const [inputNumber, setInputNumber] = useState("");
  const overlayRef = useRef<OverlayPanel>(null);

  const selectedOnPage = rows.filter((r) => selectedMap.has(r.id));

  
  const loadPage = async (p: number, limit: number) => {
    setLoading(true);
    try {
      const data: any = await fetchArtworks(p, limit);
      const mapped = (data.data || [])
        .filter((d: any) => d.id) 
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

 
  const onSelectionChange = (e: { value: Artwork[] }) => {
    const newlySelected = new Set(e.value.map((r) => r.id));

    setSelectedMap((prev) => {
      const updated = new Map(prev);

      
      rows.forEach((r) => {
        if (!newlySelected.has(r.id) && prev.has(r.id)) {
          updated.delete(r.id);
        }
      });

      e.value.forEach((r) => updated.set(r.id, r));

      return updated;
    });
  };

  const handleSelectSubmit = async () => {
    const numberToSelect = parseInt(inputNumber);

    if (isNaN(numberToSelect) || numberToSelect <= 0) {
      alert("Please enter a valid positive number!");
      return;
    }

    setSelectedMap(new Map());
    
    let remainingToSelect = numberToSelect;
    let currentPageNumber = 1;
    let newSelectedRows: Artwork[] = [];

    while (remainingToSelect > 0) {
      const data: any = await fetchArtworks(currentPageNumber, rowsPerPage);

      if (!data || !data.data || data.data.length === 0) {
        break;
      }

      const pageArtworks = (data.data || [])
        .filter((d: any) => d.id)
        .map(mapToArtwork);

      const numberToTake = Math.min(remainingToSelect, pageArtworks.length);
      const rowsToAdd = pageArtworks.slice(0, numberToTake);

      newSelectedRows = newSelectedRows.concat(rowsToAdd);
      remainingToSelect -= numberToTake;
      currentPageNumber++;

      if (data.pagination && currentPageNumber > data.pagination.total_pages) {
        break;
      }
    }

    const newSelectedMap = new Map(newSelectedRows.map(r => [r.id, r]));
    setSelectedMap(newSelectedMap);

   
    setPage(1); 
    loadPage(1, rowsPerPage); 
    
    setInputNumber("");
    if (overlayRef.current) {
      overlayRef.current.hide();
    }
  };



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

      <DataTable<Artwork[]> 
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
        selection={selectedOnPage} 
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