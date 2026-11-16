"use client";

import React, { useState } from "react";
import {
  Building,
  Save,
  CheckCircle,
  FileText,
  Shield,
  Coins,
  Bell,
  Settings,
} from "lucide-react";

export default function OrganizationSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "EcoIntel Enterprise Systems",
    contactEmail: "sustainability@ecointel.org",
    defaultCurrency: "USD",
    reportFooterText: "EcoIntel Circular Electronics Dossier — Confidential & Verified.",
    logoUrl: "https://ecointel.org/brand/logo-mark.png",
    confidentialityNotice: "Strictly for internal circular supply chain planning and ESG audit filings.",
    impactMethodology: "GHG_PROTOCOL_SCOPE3",
    autoMintPassport: true,
    emailAlertsEnabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            Governance & Branding Configuration
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
            Organization Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure report branding, impact methodology standards, currency defaults, and automated passport minting.
          </p>
        </div>

        {saved && (
          <div className="bg-emerald-950/70 border border-emerald-800 rounded-xl p-4 flex items-center gap-2 text-xs text-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Organization settings saved successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Profile */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              General Organization Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Report Branding & Footer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Report Dossier Branding
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Logo URL (Included on PDF Headers)</label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Custom Report Footer</label>
                <input
                  type="text"
                  value={formData.reportFooterText}
                  onChange={(e) => setFormData({ ...formData, reportFooterText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Confidentiality Notice</label>
                <textarea
                  rows={2}
                  value={formData.confidentialityNotice}
                  onChange={(e) => setFormData({ ...formData, confidentialityNotice: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Financial & Methodology Defaults */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              Valuation & Carbon Standards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Default Valuation Currency</label>
                <select
                  value={formData.defaultCurrency}
                  onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Impact Accounting Standard</label>
                <select
                  value={formData.impactMethodology}
                  onChange={(e) => setFormData({ ...formData, impactMethodology: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="GHG_PROTOCOL_SCOPE3">GHG Protocol Scope 3 Corporate Standard</option>
                  <option value="ISO_14044">ISO 14044 Life Cycle Assessment</option>
                  <option value="EN_50625">CENELEC EN 50625 WEEE Compliance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
