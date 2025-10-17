import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { fetchArtworks } from "./Api"; 
interface Artwork {
  id: number;
  title: string;
  place_of_origin: string | null;
  artist_display: string | null;
  inscriptions: string | null;
  date_start: number | null;
  date_end: number | null;
}

const ArtworkTable: React.FC = () => {
  const [rows, setRows] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);

  const [inputNumber, setInputNumber] = useState("");
  const overlayRef = useRef<OverlayPanel>(null);

  const rowsPerPageOptions = [
    { label: "5", value: 5 },
    { label: "10", value: 10 },
    { label: "25", value: 25 },
    { label: "50", value: 50 },
  ];

  async function loadPageData(pageNumber: number, limit: number) {
    setLoading(true);
    try {
      const data: any = await fetchArtworks(pageNumber, limit);
      const allArtworks: Artwork[] = [];

      if (data && data.data && Array.isArray(data.data)) {
        for (let i = 0; i < data.data.length; i++) {
          const item = data.data[i];
          const art: Artwork = {
            id: item.id,
            title: item.title,
            place_of_origin: item.place_of_origin,
            artist_display: item.artist_display,
            inscriptions: item.inscriptions,
            date_start: item.date_start,
            date_end: item.date_end,
          };
          allArtworks.push(art);
        }
      }

      setRows(allArtworks);

      if (data.pagination && data.pagination.total) {
        setTotalRecords(data.pagination.total);
      } else if (data.pagination && data.pagination.total_pages) {
        setTotalRecords(data.pagination.total_pages * limit);
      }
    } catch (error) {
      console.log("Something went wrong while fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData(page, rowsPerPage);
  }, [page, rowsPerPage]);

  function handlePageChange(event: any) {
    const newPage = Math.floor(event.first / event.rows) + 1;
    setPage(newPage);
  }

  function handleSelectionChange(event: any) {
    const newSelection = event.value;
    setSelectedRows(newSelection);
  }

  async function handleSelectSubmit() {
    const numberEntered = parseInt(inputNumber);

    if (isNaN(numberEntered) || numberEntered <= 0) {
      alert("Please enter a valid positive number!");
      return;
    }

    let remainingRowsToSelect = numberEntered;
    let currentPageNumber = 1;
    let newlySelectedRows: Artwork[] = [];

    while (remainingRowsToSelect > 0) {
      const data: any = await fetchArtworks(currentPageNumber, rowsPerPage);

      if (!data || !data.data || data.data.length === 0) {
        break;
      }

      const pageArtworks: Artwork[] = [];

      for (let i = 0; i < data.data.length; i++) {
        const item = data.data[i];
        const art: Artwork = {
          id: item.id,
          title: item.title,
          place_of_origin: item.place_of_origin,
          artist_display: item.artist_display,
          inscriptions: item.inscriptions,
          date_start: item.date_start,
          date_end: item.date_end,
        };
        pageArtworks.push(art);
      }

      const numberToTake = Math.min(remainingRowsToSelect, pageArtworks.length);
      const rowsToAdd = pageArtworks.slice(0, numberToTake);
      newlySelectedRows = newlySelectedRows.concat(rowsToAdd);

      remainingRowsToSelect = remainingRowsToSelect - numberToTake;
      currentPageNumber = currentPageNumber + 1;

      if (
        data.pagination &&
        currentPageNumber > data.pagination.total_pages
      ) {
        break;
      }
    }

    setSelectedRows(newlySelectedRows);

    if (overlayRef.current) {
      overlayRef.current.hide();
    }
  }

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
            placeholder="Enter rows..."
            value={inputNumber}
            onChange={(e) => setInputNumber(e.target.value)}
            style={{
              padding: "4px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <Button
            label="Submit"
            onClick={handleSelectSubmit}
            style={{ padding: "4px", fontSize: "14px" }}
          />
        </div>
      </OverlayPanel>
    </div>
  );

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Artworks Table</h2>

      <DataTable
        value={rows}
        selection={selectedRows}
        onSelectionChange={handleSelectionChange}
        dataKey="id"
        paginator
        lazy
        loading={loading}
        totalRecords={totalRecords}
        first={(page - 1) * rowsPerPage}
        rows={rowsPerPage}
        onPage={handlePageChange}
        removableSort
        paginatorLeft={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3rem" }}
        ></Column>
        <Column field="title" header={titleHeader}></Column>
        <Column field="place_of_origin" header="Place"></Column>
        <Column field="artist_display" header="Artist"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Start"></Column>
        <Column field="date_end" header="End"></Column>
      </DataTable>

      <div style={{ marginTop: "1rem" }}>
        <strong>Selected Artworks:</strong>{" "}
        {selectedRows.length > 0 ? (
          <span>
            {selectedRows.map((art) => art.title).join(", ")}
          </span>
        ) : (
          <span>None</span>
        )}
      </div>
    </div>
  );
};

export default ArtworkTable;
