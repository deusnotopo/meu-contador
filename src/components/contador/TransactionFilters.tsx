import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface TransactionFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filter: "all" | "income" | "expense";
  setFilter: (value: "all" | "income" | "expense") => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
}

export const TransactionFilters = ({
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  dateFilter,
  setDateFilter,
}: TransactionFiltersProps) => {
  return (
    <Card className="shadow-card border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter size={20} className="text-primary" />
          Filtros e Busca
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Buscar</Label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Descrição ou categoria..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tipo</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "secondary"}
                onClick={() => setFilter("all")}
                className={`flex-1 ${
                  filter === "all" ? "gradient-primary border-0" : ""
                }`}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={filter === "income" ? "default" : "secondary"}
                onClick={() => setFilter("income")}
                className={`flex-1 ${
                  filter === "income" ? "gradient-success border-0" : ""
                }`}
              >
                Receitas
              </Button>
              <Button
                size="sm"
                variant={filter === "expense" ? "default" : "secondary"}
                onClick={() => setFilter("expense")}
                className={`flex-1 ${
                  filter === "expense" ? "gradient-danger border-0" : ""
                }`}
              >
                Despesas
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Período</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
