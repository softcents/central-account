'use client';

import { useState, useEffect } from 'react';
import whmcsData from '@/data/whmcs_sync.json';

export interface ActiveClient {
  id: string;
  name: string;
  firstname: string;
  lastname: string;
  email: string;
  company: string;
  companyname: string;
  phonenumber: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  credit: string;
  status: string;
  customfields?: Record<string, string>;
  email_preferences?: any;
}

export function useActiveClient() {
  const [clientId, setClientId] = useState<string>('177');
  const [client, setClient] = useState<ActiveClient | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    let targetId: string | null = urlParams.get('impersonate') || urlParams.get('userid');

    // Check backup impersonator from admin session
    if (!targetId) {
      const storedImp = localStorage.getItem('ci_impersonator_backup');
      if (storedImp) {
        try {
          const parsed = JSON.parse(storedImp);
          targetId = String(parsed.targetUser?.whmcsId || parsed.targetUser?.id || '');
        } catch {}
      }
    }

    // Check auth_user
    if (!targetId) {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.whmcsId) {
            targetId = String(u.whmcsId);
          } else if (u.email) {
            const matched = (whmcsData?.clients || []).find(
              (c: any) => c.email && c.email.toLowerCase() === u.email.toLowerCase()
            );
            if (matched) {
              targetId = String(matched.id);
            }
          }
        } catch {}
      }
    }

    // Default fallback to 177 (Softcents Enterprise)
    if (!targetId) {
      targetId = '177';
    }

    const matchedClient = (whmcsData?.clients || []).find(
      (c: any) => String(c.id) === String(targetId) || String(c.whmcsId) === String(targetId)
    );

    if (matchedClient) {
      setClientId(String(matchedClient.id));
      setClient(matchedClient as ActiveClient);
    } else {
      const fallback = (whmcsData?.clients || []).find((c: any) => String(c.id) === '177') || (whmcsData?.clients || [])[0];
      if (fallback) {
        setClientId(String(fallback.id));
        setClient(fallback as ActiveClient);
      }
    }

    setIsLoaded(true);
  }, []);

  const impQuery = clientId ? `?impersonate=${encodeURIComponent(clientId)}` : '';

  // STRICTLY filtered client data - NEVER falls back to all data if length === 0
  const allServices = (whmcsData?.services || []) as any[];
  const services = allServices.filter((s: any) => String(s.userid) === String(clientId));
  const activeServices = services.filter((s: any) => (s.domainstatus || '').toLowerCase() === 'active');

  const allDomains = (whmcsData?.domains || []) as any[];
  const domains = allDomains.filter((d: any) => String(d.userid) === String(clientId));

  const allInvoices = (whmcsData?.invoices || []) as any[];
  const invoices = allInvoices.filter((inv: any) => String(inv.userid) === String(clientId));
  const unpaidInvoices = invoices.filter((inv: any) => (inv.status || '').toLowerCase() === 'unpaid');

  const allTickets = (whmcsData?.tickets || []) as any[];
  const tickets = allTickets.filter((t: any) => String(t.userid) === String(clientId));
  const openTickets = tickets.filter((t: any) => (t.status || '').toLowerCase() !== 'closed');

  const allQuotes = (whmcsData?.quotes || []) as any[];
  const quotes = allQuotes.filter((q: any) => String(q.userid) === String(clientId));

  const allOrders = (whmcsData?.orders || []) as any[];
  const orders = allOrders.filter((o: any) => String(o.userid) === String(clientId));

  return {
    clientId,
    client,
    impQuery,
    services,
    activeServices,
    domains,
    invoices,
    unpaidInvoices,
    tickets,
    openTickets,
    quotes,
    orders,
    isLoaded,
  };
}
