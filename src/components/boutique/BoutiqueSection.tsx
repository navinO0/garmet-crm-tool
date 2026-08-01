"use client";

import React from 'react';
import NewOrderPage from '@/app/orders/new/page';
import { Scissors } from 'lucide-react';

export const BoutiqueSection: React.FC = () => {
  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <NewOrderPage />
      </div>
    </div>
  );
};
