"use client";

import * as React from "react";
import { Download, FileText, FileTypePdf } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  exportToCsv,
  exportToPdf,
  exportCampaignsToCsv,
} from "./export";

interface ExportButtonProps {
  data: Array<{
    id: string;
    name: string;
    brandName: string;
    influencerName: string;
    status: string;
    budget: number;
    currency: string;
    startDate: string;
    endDate?: string;
    createdAt: string;
  }>;
  reportElementId?: string;
  reportTitle?: string;
  filename?: string;
}

export function ExportButton({
  data,
  reportElementId,
  reportTitle = "Campaign Report",
  filename = "callbacx-campaigns",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportCsv = () => {
    setIsExporting(true);
    exportCampaignsToCsv(data, filename);
    setTimeout(() => setIsExporting(false), 500);
  };

  const handleExportPdf = () => {
    if (!reportElementId) {
      console.error("No report element ID provided for PDF export");
      return;
    }
    exportToPdf(reportElementId, reportTitle);
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExportCsv}
        disabled={isExporting}
        className="flex items-center gap-2 text-sm font-medium"
        variant="outline"
        size="sm"
      >
        {isExporting ? (
          <Download className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Export Excel (CSV)</span>
      </Button>
      {reportElementId && (
        <Button
          onClick={handleExportPdf}
          className="flex items-center gap-2 text-sm font-medium"
          variant="outline"
          size="sm"
        >
          <FileTypePdf className="h-4 w-4" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>
      )}
    </div>
  );
}
