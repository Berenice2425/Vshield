import fs from 'fs';
let content = fs.readFileSync('src/components/FleetManagement.tsx', 'utf8');
content = content.replace(
  /import \{ Car, Lock, Unlock, WifiOff, Plus, Edit2, Trash2, Loader2, AlertCircle \} from 'lucide-react';/g,
  "import { Car, Lock, Unlock, WifiOff, Plus, Edit2, Trash2, Loader2, AlertCircle, FileText, Upload, Download, ExternalLink } from 'lucide-react';"
);
fs.writeFileSync('src/components/FleetManagement.tsx', content);
