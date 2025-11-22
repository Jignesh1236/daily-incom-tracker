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
    <div className="max-w-4xl mx-auto bg-background print:bg-white p-6 print:p-1 print-report-container">
      <ReportHeader date={report.date} />

      <div className="space-y-6 print:space-y-1">
        <div className="hidden print:block">
          <table className={`w-full border-2 border-gray-800 ${getTableSizeClass()}`}>
            <thead>
              <tr>
                <th className="text-left px-2 py-1 font-bold border-r-2 border-gray-800 print:text-xs">Service Name</th>
                <th className="text-right px-2 py-1 font-bold border-r-2 border-gray-800 w-24 print:text-xs">Amount</th>
                <th className="text-left px-2 py-1 font-bold border-r-2 border-gray-800 print:text-xs">Expense Name</th>
                <th className="text-right px-2 py-1 font-bold w-24 print:text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }).map((_, index) => {
                const service = report.services[index];
                const expense = report.expenses[index];
                return (
                  <tr key={index}>
                    <td className="px-2 py-0.5 border-r print:text-xs">{service?.name || ''}</td>
                    <td className="px-2 py-0.5 text-right border-r font-medium print:text-xs">{service ? formatCurrency(service.amount) : ''}</td>
                    <td className="px-2 py-0.5 border-r print:text-xs">{expense?.name || ''}</td>
                    <td className="px-2 py-0.5 text-right font-medium print:text-xs">{expense ? formatCurrency(expense.amount) : ''}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-300 font-bold">
                <td className="px-2 py-1 font-bold uppercase tracking-wide print:text-xs">Total Srvc</td>
                <td className="px-2 py-1 text-right font-bold print:text-xs">{formatCurrency(summary.totalServices)}</td>
                <td className="px-2 py-1 font-bold uppercase tracking-wide print:text-xs">Total Exp</td>
                <td className="px-2 py-1 text-right font-bold print:text-xs">{formatCurrency(summary.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-2 p-2 bg-gray-200 border-2 border-gray-800 rounded-lg print:mt-1 print:p-1.5">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold uppercase tracking-wide print:text-sm">Net Profit:</span>
              <span className={`text-xl font-bold print:text-lg ${summary.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
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

        <Card className="p-4 border-2 print:shadow-none summary-box">
          <h2 className="text-xl font-bold mb-4 text-foreground print:text-black uppercase tracking-wide">Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b print:text-black print:border-gray-300 print:pb-1">
              <span className="font-medium print:text-sm">Total Services Revenue</span>
              <span className="font-semibold print:text-sm">{formatCurrency(summary.totalServices)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b print:text-black print:border-gray-300 print:pb-1">
              <span className="font-medium print:text-sm">Online Payment</span>
              <span className="font-semibold print:text-sm text-green-600 print:text-green-700">{formatCurrency(summary.onlinePayment)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b print:text-black print:border-gray-300 print:pb-1">
              <span className="font-medium print:text-sm">Total Expenses</span>
              <span className="font-semibold print:text-sm">{formatCurrency(summary.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 print:pt-2 print:border-t print:border-gray-400">
              <span className="text-xl font-bold print:text-black print:text-base">Net Profit</span>
              <span
                className={`text-xl font-bold print:text-base ${summary.netProfit >= 0 ? 'text-green-600 print:text-green-700' : 'text-destructive print:text-red-700'}`}
                data-testid="text-net-profit"
              >
                {formatCurrency(summary.netProfit)}
              </span>
            </div>
          </div>
        </Card>

        <div className="mt-4 print:mt-2 pt-4 print:pt-2 border-t-2 border-gray-300 print:border-gray-800">
          <div className="space-y-2 print:space-y-0">
            <div className="flex justify-between gap-2 print:gap-1">
              {/* Operator Signature */}
              <div className="flex-1 text-center">
                <div className="print:h-10 h-12"></div>
                <div className="border-t-2 border-gray-800 print:border-t-2"></div>
                <p className="text-xs font-semibold text-foreground print:text-black print:text-xs mt-0.5 print:mt-0.5">Operator Sign</p>
                <p className="text-xs text-muted-foreground print:text-gray-700 mt-0 print:mt-0 operator-signature-name">&nbsp;</p>
                <p className="text-xs text-muted-foreground print:text-gray-600 mt-0 print:mt-0 print:text-xs">Name/Date</p>
              </div>

              {/* Authorized Signature */}
              <div className="flex-1 text-center">
                <div className="print:h-10 h-12"></div>
                <div className="border-t-2 border-gray-800 print:border-t-2"></div>
                <p className="text-xs font-semibold text-foreground print:text-black print:text-xs mt-0.5 print:mt-0.5">Auth Sign (ADSC)</p>
                <p className="text-xs text-muted-foreground print:text-gray-700 mt-0 print:mt-0">&nbsp;</p>
                <p className="text-xs text-muted-foreground print:text-gray-600 mt-0 print:mt-0 print:text-xs">Name/Date</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden print:block print-footer mt-1 print:mt-1 pt-1 print:pt-0.5 border-t border-gray-400 text-center">
          <p className="text-xs print:text-xs text-gray-600 print:text-gray-700">{new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p className="text-xs text-gray-600 mt-0 print:mt-0 print:text-xs">Aaishree Data Service Center</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MemoizedReportDisplay);