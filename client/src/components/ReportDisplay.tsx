import React from "react";
import { Card } from "@/components/ui/card";
import type { DailyReport, ReportSummary } from "@shared/schema";
import ReportHeader from "./ReportHeader";

interface ReportDisplayProps {
  report: DailyReport;
  summary: ReportSummary;
}

const MemoizedReportDisplay = ({ report, summary }: ReportDisplayProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const maxRows = Math.max(report.services.length, report.expenses.length);

  // Determine table size class based on row count - more aggressive sizing
  const getTableSizeClass = () => {
    if (maxRows > 35) return 'ultra-compact-print';
    if (maxRows > 25) return 'very-compact-print';
    if (maxRows > 15) return 'compact-print';
    if (maxRows > 10) return 'medium-compact-print';
    return '';
  };

  return (
    <div className="max-w-4xl mx-auto bg-background print:bg-white p-6 print:p-0 print-report-container">
      <ReportHeader date={report.date} />

      <div className="space-y-6 print:space-y-0.5">
        <div className="hidden print:block">
          <table className={`w-full border-2 border-gray-800 ${getTableSizeClass()}`}>
            <thead>
              <tr>
                <th className="text-left px-1 py-0.5 font-bold border-r-2 border-gray-800 print:text-[10px]">Service Name</th>
                <th className="text-right px-1 py-0.5 font-bold border-r-2 border-gray-800 w-20 print:text-[10px]">Amount</th>
                <th className="text-left px-1 py-0.5 font-bold border-r-2 border-gray-800 print:text-[10px]">Expense Name</th>
                <th className="text-right px-1 py-0.5 font-bold w-20 print:text-[10px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }).map((_, index) => {
                const service = report.services[index];
                const expense = report.expenses[index];
                return (
                  <tr key={index}>
                    <td className="px-1 py-0 border-r print:text-[9px]">{service?.name || ''}</td>
                    <td className="px-1 py-0 text-right border-r font-medium print:text-[9px]">{service ? formatCurrency(service.amount) : ''}</td>
                    <td className="px-1 py-0 border-r print:text-[9px]">{expense?.name || ''}</td>
                    <td className="px-1 py-0 text-right font-medium print:text-[9px]">{expense ? formatCurrency(expense.amount) : ''}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-300 font-bold">
                <td className="px-1 py-0.5 font-bold uppercase print:text-[10px]">Total Srvc</td>
                <td className="px-1 py-0.5 text-right font-bold print:text-[10px]">{formatCurrency(summary.totalServices)}</td>
                <td className="px-1 py-0.5 font-bold uppercase print:text-[10px]">Total Exp</td>
                <td className="px-1 py-0.5 text-right font-bold print:text-[10px]">{formatCurrency(summary.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-1 p-1 bg-gray-200 border-2 border-gray-800 print:mt-0.5 print:p-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase print:text-[11px]">Net Profit:</span>
              <span className={`text-base font-bold print:text-[11px] ${summary.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(summary.netProfit)}
              </span>
            </div>
          </div>
        </div>

        <div className="print:hidden space-y-6">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wide mb-3 text-foreground print:text-black print:text-sm border-b-2 border-primary print:border-b print:border-gray-400 pb-2 print:pb-1 print:mb-2">
              Services Rendered
            </h2>
            {report.services.length > 0 ? (
              <div className="border rounded-md overflow-hidden print:rounded-none">
                <table className="w-full text-sm">
                  <thead className="bg-muted print:bg-white">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold print:text-black">Service Name</th>
                      <th className="text-right px-3 py-2 font-semibold print:text-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.services.filter(service => service.name.trim() !== '').map((service, index) => (
                      <tr
                        key={service.id}
                        className={index % 2 === 0 ? 'bg-background print:bg-white' : 'bg-muted/30 print:bg-white'}
                        data-testid={`row-service-${index}`}
                      >
                        <td className="px-3 py-2 print:text-black" data-testid={`text-service-name-${index}`}>
                          {service.name}
                        </td>
                        <td className="px-3 py-2 text-right font-medium print:text-black" data-testid={`text-service-amount-${index}`}>
                          {formatCurrency(service.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 bg-muted/50 print:bg-white total-row">
                      <td className="px-3 py-2 font-bold print:text-black">Total</td>
                      <td className="px-3 py-2 text-right font-bold print:text-black" data-testid="text-total-services">
                        {formatCurrency(summary.totalServices)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-3 print:text-black print:text-xs">No services recorded</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold uppercase tracking-wide mb-3 text-foreground print:text-black print:text-sm border-b-2 border-destructive print:border-b print:border-gray-400 pb-2 print:pb-1 print:mb-2">
              Expenses
            </h2>
            {report.expenses.length > 0 ? (
              <div className="border rounded-md overflow-hidden print:rounded-none">
                <table className="w-full text-sm">
                  <thead className="bg-muted print:bg-white">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold print:text-black">Expense Name</th>
                      <th className="text-right px-3 py-2 font-semibold print:text-black">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.expenses.map((expense, index) => (
                      <tr
                        key={expense.id}
                        className={index % 2 === 0 ? 'bg-background print:bg-white' : 'bg-muted/30 print:bg-white'}
                        data-testid={`row-expense-${index}`}
                      >
                        <td className="px-3 py-2 print:text-black" data-testid={`text-expense-name-${index}`}>
                          {expense.name}
                        </td>
                        <td className="px-3 py-2 text-right font-medium print:text-black" data-testid={`text-expense-amount-${index}`}>
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 bg-muted/50 print:bg-white total-row">
                      <td className="px-3 py-2 font-bold print:text-black">Total</td>
                      <td className="px-3 py-2 text-right font-bold print:text-black" data-testid="text-total-expenses">
                        {formatCurrency(summary.totalExpenses)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-3 print:text-black print:text-xs">No expenses recorded</p>
            )}
          </div>
        </div>

        <Card className="p-3 border-2 print:shadow-none print:p-1.5 summary-box">
          <h2 className="text-lg font-bold mb-2 text-foreground print:text-black uppercase print:text-xs">Summary</h2>
          <div className="space-y-1.5 print:space-y-1">
            <div className="flex justify-between items-center pb-1 border-b print:text-black print:border-gray-300 print:pb-0.5">
              <span className="font-medium print:text-[10px]">Total Services Revenue</span>
              <span className="font-semibold print:text-[10px]">{formatCurrency(summary.totalServices)}</span>
            </div>
            <div className="flex justify-between items-center pb-1 border-b print:text-black print:border-gray-300 print:pb-0.5">
              <span className="font-medium print:text-[10px]">Online Payment</span>
              <span className="font-semibold print:text-[10px] text-green-600 print:text-green-700">{formatCurrency(summary.onlinePayment)}</span>
            </div>
            <div className="flex justify-between items-center pb-1 border-b print:text-black print:border-gray-300 print:pb-0.5">
              <span className="font-medium print:text-[10px]">Cash Payment</span>
              <span className="font-semibold print:text-[10px] text-blue-600 print:text-blue-700">{formatCurrency(summary.cashPayment)}</span>
            </div>
            <div className="flex justify-between items-center pb-1 border-b print:text-black print:border-gray-300 print:pb-0.5">
              <span className="font-medium print:text-[10px]">Total Expenses</span>
              <span className="font-semibold print:text-[10px]">{formatCurrency(summary.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 print:pt-0.5 print:border-t print:border-gray-400">
              <span className="text-base font-bold print:text-black print:text-[11px]">Net Profit</span>
              <span
                className={`text-base font-bold print:text-[11px] ${summary.netProfit >= 0 ? 'text-green-600 print:text-green-700' : 'text-destructive print:text-red-700'}`}
                data-testid="text-net-profit"
              >
                {formatCurrency(summary.netProfit)}
              </span>
            </div>
          </div>
        </Card>

        <div className="mt-2 print:mt-1 pt-2 print:pt-1 border-t-2 border-gray-300 print:border-gray-800">
          <div className="space-y-1 print:space-y-0">
            <div className="flex justify-between gap-2 print:gap-1">
              {/* Operator Signature */}
              <div className="flex-1 text-center">
                <div className="print:h-6 h-8"></div>
                <div className="border-t-2 border-gray-800 print:border-t-1"></div>
                <p className="text-xs font-semibold text-foreground print:text-black print:text-[8px] mt-0.5 print:mt-0">Operator</p>
                <p className="text-xs text-muted-foreground print:text-gray-700 mt-0 print:mt-0 operator-signature-name print:text-[8px]">&nbsp;</p>
              </div>

              {/* Authorized Signature */}
              <div className="flex-1 text-center">
                <div className="print:h-6 h-8"></div>
                <div className="border-t-2 border-gray-800 print:border-t-1"></div>
                <p className="text-xs font-semibold text-foreground print:text-black print:text-[8px] mt-0.5 print:mt-0">Auth (ADSC)</p>
                <p className="text-xs text-muted-foreground print:text-gray-700 mt-0 print:mt-0 print:text-[8px]">&nbsp;</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden print:block print-footer mt-0.5 print:mt-0.5 pt-0.5 print:pt-0.5 border-t border-gray-400 text-center">
          <p className="text-xs print:text-[8px] text-gray-600 print:text-gray-700">{new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p className="text-xs text-gray-600 mt-0 print:mt-0 print:text-[8px]">ADSC</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MemoizedReportDisplay);