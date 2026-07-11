import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PropertiesListPage } from './pages/PropertiesListPage';
import { PropertyFormPage } from './pages/PropertyFormPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PropertiesListPage />} />
        <Route path="/properties/new" element={<PropertyFormPage />} />
        <Route path="/properties/:code" element={<PropertyDetailPage />} />
        <Route path="/properties/:code/edit" element={<PropertyFormPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
