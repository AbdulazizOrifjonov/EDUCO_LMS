import React from 'react';
import Card from '@/components/ui/Card';

export default function GenericModulePage({ moduleName = 'Module', role = 'User' }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {moduleName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {role} • {moduleName} overview and management
          </p>
        </div>
      </div>

      <Card>
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
            {moduleName} Interface Ready
          </p>
          <p className="text-sm">
            This module is connected to the {role} workspace router.
          </p>
        </div>
      </Card>
    </div>
  );
}
