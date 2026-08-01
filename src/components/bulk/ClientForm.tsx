"use client";

import React from 'react';
import { User, Building, Phone, Mail, MapPin } from 'lucide-react';
import { clientSchema } from '@/lib/validations/schemas';

export interface ClientData {
  clientName: string;
  businessName: string;
  mobileNumber: string;
  email: string;
  address: string;
}

interface ClientFormProps {
  data: ClientData;
  onChange: (updated: Partial<ClientData>) => void;
  errors?: Record<string, string>;
}

export const ClientForm: React.FC<ClientFormProps> = ({ data, onChange, errors = {} }) => {
  const getFieldError = (field: string) => errors[field];

  return (
    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 sm:space-y-5">
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <User className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          Client & Business Information
        </h3>
        <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Enter verified client details for contract generation and invoicing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
        <div>
          <label className="block text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
            Client Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <input
              type="text"
              required
              placeholder="e.g. Radhika Sharma"
              value={data.clientName}
              onChange={(e) => onChange({ clientName: e.target.value })}
              className={`w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border ${
                getFieldError('clientName') || getFieldError('name')
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400'
              } rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition`}
            />
          </div>
          {(getFieldError('clientName') || getFieldError('name')) && (
            <p className="text-[10px] text-red-500 mt-0.5 font-medium">
              {getFieldError('clientName') || getFieldError('name')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
            Business Name
          </label>
          <div className="relative">
            <Building className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="e.g. Radhe Couture"
              value={data.businessName}
              onChange={(e) => onChange({ businessName: e.target.value })}
              className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <input
              type="tel"
              required
              placeholder="+91 9876543210"
              value={data.mobileNumber}
              onChange={(e) => onChange({ mobileNumber: e.target.value })}
              className={`w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border ${
                getFieldError('mobileNumber')
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400'
              } rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition`}
            />
          </div>
          {getFieldError('mobileNumber') && (
            <p className="text-[10px] text-red-500 mt-0.5 font-medium">{getFieldError('mobileNumber')}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <input
              type="email"
              placeholder="client@example.com"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className={`w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border ${
                getFieldError('email')
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400'
              } rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition`}
            />
          </div>
          {getFieldError('email') && (
            <p className="text-[10px] text-red-500 mt-0.5 font-medium">{getFieldError('email')}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
            Address
          </label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <textarea
              rows={2}
              placeholder="Enter full business / billing address"
              value={data.address}
              onChange={(e) => onChange({ address: e.target.value })}
              className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
