import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Search, Filter, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReportDisplay from "@/components/ReportDisplay";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Report } from "@shared/schema";

const logoUrl = "/adsc-logo.png";

export default function UserDashboard() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [profitFilter, setProfitFilter] = useState<"all" | "profit" | "loss">("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
  });

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get today's data
  const todayDate = new Date().toISOString().split('T')[0];
  const todayReports = useMemo(() => {
    return reports.filter((report) => {
      const reportDate = new Date(report.date).toISOString().split('T')[0];
      return reportDate === todayDate;
    });
  }, [reports]);

  const todayTotals = useMemo(() => {
    if (todayReports.length === 0) {
      return { totalServices: 0, totalExpenses: 0, netProfit: 0 };
    }
    const totals = todayReports.reduce(
      (acc, report) => {
        acc.totalServices += parseFloat(report.totalServices.toString());
        acc.totalExpenses += parseFloat(report.totalExpenses.toString());
        acc.netProfit += parseFloat(report.netProfit.toString());
        return acc;
      },
      { totalServices: 0, totalExpenses: 0, netProfit: 0 }
    );
    return totals;
  }, [todayReports]);

  // Filtering logic for history
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const dateTxt = new Date(report.date).toLocaleDateString('en-IN');
        if (!dateTxt.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Date range filter
      if (startDate) {
        const reportDate = new Date(report.date).getTime();
        const filterDate = new Date(startDate).getTime();
        if (reportDate < filterDate) return false;
      }

      if (endDate) {
        const reportDate = new Date(report.date).getTime();
        const filterDate = new Date(endDate).getTime();
        if (reportDate > filterDate) return false;
      }

      // Profit/Loss filter
      if (profitFilter !== "all") {
        const netProfit = parseFloat(report.netProfit.toString());
        if (profitFilter === "profit" && netProfit < 0) return false;
        if (profitFilter === "loss" && netProfit >= 0) return false;
      }

      return true;
    });
  }, [reports, searchTerm, startDate, endDate, profitFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setProfitFilter("all");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logoUrl} alt="ADSC Logo" className="h-8 w-auto" />
              <div>
                <h1 className="text-2xl font-bold">Daily Dashboard</h1>
                <p className="text-sm text-muted-foreground">View your business performance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/history">
                <Button variant="outline" className="gap-2" size="sm">
                  <BarChart3 className="h-4 w-4" />
                  History
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Today's Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Services */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Services</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(todayTotals.totalServices)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {todayReports.length} report{todayReports.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>

            {/* Total Expenses */}
            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(todayTotals.totalExpenses)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {todayReports.length} report{todayReports.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-600 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>

            {/* Net Profit */}
            <Card className={`p-6 bg-gradient-to-br ${todayTotals.netProfit >= 0 
              ? 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' 
              : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Net Profit/Loss</p>
                  <p className={`text-3xl font-bold ${todayTotals.netProfit >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {formatCurrency(todayTotals.netProfit)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {todayTotals.netProfit >= 0 ? '📈 Profit' : '📉 Loss'}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${todayTotals.netProfit >= 0 ? 'bg-green-600' : 'bg-orange-600'} flex items-center justify-center`}>
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-8"></div>

        {/* Filters Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Historical Reports
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs"
            >
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Profit/Loss Filter */}
              <div>
                <label className="text-sm font-medium">Profit Status</label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={profitFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfitFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={profitFilter === "profit" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfitFilter("profit")}
                    className={profitFilter === "profit" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Profit
                  </Button>
                  <Button
                    variant={profitFilter === "loss" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfitFilter("loss")}
                    className={profitFilter === "loss" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Loss
                  </Button>
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="secondary"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Reports Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredReports.length} of {reports.length} reports
        </div>

        {/* Reports Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-2">No reports found</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || startDate || endDate || profitFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first report to get started"}
              </p>
            </Card>
          ) : (
            filteredReports.map((report) => {
              const netProfit = parseFloat(report.netProfit.toString());
              return (
                <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {formatDate(report.date)}
                      </h3>
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Services</p>
                          <p className="font-semibold text-blue-600">
                            {formatCurrency(report.totalServices)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expenses</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(report.totalExpenses)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Profit</p>
                          <p className={`font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(netProfit)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedReport(report)}
                      size="icon"
                      variant="outline"
                      className="ml-4"
                      title="View Report"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* View Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Report - {selectedReport && formatDate(selectedReport.date)}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <ReportDisplay
              report={{
                date: selectedReport.date,
                services: selectedReport.services || [],
                expenses: selectedReport.expenses || [],
              }}
              summary={{
                totalServices: parseFloat(selectedReport.totalServices.toString()),
                totalExpenses: parseFloat(selectedReport.totalExpenses.toString()),
                netProfit: parseFloat(selectedReport.netProfit.toString()),
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
