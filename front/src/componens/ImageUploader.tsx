import React, { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import "./ImageUploader.css";

interface ImageUploaderProps {
  uploadUrl?: string;
  maxFileSize?: number; 
  allowedTypes?: string[];
  onUploadSuccess?: (response: any) => void;
  onUploadError?: (error: Error) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  uploadUrl = "http://localhost:5000/api/upload",
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setProgress(0);

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

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post(uploadUrl, formData, {
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
      onUploadSuccess?.(response.data);

      setSelectedFile(null);
      setPreviewUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  return (
    <div className="image-uploader">
      <div
        className={`upload-area ${previewUrl ? "has-preview" : ""}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="file-input"
          disabled={uploading}
        />

        {previewUrl ? (
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

      {selectedFile && !uploading && (
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
    </div>
  );
};

export default ImageUploader;
