import ImageUploader from './componens/ImageUploader'
import './App.css'

function App() {
  const handleUploadSuccess = (response: any) => {
    alert(`Изображение успешно загружено! URL: ${response.imageUrl}`);
    console.log('Данные с сервера:', response);
  };

  const handleUploadError = (error: Error) => {
    console.error('Ошибка загрузки:', error);
  };
  return (
    <main>
        <ImageUploader
          uploadUrl="http://localhost:5000/api/upload"
          maxFileSize={10 * 1024 * 1024} 
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </main>
  )
}

export default App
