import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Lotes from './pages/Lotes';
import LoteDetail from './pages/LoteDetail';
import IngresarLote from './pages/IngresarLote';
import Operations from './pages/Operations';
import Scanner from './pages/Scanner';
import ProductDetail from './pages/ProductDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — requires authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            {/* Future routes */}
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/lotes/:id" element={<LoteDetail />} />
            <Route path="/productos/:sku" element={<ProductDetail />} />
            <Route path="/ingresar" element={<IngresarLote />} />
            
            <Route path="/operaciones" element={<Operations />} />
            
            {/* Rutas de Operaciones - Placeholders */}
            <Route path="/salida" element={<PlaceholderPage title="Salida a Exhibición" />} />
            <Route path="/merma" element={<PlaceholderPage title="Reporte de Merma" />} />
            <Route path="/baja-caducidad" element={<PlaceholderPage title="Baja por Caducidad" />} />
            <Route path="/reubicar" element={<PlaceholderPage title="Reubicación Interna" />} />
            <Route path="/rechazo" element={<PlaceholderPage title="Rechazo en Recepción" />} />
            <Route path="/alertas" element={<PlaceholderPage title="Panel de Alertas" />} />
            <Route path="/bloqueo" element={<PlaceholderPage title="Bloqueo de Lote" />} />
            <Route path="/desbloqueo" element={<PlaceholderPage title="Desbloqueo de Lote" />} />
            <Route path="/algoritmo" element={<PlaceholderPage title="Ajustar Algoritmo" />} />
            <Route path="/cierre" element={<PlaceholderPage title="Cierre Mensual" />} />
            <Route path="/auditoria" element={<PlaceholderPage title="Auditoría Cíclica" />} />
            <Route path="/trazabilidad-global" element={<PlaceholderPage title="Trazabilidad Total" />} />
            <Route path="/reporte-diario" element={<PlaceholderPage title="Reporte Diario" />} />
            <Route path="/usuarios" element={<PlaceholderPage title="Gestión de Usuarios" />} />

            {/* Other existing Placeholders */}
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/buzon" element={<PlaceholderPage title="Buzón" />} />
            <Route path="/herramientas" element={<PlaceholderPage title="Herramientas" />} />
            <Route path="/menu" element={<PlaceholderPage title="Menú" />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

/* Placeholder for future pages */
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <h1 className="text-xl font-bold text-text">{title}</h1>
        <p className="text-sm text-muted mt-2">Módulo en desarrollo — próxima fase</p>
      </div>
    </div>
  );
}
