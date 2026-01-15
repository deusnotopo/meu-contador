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
import { personalCategories } from "@/lib/constants";
import {
  ExtractedReceiptData,
  isValidImageFile,
  processReceiptImage,
} from "@/lib/ocr/tesseract-service";
import { loadTransactions, saveTransactions } from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import type { Transaction } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CheckCircle,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

interface ReceiptScannerProps {
  onClose: () => void;
  onTransactionCreated?: () => void;
}

export const ReceiptScanner = ({
  onClose,
  onTransactionCreated,
}: ReceiptScannerProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] =
    useState<ExtractedReceiptData | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!isValidImageFile(file)) {
      showError("Por favor, selecione uma imagem válida (JPG, PNG, WEBP)");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    setIsProcessing(true);
    try {
      const data = await processReceiptImage(file);
      setExtractedData(data);
      setFormData({
        amount: data.amount?.toString() || "",
        description: data.merchant || "",
        category: data.category || "Outros",
        date: data.date || new Date().toISOString().split("T")[0],
      });
      showSuccess(
        `Recibo processado! Confiança: ${Math.round(data.confidence)}%`
      );
    } catch (error) {
      showError("Erro ao processar recibo. Tente novamente.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTransaction = () => {
    if (!formData.amount || !formData.description || !formData.category) {
      showError("Preencha todos os campos obrigatórios.");
      return;
    }

    const transaction: Transaction = {
      id: Date.now(),
      amount: parseFloat(formData.amount),
      description: formData.description,
      type: "expense",
      category: formData.category,
      date: formData.date,
      context: "personal",
    };

    const transactions = loadTransactions();
    saveTransactions([...transactions, transaction]);

    showSuccess("Transação criada a partir do recibo!");
    onTransactionCreated?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <Card className="glass-premium border-white/10">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Camera className="text-indigo-400" size={24} />
                  Escanear Recibo
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-xl"
                >
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {!selectedImage ? (
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm">
                    Tire uma foto do recibo ou faça upload de uma imagem para
                    extrair os dados automaticamente.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => cameraInputRef.current?.click()}
                      className="h-32 flex-col gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30"
                    >
                      <Camera size={32} />
                      <span>Usar Câmera</span>
                    </Button>

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="h-32 flex-col gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30"
                    >
                      <Upload size={32} />
                      <span>Fazer Upload</span>
                    </Button>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileSelect(e.target.files[0])
                    }
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileSelect(e.target.files[0])
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={imagePreview}
                        alt="Receipt preview"
                        className="w-full h-48 object-cover"
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2
                              className="animate-spin text-indigo-400 mx-auto mb-2"
                              size={32}
                            />
                            <p className="text-sm text-white font-medium">
                              Processando recibo...
                            </p>
                          </div>
                        </div>
                      )}
                      {extractedData && !isProcessing && (
                        <div className="absolute top-2 right-2 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle size={14} />
                          {Math.round(extractedData.confidence * 100)}%
                          Confiança
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted Data Form */}
                  {extractedData && !isProcessing && (
                    <div className="space-y-4 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
                        <Sparkles size={16} />
                        Dados Extraídos - Revise e Confirme
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Valor (R$)</Label>
                          <Input
                            type="number"
                            value={formData.amount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                amount: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Data</Label>
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Estabelecimento</Label>
                        <Input
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Categoria</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {personalCategories.expense.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                            setExtractedData(null);
                          }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSaveTransaction}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                        >
                          Salvar Transação
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
