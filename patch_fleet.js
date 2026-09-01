import fs from 'fs';

let content = fs.readFileSync('src/components/FleetManagement.tsx', 'utf8');

const vehicleInterface = `export interface VehicleDocument {
  blobId: string;
  fileName: string;
  category: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  status: string;
  documents?: VehicleDocument[];
}`;

content = content.replace(
  /interface Vehicle \{\n  id: string;\n  name: string;\n  plate_number: string;\n  status: string;\n\}/g,
  vehicleInterface
);

fs.writeFileSync('src/components/FleetManagement.tsx', content);
