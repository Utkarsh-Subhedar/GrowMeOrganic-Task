import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

type Customer = {
  id: number;
  name: string;
  country: {
    name: string;
    code: string;
  };
  company: string;
  date: string;
  status: string;
  verified: boolean;
  activity: number;
  representative: {
    name: string;
    image: string; // notice: you missed this field in type
  };
  balance: number;
};

// props type
type DataTableProps = {
  data: Customer[];
};

export default function PaginatorBasicDemo({ data }: DataTableProps) {
  return (
    <div>
      <DataTable
        value={data}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50]}
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column field="name" header="Name" style={{ width: "25%" }} />
        <Column field="country.name" header="Country" style={{ width: "25%" }} />
        <Column field="company" header="Company" style={{ width: "25%" }} />
        <Column field="representative.name" header="Representative" style={{ width: "25%" }} />
      </DataTable>
    </div>
  );
}
