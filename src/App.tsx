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
    <div className="App">
      <header className="App-header">
        <h1>Загрузка изображений</h1>
        <p>Загрузите изображение в формате JPG или PNG</p>
      </header>
      <main>
          <ImageUploader
            uploadUrl="https://b.ip.rustprogersteam.ru:80/api/image"
            maxFileSize={10 * 1024 * 1024} 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
      </main>
    </div>
  )
}

export default App
