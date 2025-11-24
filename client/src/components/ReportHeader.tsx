import React from "react";
import { Link } from "wouter";

interface ReportHeaderProps {
  date: string;
}

const logoUrl = "/adsc-logo-alt.png";

const ReportHeader = ({ date }: ReportHeaderProps) => {
  return (
    <div className="mb-6 border-b-2 border-border print:border-b print:border-gray-800 pb-4 print:pb-1 print:mb-0.5">
      <div className="flex items-start justify-between gap-6 print:gap-2">
        <div className="flex items-center gap-4">
          <Link href="/">
            <img src={logoUrl} alt="ADSC Logo" className="h-14 w-auto print:h-8 cursor-pointer hover:opacity-80 transition-opacity print:cursor-auto print:hover:opacity-100" data-testid="img-logo" />
          </Link>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-foreground print:text-black print:text-sm print:mb-0" data-testid="text-company-name">
            Aaishree Data Service Center
          </h1>
          <p className="text-sm text-muted-foreground print:text-gray-700 print:text-[10px] mt-1 print:mt-0" data-testid="text-tagline">
            Daily Business Report
          </p>
        </div>

        <div className="text-right print:border-l print:border-gray-400 print:pl-2">
          <p className="text-xs font-medium text-muted-foreground print:text-gray-600 print:text-[8px]">Report Date</p>
          <p className="text-base font-semibold text-foreground print:text-black print:text-[9px] print:font-semibold print:mt-0" data-testid="text-report-date">
            {new Date(date).toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReportHeader);