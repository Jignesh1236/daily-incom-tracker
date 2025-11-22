import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, History as HistoryIcon, Trash2, Target } from "lucide-react";

interface QuickCalculatorProps {
  onClose: () => void;
}

interface HistoryItem {
  id: string;
  calculation: string;
  result: string;
  timestamp: Date;
}

function QuickCalculator({ onClose }: QuickCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showGoalSeek, setShowGoalSeek] = useState(false);
  
  // Goal Seek state - Basic
  const [gsBaseNumber, setGsBaseNumber] = useState("");
  const [gsGoalValue, setGsGoalValue] = useState("");
  const [gsOperation, setGsOperation] = useState("+");
  const [gsResult, setGsResult] = useState<{answer: number; calculation: string} | null>(null);

  // Goal Seek state - Advanced (Excel-like)
  const [advGsFormula, setAdvGsFormula] = useState("");
  const [advGsTarget, setAdvGsTarget] = useState("");
  const [advGsVariable, setAdvGsVariable] = useState("X");
  const [advGsResult, setAdvGsResult] = useState<{answer: number; result: number; iterations: number} | null>(null);

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operation) {
      const result = performCalculation(previousValue, currentValue, operation);
      setDisplay(result.toString());
      setPreviousValue(result);
    }

    setOperation(op);
    setWaitingForNewValue(true);
  };

  const performCalculation = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "*":
        return prev * current;
      case "/":
        return current === 0 ? 0 : prev / current;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const currentValue = parseFloat(display);
      const result = performCalculation(previousValue, currentValue, operation);
      
      // Add to history
      const calculation = `${previousValue} ${operation} ${currentValue}`;
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        calculation,
        result: result.toString(),
        timestamp: new Date(),
      };
      setHistory([historyItem, ...history]);
      
      setDisplay(result.toString());
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleBackspace = () => {
    if (display.length === 1) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleLoadFromHistory = (result: string) => {
    setDisplay(result);
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleGoalSeek = () => {
    const base = parseFloat(gsBaseNumber);
    const goal = parseFloat(gsGoalValue);

    if (isNaN(base) || isNaN(goal)) {
      return;
    }

    let answer: number;
    const op = gsOperation;

    switch (op) {
      case "+":
        answer = goal - base;
        break;
      case "-":
        answer = base - goal;
        break;
      case "*":
        answer = goal / base;
        break;
      case "/":
        answer = base / goal;
        break;
      default:
        answer = 0;
    }

    setGsResult({
      answer: Math.round(answer * 100000) / 100000,
      calculation: `${base} ${op} ${answer.toFixed(2)} = ${goal}`,
    });
  };

  // Advanced Excel-like Goal Seek with Newton-Raphson method
  const handleAdvancedGoalSeek = (formulaStr: string, targetVal: string, varName: string) => {
    try {
      const target = parseFloat(targetVal);
      if (isNaN(target)) return null;

      // Simple Newton-Raphson solver
      let x = 1;
      const maxIterations = 50;
      const tolerance = 0.0001;
      let iterations = 0;

      const evaluateFormula = (formula: string, varValue: number) => {
        try {
          // Safe evaluation with variable substitution
          let expr = formula.replace(/[A-Za-z]+/g, (match) => {
            if (match === varName) return varValue.toString();
            return "0";
          });
          // Remove spaces and evaluate
          expr = expr.replace(/\s/g, "");
          // Basic safety checks
          if (!/^[0-9+\-*/().,]+$/.test(expr)) return null;
          // Use Function constructor instead of eval
          const fn = new Function("return " + expr);
          const result = fn();
          return typeof result === "number" ? result : null;
        } catch {
          return null;
        }
      };

      while (iterations < maxIterations) {
        const fx = evaluateFormula(formulaStr, x);
        if (fx === null) return null;

        const error = Math.abs(fx - target);
        if (error < tolerance) {
          return {
            answer: Math.round(x * 100000) / 100000,
            result: Math.round(fx * 100000) / 100000,
            iterations,
          };
        }

        // Numerical derivative
        const h = 0.0001;
        const fxh = evaluateFormula(formulaStr, x + h);
        if (fxh === null) return null;

        const derivative = (fxh - fx) / h;
        if (Math.abs(derivative) < 0.0001) break; // Avoid division by near-zero

        x = x - (fx - target) / derivative;
        iterations++;
      }

      const fx = evaluateFormula(formulaStr, x);
      if (fx !== null && Math.abs(fx - target) < 0.1) {
        return {
          answer: Math.round(x * 100000) / 100000,
          result: Math.round(fx * 100000) / 100000,
          iterations,
        };
      }

      return null;
    } catch {
      return null;
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Numbers 0-9
      if (key >= "0" && key <= "9") {
        e.preventDefault();
        handleNumber(key);
        return;
      }

      // Decimal point
      if (key === ".") {
        e.preventDefault();
        handleDecimal();
        return;
      }

      // Operations
      if (key === "+" || key === "-") {
        e.preventDefault();
        handleOperation(key);
        return;
      }

      if (key === "*") {
        e.preventDefault();
        handleOperation("*");
        return;
      }

      if (key === "/" || key === "Divide") {
        e.preventDefault();
        handleOperation("/");
        return;
      }

      // Equals
      if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleEquals();
        return;
      }

      // Backspace
      if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // Clear
      if (key.toLowerCase() === "c") {
        e.preventDefault();
        handleClear();
        return;
      }

      // Escape to close
      if (key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [display, previousValue, operation, waitingForNewValue]);

  const buttons = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "=", "+"],
  ];

  return (
    <Card className="fixed bottom-6 right-6 w-80 shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex gap-1 flex-wrap">
          <Button
            size="sm"
            variant={!showHistory && !showGoalSeek ? "default" : "ghost"}
            onClick={() => {setShowHistory(false); setShowGoalSeek(false);}}
            className={!showHistory && !showGoalSeek ? "bg-white/20 text-white hover:bg-white/30" : "text-white hover:bg-white/20"}
          >
            Calc
          </Button>
          <Button
            size="sm"
            variant={showHistory ? "default" : "ghost"}
            onClick={() => {setShowHistory(true); setShowGoalSeek(false);}}
            className={`flex items-center gap-1 ${showHistory ? "bg-white/20 text-white hover:bg-white/30" : "text-white hover:bg-white/20"}`}
          >
            <HistoryIcon className="h-4 w-4" />
            Hist
          </Button>
          <Button
            size="sm"
            variant={showGoalSeek ? "default" : "ghost"}
            onClick={() => {setShowGoalSeek(true); setShowHistory(false);}}
            className={`flex items-center gap-1 ${showGoalSeek ? "bg-white/20 text-white hover:bg-white/30" : "text-white hover:bg-white/20"}`}
          >
            <Target className="h-4 w-4" />
            Goal
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-gray-900">
        {showGoalSeek ? (
          // Goal Seek View - with Excel-like advanced option
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!advGsFormula ? "default" : "outline"}
                onClick={() => setAdvGsFormula("")}
                className="text-xs flex-1"
              >
                Simple
              </Button>
              <Button
                size="sm"
                variant={advGsFormula !== undefined ? "default" : "outline"}
                onClick={() => setAdvGsFormula("X")}
                className="text-xs flex-1"
              >
                Advanced
              </Button>
            </div>

            {!advGsFormula ? (
              // Simple Goal Seek
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Base Number</label>
                  <Input
                    type="number"
                    value={gsBaseNumber}
                    onChange={(e) => setGsBaseNumber(e.target.value)}
                    placeholder="e.g., 10"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Operation</label>
                  <div className="grid grid-cols-4 gap-1">
                    {["+", "-", "*", "/"].map((op) => (
                      <Button
                        key={op}
                        variant={gsOperation === op ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGsOperation(op)}
                        className={`font-bold text-sm ${gsOperation === op ? "bg-blue-600 text-white" : ""}`}
                      >
                        {op}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Target Value</label>
                  <Input
                    type="number"
                    value={gsGoalValue}
                    onChange={(e) => setGsGoalValue(e.target.value)}
                    placeholder="e.g., 25"
                    className="text-sm"
                  />
                </div>

                <Button
                  onClick={handleGoalSeek}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                  disabled={!gsBaseNumber || !gsGoalValue}
                >
                  Find Answer
                </Button>

                {gsResult && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-2 border-blue-400">
                    <div className="text-xs text-muted-foreground mb-2">
                      {gsBaseNumber} {gsOperation} <span className="font-bold text-blue-600 dark:text-blue-400">{gsResult.answer}</span> = {gsGoalValue}
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {gsResult.answer}
                    </div>
                    <Button
                      onClick={() => {
                        setDisplay(gsResult.answer.toString());
                        setShowGoalSeek(false);
                      }}
                      size="sm"
                      className="mt-2 w-full text-xs"
                      variant="outline"
                    >
                      Use Result
                    </Button>
                  </div>
                )}
              </>
            ) : (
              // Advanced Excel-like Goal Seek
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Formula (e.g., X*2+5)</label>
                  <Input
                    value={advGsFormula}
                    onChange={(e) => setAdvGsFormula(e.target.value)}
                    placeholder="X*2+5 or (X-3)/2"
                    className="text-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Use X (or your variable) in formula</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Variable Name</label>
                  <Input
                    value={advGsVariable}
                    onChange={(e) => setAdvGsVariable(e.target.value.toUpperCase())}
                    placeholder="X"
                    maxLength={1}
                    className="text-sm text-center font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Target Result</label>
                  <Input
                    type="number"
                    value={advGsTarget}
                    onChange={(e) => setAdvGsTarget(e.target.value)}
                    placeholder="e.g., 50"
                    className="text-sm"
                  />
                </div>

                <Button
                  onClick={() => {
                    const result = handleAdvancedGoalSeek(advGsFormula, advGsTarget, advGsVariable);
                    if (result) {
                      setAdvGsResult(result);
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold"
                  disabled={!advGsFormula || !advGsTarget}
                >
                  Solve Formula
                </Button>

                {advGsResult && (
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded border-2 border-purple-400">
                    <div className="text-xs text-muted-foreground mb-2">
                      Formula: {advGsFormula}
                    </div>
                    <div className="text-xs font-mono mb-1">
                      {advGsVariable} = <span className="font-bold text-purple-600 dark:text-purple-400">{advGsResult.answer}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Result: {advGsResult.result} (iterations: {advGsResult.iterations})
                    </div>
                    <Button
                      onClick={() => {
                        setDisplay(advGsResult.answer.toString());
                        setShowGoalSeek(false);
                      }}
                      size="sm"
                      className="w-full text-xs"
                      variant="outline"
                    >
                      Use Result
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : !showHistory ? (
          // Calculator View
          <div className="space-y-3">
            {/* Operation Display */}
            {operation && previousValue !== null && (
              <div className="text-right text-sm text-muted-foreground">
                <span className="font-semibold">{previousValue}</span>
                <span className="mx-2 text-lg">{operation}</span>
              </div>
            )}
            
            <Input
              type="text"
              value={display}
              readOnly
              className="text-right text-2xl font-bold h-12"
              title="Calculator display"
            />

            {/* Keyboard Hints */}
            <div className="text-xs text-muted-foreground space-y-1 mb-2 p-2 bg-muted rounded">
              <p>Keyboard:</p>
              <p>0-9 | +/-/*/÷ | Enter/= | Backspace | C | Esc</p>
            </div>

            <div className="space-y-2">
              {buttons.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-4 gap-2">
                  {row.map((btn) => (
                    <button
                      key={btn}
                      onClick={() => {
                        if (btn === "=") handleEquals();
                        else if (btn === ".") handleDecimal();
                        else if (["+", "-", "*", "/"].includes(btn)) handleOperation(btn);
                        else handleNumber(btn);
                      }}
                      className={`p-2 rounded text-sm font-semibold transition-colors ${
                        btn === "="
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : ["+", "-", "*", "/"].includes(btn)
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                      title={btn === "=" ? "Equals (Enter)" : btn === "+" ? "Plus (+)" : btn === "-" ? "Minus (-)" : btn === "*" ? "Multiply (*)" : btn === "/" ? "Divide (/)" : btn === "." ? "Decimal (.)" : btn}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={handleBackspace}
                variant="outline"
                size="sm"
                className="text-xs"
                title="Delete (Backspace)"
              >
                ← Back
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                className="text-xs"
                title="Clear (C)"
              >
                Clear
              </Button>
            </div>
          </div>
        ) : (
          // History View
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No calculations yet</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Recent Calculations</h3>
                  <Button
                    onClick={handleClearHistory}
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLoadFromHistory(item.result)}
                      className="w-full text-left p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Click to load this result"
                    >
                      <div className="text-sm font-medium">{item.calculation}</div>
                      <div className="text-base font-semibold text-blue-600 dark:text-blue-400">
                        = {item.result}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.timestamp.toLocaleTimeString('en-IN')}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default React.memo(QuickCalculator);
