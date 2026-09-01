import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /res\.json\(dbVehicles\.map\(\(v: any\) => \(\{ id: v\._id, name: v\.name, plate_number: v\.plate_number, status: v\.status \}\)\)\);/g,
  'res.json(dbVehicles.map((v: any) => ({ id: v._id, name: v.name, plate_number: v.plate_number, status: v.status, documents: v.documents || [] })));'
);

content = content.replace(
  /res\.json\(\{ id: newVehicle\._id, name: newVehicle\.name, plate_number: newVehicle\.plate_number, status: newVehicle\.status \}\);/g,
  'res.json({ id: newVehicle._id, name: newVehicle.name, plate_number: newVehicle.plate_number, status: newVehicle.status, documents: newVehicle.documents || [] });'
);

content = content.replace(
  /res\.json\(\{ id: vehicle\._id, name: vehicle\.name, plate_number: vehicle\.plate_number, status: vehicle\.status \}\);/g,
  'res.json({ id: vehicle._id, name: vehicle.name, plate_number: vehicle.plate_number, status: vehicle.status, documents: vehicle.documents || [] });'
);

fs.writeFileSync('server.ts', content);
