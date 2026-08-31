import React from 'react';
import { Car, Lock, Unlock, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Vehicle {
  id: number;
  name: string;
  plate_number: string;
  status: string;
}

interface VehicleListProps {
  vehicles: Vehicle[];
}

export default function VehicleList({ vehicles }: VehicleListProps) {
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Armed': return 'bg-emerald-100 text-emerald-700';
      case 'Driving': return 'bg-blue-100 text-blue-700';
      case 'Immobilized': return 'bg-red-100 text-red-700';
      case 'Offline': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Armed': return <Lock className="w-4 h-4 mr-1" />;
      case 'Driving': return <Unlock className="w-4 h-4 mr-1" />;
      case 'Immobilized': return <Lock className="w-4 h-4 mr-1" />;
      case 'Offline': return <WifiOff className="w-4 h-4 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
      <div className="p-6 border-b border-emerald-50">
        <h2 className="text-lg font-bold text-gray-900">Fleet Overview</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-emerald-50/50 text-emerald-800 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Vehicle</th>
              <th className="px-6 py-4 font-medium">Plate Number</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No vehicles found in your fleet.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Car className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="font-medium text-gray-900">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{v.plate_number}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(v.status)}`}>
                      {getStatusIcon(v.status)}
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/fleet?vehicleId=${v.id}`}
                      className="text-emerald-600 hover:text-emerald-800 font-medium text-sm transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
