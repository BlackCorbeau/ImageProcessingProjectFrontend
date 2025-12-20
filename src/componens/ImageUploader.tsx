import React, { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import "./ImageUploader.css";

interface ModelResult {
  prediction: string;
  confidence: number;
}

interface UploadResponse {
  hog_svm: ModelResult;
  lbp_rf: ModelResult;
  cnn: ModelResult;
  best_model: "hog_svm" | "lbp_rf" | "cnn";
}

interface ImageUploaderProps {
  uploadUrl?: string;
  maxFileSize?: number; 
  allowedTypes?: string[];
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadError?: (error: Error) => void;
}

type ModelKey = keyof Omit<UploadResponse, 'best_model'>;

const ImageUploader: React.FC<ImageUploaderProps> = ({
  uploadUrl = "https://b.ip.rustprogersteam.ru:80/api/image",
  maxFileSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ["image/jpeg", "image/png", "image/jpg"],
  onUploadSuccess,
  onUploadError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setProgress(0);
    setResults(null); // Сбрасываем результаты при выборе нового файла

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError(`Поддерживаются только файлы: ${allowedTypes.join(", ")}`);
      return;
    }

    if (file.size > maxFileSize) {
      setError(
        `Файл слишком большой. Максимальный размер: ${
          maxFileSize / (1024 * 1024)
        }MB`
      );
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Пожалуйста, выберите файл");
      return;
    }

    setUploading(true);
    setError("");
    setProgress(0);
    setResults(null);

    /*const formData = new FormData();
    formData.append("image", selectedFile);*/

    try {
      const response = await axios.post<UploadResponse>(uploadUrl, selectedFile, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        },
      });

      console.log("Успешно загружено:", response.data);
      setResults(response.data);
      onUploadSuccess?.(response.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Ошибка при загрузке файла";
      setError(errorMessage);
      onUploadError?.(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setError("");
    setResults(null);
    const file = e.dataTransfer.files[0];

    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Пожалуйста, перетащите файл в формате JPG или PNG");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getPredictionLabel = (prediction: string): string => {
    const labels: Record<string, string> = {
      'with_mask': 'С маской',
      'without_mask': 'Без маски',
      'mask_weared_incorrect': 'Маска надета неправильно'
    };
    return labels[prediction] || prediction;
  };

  const getModelName = (modelKey: ModelKey): string => {
    const modelNames: Record<ModelKey, string> = {
      'hog_svm': 'HOG + SVM',
      'lbp_rf': 'LBP + Random Forest',
      'cnn': 'CNN (Нейронная сеть)'
    };
    return modelNames[modelKey] || modelKey;
  };

  const getModelIcon = (modelKey: ModelKey): string => {
    const icons: Record<ModelKey, string> = {
      'hog_svm': '🔍',
      'lbp_rf': '🌳',
      'cnn': '🧠'
    };
    return icons[modelKey] || '📊';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence >= 0.6) return 'medium-confidence';
    return 'low-confidence';
  };

  // Функция для получения списка моделей (исключая best_model)
  const getModelKeys = (): ModelKey[] => {
    return ['hog_svm', 'lbp_rf', 'cnn'];
  };

  return (
    <div className="image-uploader">
      <div
        className={`upload-area ${previewUrl ? "has-preview" : ""} ${results ? "has-results" : ""}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!selectedFile && !results ? triggerFileInput : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="file-input"
          disabled={uploading}
        />

        {results ? (
          <div className="results-container">
            <div className="preview-section">
              <img src={previewUrl} alt="Загруженное" className="preview-image" />
              <div className="best-model-result">
                <h3>🏆 Лучшая модель: {getModelName(results.best_model)}</h3>
                <div className={`final-prediction ${getConfidenceColor(results[results.best_model].confidence)}`}>
                  <span className="prediction-text">
                    {getPredictionLabel(results[results.best_model].prediction)}
                  </span>
                  <span className="confidence-badge">
                    {(results[results.best_model].confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="models-comparison">
              <h3>Сравнение моделей</h3>
              <div className="models-grid">
                {getModelKeys().map((modelKey) => {
                  const result = results[modelKey];
                  return (
                    <div 
                      key={modelKey} 
                      className={`model-card ${modelKey === results.best_model ? 'best-model-card' : ''}`}
                    >
                      <div className="model-header">
                        <span className="model-icon">{getModelIcon(modelKey)}</span>
                        <h4>{getModelName(modelKey)}</h4>
                        {modelKey === results.best_model && (
                          <span className="best-badge">🏆 Лучшая</span>
                        )}
                      </div>
                      <div className="model-result">
                        <div className="prediction-info">
                          <span className="prediction-label">Результат:</span>
                          <span className={`prediction-value ${getConfidenceColor(result.confidence)}`}>
                            {getPredictionLabel(result.prediction)}
                          </span>
                        </div>
                        <div className="confidence-info">
                          <span className="confidence-label">Уверенность:</span>
                          <div className="confidence-bar">
                            <div 
                              className={`confidence-fill ${getConfidenceColor(result.confidence)}`}
                              style={{ width: `${result.confidence * 100}%` }}
                            />
                          </div>
                          <span className="confidence-value">
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="preview-image" />
            <div className="file-info">
              <p>Выбран файл: {selectedFile?.name}</p>
              <p>Размер: {(selectedFile!.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <p>Перетащите сюда изображение или кликните для выбора</p>
            <p className="file-types">Поддерживаемые форматы: JPG, PNG</p>
            <p className="file-size">
              Максимальный размер: {maxFileSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {selectedFile && !uploading && !results && (
        <div className="upload-controls">
          <button onClick={triggerFileInput} className="btn btn-secondary">
            Выбрать другой файл
          </button>
          <button onClick={handleUpload} className="btn btn-primary">
            Загрузить на сервер
          </button>
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">{progress}%</div>
        </div>
      )}

      {results && (
        <div className="results-controls">
          <button onClick={resetUploader} className="btn btn-primary">
            Загрузить другое изображение
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
