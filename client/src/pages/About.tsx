import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  FileText,
  BarChart3,
  Save,
  Printer,
  Lock,
  TrendingUp,
  Download,
  GitCompare,
  Target,
  Tag,
  Star,
  Keyboard,
  Moon,
  Sun,
  Database,
  Shield,
  Users,
  Activity,
  Zap,
  Home,
  ArrowRight
} from "lucide-react";

export default function About() {
  const features = [
    {
      icon: FileText,
      title: "Report Generation",
      description: "Create detailed daily business reports with services and expenses",
      color: "text-blue-600"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Interactive charts for revenue trends, profit analysis, and performance metrics",
      color: "text-green-600"
    },
    {
      icon: Save,
      title: "Template Manager",
      description: "Save and load frequently used service/expense combinations for quick reuse",
      color: "text-purple-600"
    },
    {
      icon: Printer,
      title: "Print-Ready Reports",
      description: "Professional A4-optimized reports with customizable operator names",
      color: "text-orange-600"
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Export reports in CSV, JSON, and PDF formats for external analysis",
      color: "text-indigo-600"
    },
    {
      icon: GitCompare,
      title: "Report Comparison",
      description: "Compare two reports side-by-side with visual difference indicators",
      color: "text-pink-600"
    },
    {
      icon: Target,
      title: "Goals & Targets",
      description: "Set and track daily, weekly, or monthly profit goals with progress tracking",
      color: "text-cyan-600"
    },
    {
      icon: Tag,
      title: "Expense Categories",
      description: "Automatic categorization of expenses with pie chart visualization",
      color: "text-amber-600"
    },
    {
      icon: Star,
      title: "Favorite Reports",
      description: "Mark important reports as favorites for quick access",
      color: "text-yellow-600"
    },
    {
      icon: Database,
      title: "Backup & Restore",
      description: "Complete data backup and restore functionality for reports and templates",
      color: "text-teal-600"
    },
    {
      icon: Keyboard,
      title: "Keyboard Shortcuts",
      description: "Enhance productivity with keyboard shortcuts (Ctrl+G for calculator)",
      color: "text-red-600"
    },
    {
      icon: Shield,
      title: "Admin Dashboard",
      description: "Protected admin area for managing reports, users, and viewing activity logs",
      color: "text-violet-600"
    }
  ];

  const technologies = [
    { category: "Frontend", items: ["React 18", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui"] },
    { category: "Backend", items: ["Express.js", "Node.js", "Passport.js Authentication"] },
    { category: "Database", items: ["MongoDB", "Zod Validation"] },
    { category: "UI Components", items: ["Radix UI", "Recharts", "Lucide Icons", "Framer Motion"] },
    { category: "Tools", items: ["React Hook Form", "TanStack Query", "jsPDF", "Wouter Router"] }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg">
            <FileText className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Aaishree Data Service Center
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Daily Report Management System
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Zap className="h-3 w-3 mr-1" />
              Fast & Efficient
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Lock className="h-3 w-3 mr-1" />
              Secure
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Users className="h-3 w-3 mr-1" />
              User Friendly
            </Badge>
          </div>
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go to Home
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              About This Application
            </CardTitle>
            <CardDescription className="text-base">
              A comprehensive business management solution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p className="text-lg leading-relaxed">
              Aaishree Data Service Center is a full-stack TypeScript application designed to streamline
              the process of generating, managing, and analyzing daily business reports. Built with modern
              web technologies, it provides a powerful yet intuitive interface for businesses to track
              their services, expenses, and profitability.
            </p>
            <p className="leading-relaxed">
              The application allows users to input services and expenses, create formatted reports, and
              offers advanced features like printing, saving, template management, and comprehensive analytics.
              With built-in admin authentication, role-based access control, and activity logging, it ensures
              secure and efficient business operations.
            </p>
            <p className="leading-relaxed">
              Whether you're tracking daily transactions, analyzing monthly trends, or comparing performance
              across different time periods, this application provides all the tools you need in one
              streamlined platform.
            </p>
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-xl transition-shadow duration-300 border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600`}>
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Additional Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  User Management
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Role-based access control (Admin, Manager, Employee)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Secure password management with hashing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Activity logging for audit trails</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>User activation and deactivation controls</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Analytics & Insights
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Revenue vs Expenses trend visualization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Monthly and daily profit analysis charts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Top services and expense breakdown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Performance metrics and KPIs</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Moon className="h-5 w-5 text-purple-600" />
                  User Experience
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Dark and light theme support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Responsive design for all devices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Real-time filter and search results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Intuitive and modern UI components</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Security Features
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Passport.js authentication with sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Helmet.js for security headers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Protected admin routes and endpoints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Data validation with Zod schemas</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Technology Stack</CardTitle>
            <CardDescription>
              Built with modern, production-ready technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {technologies.map((tech, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                    {tech.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tech.items.map((item, idx) => (
                      <Badge key={idx} variant="outline" className="px-3 py-1">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  {index < technologies.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Start creating and managing your daily business reports with our comprehensive
                platform. Track your progress, analyze trends, and make data-driven decisions.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Link href="/">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Create Report
                  </Button>
                </Link>
                <Link href="/history">
                  <Button size="lg" variant="outline" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                    <BarChart3 className="h-4 w-4" />
                    View History
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>© 2024 Aaishree Data Service Center. All rights reserved.</p>
          <p className="mt-2">
            Built by{" "}
            <a 
              href="https://github.com/Jignesh1236" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Jignesh D Maru
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
