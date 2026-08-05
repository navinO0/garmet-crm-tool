"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Building, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { clientSchema } from '@/lib/validations/schemas';

export interface ClientData {
  clientId?: string;
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
  clientsList?: any[];
  onSelectClient?: (client: any) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  data,
  onChange,
  errors = {},
  clientsList = [],
  onSelectClient,
}) => {
  const getFieldError = (field: string) => errors[field];

  const [suggestedClients, setSuggestedClients] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Deduplicate clientsList to avoid duplicate suggestions or dropdown options
  const uniqueClients = React.useMemo(() => {
    const seen = new Set<string>();
    return (clientsList || []).filter((c) => {
      if (!c) return false;
      const key = `${c.id || ''}_${(c.name || '').toLowerCase().trim()}_${(c.mobileNumber || '').trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [clientsList]);

  // Filter suggestions whenever the name input changes
  useEffect(() => {
    if (!data.clientName || !uniqueClients || uniqueClients.length === 0) {
      setSuggestedClients([]);
      return;
    }
    const handler = setTimeout(() => {
      const query = data.clientName.toLowerCase();
      const matches = uniqueClients.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.businessName && c.businessName.toLowerCase().includes(query)) ||
          (c.mobileNumber && c.mobileNumber.includes(query))
      );
      setSuggestedClients(matches.slice(0, 6));
    }, 150);
    return () => clearTimeout(handler);
  }, [data.clientName, uniqueClients]);

  // Click-outside closes the dropdown — works on both desktop and mobile
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const handleSelectClient = useCallback((client: any) => {
    if (onSelectClient) onSelectClient(client);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, [onSelectClient]);

  return (
    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 sm:space-y-5">
      {uniqueClients && uniqueClients.length > 0 && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <label className="block text-[10px] sm:text-xs font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider">
            Quick Auto-Fill From Registered Client Profile
          </label>
          <select
            value={data.clientId || ""}
            onChange={(e) => {
              const selected = uniqueClients.find((c) => c.id === e.target.value);
              if (selected && onSelectClient) {
                onSelectClient(selected);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition cursor-pointer"
          >
            <option value="" disabled>-- Select Registered Client Profile --</option>
            {uniqueClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.businessName ? `(${c.businessName})` : ""} - {c.mobileNumber}
              </option>
            ))}
          </select>
        </div>
      )}
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
        {/* Client Name with autocomplete suggestions */}
        <div ref={containerRef} className="relative">
          <label className="block text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
            Client Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              required
              autoComplete="off"
              placeholder="e.g. Radhika Sharma"
              value={data.clientName}
              onChange={(e) => {
                onChange({ clientName: e.target.value });
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (data.clientName || suggestedClients.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className={`w-full pl-8 pr-2.5 py-2 bg-zinc-50 dark:bg-zinc-950 border ${
                getFieldError('clientName') || getFieldError('name')
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400'
              } rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition`}
            />
          </div>

          {/* Suggestions dropdown — uses onMouseDown+onTouchStart so it fires BEFORE blur on mobile */}
          {showSuggestions && suggestedClients.length > 0 && (
            <div className="absolute left-0 right-0 z-[100] top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-xl overflow-hidden">
              <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {suggestedClients.length} matching client{suggestedClients.length !== 1 ? 's' : ''}
                </div>
                {suggestedClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    // onMouseDown fires before onBlur on desktop
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent blur
                      handleSelectClient(client);
                    }}
                    // onTouchStart fires before onBlur on iOS Safari
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleSelectClient(client);
                    }}
                    className="w-full text-left px-3 py-3 sm:py-2.5 text-xs flex items-center justify-between gap-2 active:bg-indigo-50 dark:active:bg-indigo-950/30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{client.name}</p>
                      {client.businessName && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{client.businessName}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono shrink-0">{client.mobileNumber}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <Building className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. Radhe Couture"
              value={data.businessName}
              onChange={(e) => onChange({ businessName: e.target.value })}
              className="w-full pl-8 pr-2.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="tel"
              required
              placeholder="+91 9876543210"
              value={data.mobileNumber}
              onChange={(e) => onChange({ mobileNumber: e.target.value })}
              className={`w-full pl-8 pr-2.5 py-2 bg-zinc-50 dark:bg-zinc-950 border ${
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
            <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              placeholder="client@example.com"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className={`w-full pl-8 pr-2.5 py-2 bg-zinc-50 dark:bg-zinc-950 border ${
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
            <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <textarea
              rows={2}
              placeholder="Enter full business / billing address"
              value={data.address}
              onChange={(e) => onChange({ address: e.target.value })}
              className="w-full pl-8 pr-2.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
};


